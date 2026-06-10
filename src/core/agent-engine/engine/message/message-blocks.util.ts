import {
  collectNotableExamplesFromPageSummaries,
  mergeMapReduceObservationOutputs,
  readMapReduceFromObservation,
} from '../gather/list-map-reduce.util';
import { formatResponseSourceForDisplay } from '../agent-run-user-messages.util';
import { sanitizeTextForStorage } from '../llm-output-sanitize.util';
import {
  messageBlockSchema,
  messageBlocksPayloadSchema,
} from './message-blocks.schema';
import type {
  LoadingBlock,
  MessageBlock,
  MessageBlockPatch,
  RenderPlanHint,
  TableColumn,
} from './message-blocks.types';

const STRUCTURED_BLOCK_TYPES = new Set<MessageBlock['type']>([
  'list',
  'quote',
  'code',
  'chart',
  'table',
  'metric',
  'alert',
  'image',
]);

export function isStructuredMessageBlock(
  block: MessageBlock,
): block is Exclude<MessageBlock, { type: 'text' } | { type: 'loading' }> {
  return STRUCTURED_BLOCK_TYPES.has(block.type);
}

export function loadingHintForStructuredBlock(block: MessageBlock): string {
  switch (block.type) {
    case 'table':
      return '表格加载中…';
    case 'chart':
      return '图表加载中…';
    case 'metric':
      return '指标加载中…';
    case 'list':
      return '列表加载中…';
    case 'alert':
      return '提示加载中…';
    case 'image':
      return '图片加载中…';
    case 'code':
      return '代码加载中…';
    case 'quote':
      return '引用加载中…';
    default:
      return '内容加载中…';
  }
}

/** 为 table/chart 等非 text block 生成 loading 占位与后续 patch 计划。 */
/** 已有 table/chart 等规则化 block 时，LLM 流应缓冲，勿推 token delta。 */
export function shouldBufferSummarizeLlmStream(ruleBlocks: MessageBlock[]): boolean {
  return ruleBlocks.some(isStructuredMessageBlock);
}

/** 流式累积内容是否像 blocks JSON / 代码围栏（勿当正文 token 推送）。 */
export function looksLikeBlocksJsonOutput(text: string): boolean {
  const trimmed = text.trimStart();
  if (!trimmed) {
    return false;
  }
  if (trimmed.startsWith('```')) {
    return true;
  }
  if (
    trimmed.startsWith('{') &&
    (trimmed.includes('"blocks"') || trimmed.includes("'blocks'"))
  ) {
    return true;
  }
  return false;
}

/** summarize 流式输出是否应缓冲（勿按 token 推 message delta）。 */
export function shouldBufferSummarizeStreamOutput(text: string): boolean {
  if (looksLikeBlocksJsonOutput(text)) {
    return true;
  }
  const trimmed = text.trimStart();
  // 以 `{` 开头时多为 blocks JSON，在见到 "blocks" 前先缓冲，避免把 JSON 碎片推给前端
  return trimmed.startsWith('{');
}

export function stripMarkdownFenceForBlocksParse(text: string): string {
  const trimmed = text.trim();
  const match = /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i.exec(trimmed);
  return match ? match[1].trim() : trimmed;
}

function looksLikeMarkdownPipeTable(content: string): boolean {
  const lines = content
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const pipeLines = lines.filter(
    (line) => (line.match(/\|/g) ?? []).length >= 2,
  );
  return pipeLines.length >= 2;
}

function textEchoesRuleTable(
  ruleBlocks: MessageBlock[],
  content: string,
): boolean {
  const table = ruleBlocks.find(
    (block): block is Extract<MessageBlock, { type: 'table' }> =>
      block.type === 'table',
  );
  if (!table || !looksLikeMarkdownPipeTable(content)) {
    return false;
  }
  const headerLine =
    content
      .trim()
      .split('\n')
      .find((line) => line.includes('|'))
      ?.trim() ?? '';
  if (!headerLine) {
    return false;
  }
  const labelHits = table.columns.filter(
    (column) =>
      headerLine.includes(column.label) || headerLine.includes(column.key),
  ).length;
  return labelHits >= Math.min(2, table.columns.length);
}

function isOnlyMarkdownPipeTableEcho(content: string): boolean {
  if (!looksLikeMarkdownPipeTable(content)) {
    return false;
  }
  const lines = content
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const proseLines = lines.filter(
    (line) =>
      (line.match(/\|/g) ?? []).length < 2 &&
      line.length >= 20 &&
      !/^[-|:\s]+$/.test(line),
  );
  if (proseLines.length > 0) {
    return false;
  }
  if (/^#{1,3}\s/m.test(content)) {
    return false;
  }
  return true;
}

/** 去掉 text 中与 rule table 重复的 markdown pipe 表格，保留分析正文。 */
export function normalizeSupplementaryTextContent(
  content: string,
  ruleBlocks: MessageBlock[],
): string {
  if (!ruleBlocks.some((block) => block.type === 'table')) {
    return content.trim();
  }
  if (!looksLikeMarkdownPipeTable(content)) {
    return content.trim();
  }
  const lines = content.split('\n');
  const kept = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return true;
    }
    if ((trimmed.match(/\|/g) ?? []).length < 2) {
      return true;
    }
    return !textEchoesRuleTable(ruleBlocks, trimmed);
  });
  return kept.join('\n').trim();
}

function isRedundantSummarizeTextBlock(
  content: string,
  ruleBlocks: MessageBlock[] = [],
): boolean {
  const trimmed = content.trim();
  if (!trimmed) {
    return true;
  }
  if (looksLikeBlocksJsonOutput(trimmed)) {
    return true;
  }
  if (/^data\s*\|/im.test(trimmed) && trimmed.includes('[{"')) {
    return true;
  }
  if (trimmed.startsWith('[{') && trimmed.includes('"id"')) {
    return true;
  }
  if (isOnlyMarkdownPipeTableEcho(trimmed)) {
    return true;
  }
  if (ruleBlocks.length > 0 && textEchoesRuleTable(ruleBlocks, trimmed)) {
    return true;
  }
  return false;
}

/** 落库前去掉与 rule table 重复的 text block。 */
export function stripRedundantSummarizeTextBlocks(
  ruleBlocks: MessageBlock[],
  blocks: MessageBlock[],
): MessageBlock[] {
  const hasRuleTable = ruleBlocks.some((block) => block.type === 'table');
  if (!hasRuleTable) {
    return blocks;
  }
  return blocks.filter((block) => {
    if (block.type !== 'text') {
      return true;
    }
    return !isRedundantSummarizeTextBlock(block.content, ruleBlocks);
  });
}

/** summarize 落库 blocks：合并 rule + LLM，去掉重复 table/text。 */
export function mergeSummarizeBlocksForStorage(
  ruleBlocks: MessageBlock[],
  llmBlocks: MessageBlock[],
  fallbackPlainText: string,
): MessageBlock[] {
  const normalizedLlm = llmBlocks.map((block) => {
    if (block.type !== 'text') {
      return block;
    }
    const normalized = normalizeSupplementaryTextContent(
      block.content,
      ruleBlocks,
    );
    return normalized ? { ...block, content: normalized } : block;
  });
  const filteredLlm = filterLlmBlocksAvoidDuplicatingRule(
    ruleBlocks,
    normalizedLlm,
  );
  const fallback = ruleBlocks.some(isStructuredMessageBlock)
    ? ''
    : fallbackPlainText;
  const merged = mergeMessageBlocks(
    ruleBlocks,
    ensureAtLeastOneTextBlock(filteredLlm, fallback),
  );
  return stripRedundantSummarizeTextBlocks(ruleBlocks, merged);
}

/**
 * 将已通过 SSE delta 推送的分析正文补入落库 blocks。
 * 常见于：先流式输出 prose，随后 LLM 转向 blocks JSON，落库路径丢失 delta 正文。
 */
export function mergeStreamedDeltaTextForStorage(
  ruleBlocks: MessageBlock[],
  llmBlocks: MessageBlock[],
  streamedMessageText: string,
): MessageBlock[] {
  const trimmed = streamedMessageText.trim();
  if (!trimmed) {
    return llmBlocks;
  }
  const normalized = normalizeSupplementaryTextContent(trimmed, ruleBlocks);
  if (!normalized) {
    return llmBlocks;
  }
  const alreadyStored = llmBlocks.some(
    (block) =>
      block.type === 'text' &&
      block.content.trim().length > 0 &&
      (block.content.includes(normalized.slice(0, 64)) ||
        normalized.includes(block.content.trim().slice(0, 64))),
  );
  if (alreadyStored) {
    return llmBlocks;
  }
  const deltaBlocks = filterLlmBlocksAvoidDuplicatingRule(ruleBlocks, [
    textBlock(normalized, 'markdown'),
  ]);
  if (deltaBlocks.length === 0) {
    return llmBlocks;
  }
  return [...llmBlocks, ...deltaBlocks];
}

/** 避免 LLM 再输出与规则化结果同类型的 structured block。 */
export function filterLlmBlocksAvoidDuplicatingRule(
  ruleBlocks: MessageBlock[],
  llmBlocks: MessageBlock[],
): MessageBlock[] {
  const ruleStructuredTypes = new Set(
    ruleBlocks.filter(isStructuredMessageBlock).map((block) => block.type),
  );
  const hasRuleTable = ruleBlocks.some((block) => block.type === 'table');
  return llmBlocks.filter((block) => {
    if (block.type === 'text' && hasRuleTable) {
      return !isRedundantSummarizeTextBlock(block.content, ruleBlocks);
    }
    if (!isStructuredMessageBlock(block)) {
      return true;
    }
    return !ruleStructuredTypes.has(block.type);
  });
}

export function planStructuredBlockStreaming(
  runId: number,
  blocks: MessageBlock[],
): { placeholders: LoadingBlock[]; patches: MessageBlockPatch[] } {
  const placeholders: LoadingBlock[] = [];
  const patches: MessageBlockPatch[] = [];
  let index = 0;
  for (const block of normalizeMessageBlocks(blocks)) {
    if (!isStructuredMessageBlock(block)) {
      continue;
    }
    const replaceId = `blk-${runId}-${index}`;
    index += 1;
    placeholders.push({
      type: 'loading',
      id: replaceId,
      hint: loadingHintForStructuredBlock(block),
    });
    patches.push({ replaceId, block });
  }
  return { placeholders, patches };
}

const TABLE_KEYWORDS = /表格|列表|明细|一览|清单|排行|对比表/i;
const CHART_KEYWORDS = /图表|趋势|折线|柱状|饼图|可视化|曲线/i;
const METRIC_KEYWORDS = /指标|kpi|概览|总览|汇总数据/i;

export function inferRenderHint(userMessage: string): RenderPlanHint {
  const text = userMessage.trim();
  if (CHART_KEYWORDS.test(text)) {
    return 'chart';
  }
  if (TABLE_KEYWORDS.test(text)) {
    return 'table';
  }
  if (METRIC_KEYWORDS.test(text)) {
    return 'metric';
  }
  return 'text';
}

export function normalizeMessageBlocks(blocks: MessageBlock[]): MessageBlock[] {
  const out: MessageBlock[] = [];
  for (const raw of blocks) {
    const parsed = messageBlockSchema.safeParse(raw);
    if (parsed.success) {
      out.push(parsed.data as MessageBlock);
    }
  }
  return out;
}

export function parseMessageBlocksPayload(
  value: unknown,
): MessageBlock[] | null {
  const parsed = messageBlocksPayloadSchema.safeParse(value);
  if (parsed.success) {
    return parsed.data.blocks as MessageBlock[];
  }
  return null;
}

export function tryParseStoredMessageBlocks(
  value: string,
): MessageBlock[] | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith('{')) {
    return null;
  }
  try {
    return parseMessageBlocksPayload(JSON.parse(trimmed));
  } catch {
    return null;
  }
}

/**
 * 从 summarize LLM 原始输出解析 blocks。
 * 须在整段 JSON 上解析后再做 block 级 sanitize，避免 think-strip 破坏 payload。
 */
export function tryParseLlmBlocksFromSummarizeOutput(
  value: string,
): MessageBlock[] | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const candidates = new Set<string>();
  const fenced = stripMarkdownFenceForBlocksParse(trimmed);
  candidates.add(fenced);
  if (fenced !== trimmed) {
    candidates.add(trimmed);
  }
  const embedded = trimmed.match(/\{[\s\S]*"blocks"\s*:\s*\[[\s\S]*\]\s*\}/);
  if (embedded?.[0]) {
    candidates.add(embedded[0]);
  }
  for (const candidate of candidates) {
    const parsed = tryParseStoredMessageBlocks(candidate);
    if (parsed?.length) {
      return parsed;
    }
  }
  return null;
}

function sanitizeMessageBlock(block: MessageBlock): MessageBlock {
  switch (block.type) {
    case 'text':
      return { ...block, content: sanitizeTextForStorage(block.content) };
    case 'quote':
      return { ...block, content: sanitizeTextForStorage(block.content) };
    case 'code':
      return { ...block, content: sanitizeTextForStorage(block.content) };
    case 'alert':
      return {
        ...block,
        message: sanitizeTextForStorage(block.message),
        title: block.title
          ? sanitizeTextForStorage(block.title)
          : block.title,
      };
    case 'list':
      return {
        ...block,
        title: block.title
          ? sanitizeTextForStorage(block.title)
          : block.title,
        items: block.items.map((item) => ({
          ...item,
          text: sanitizeTextForStorage(item.text),
        })),
      };
    default:
      return block;
  }
}

/** 落库前逐 block 剥离思考标签内容。 */
export function sanitizeMessageBlocks(blocks: MessageBlock[]): MessageBlock[] {
  return normalizeMessageBlocks(blocks).map(sanitizeMessageBlock);
}

export function serializeMessageBlocksForStorage(
  blocks: MessageBlock[],
): string {
  const sanitized = sanitizeMessageBlocks(blocks);
  return JSON.stringify({ blocks: sanitized });
}

/** 最终落库字符串：支持 message blocks JSON 与纯文本。 */
export function sanitizeStoredFinalOutput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  const blocks = tryParseStoredMessageBlocks(trimmed);
  if (blocks?.length) {
    return serializeMessageBlocksForStorage(blocks);
  }
  return sanitizeTextForStorage(trimmed);
}

export function messageBlocksToPlainText(blocks: MessageBlock[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case 'text':
        parts.push(block.content);
        break;
      case 'list': {
        const prefix =
          block.listType === 'ordered'
            ? (i: number) => `${i + 1}. `
            : () => '- ';
        block.items.forEach((item, i) => {
          const mark =
            block.listType === 'checklist'
              ? item.checked
                ? '[x] '
                : '[ ] '
              : prefix(i);
          parts.push(`${mark}${item.text}`);
        });
        break;
      }
      case 'quote':
        parts.push(`> ${block.content}`);
        break;
      case 'code':
        parts.push('```\n' + block.content + '\n```');
        break;
      case 'table': {
        if (block.title) {
          parts.push(block.title);
        }
        const header = block.columns.map((c) => c.label).join(' | ');
        parts.push(header);
        for (const row of block.data.slice(0, 20)) {
          parts.push(
            block.columns
              .map((c) => String(row[c.key] ?? ''))
              .join(' | '),
          );
        }
        break;
      }
      case 'chart':
        parts.push(
          block.title
            ? `${block.title}: ${block.xAxis.join(', ')}`
            : block.xAxis.join(', '),
        );
        break;
      case 'metric':
        for (const item of block.items) {
          parts.push(`${item.label}: ${item.value}${item.delta ? ` (${item.delta})` : ''}`);
        }
        break;
      case 'alert':
        parts.push(
          [block.title, block.message].filter(Boolean).join(': '),
        );
        break;
      case 'image':
        parts.push(block.caption ?? block.alt ?? block.url);
        break;
      case 'loading':
        parts.push(block.hint ?? '加载中…');
        break;
      default:
        break;
    }
  }
  return parts.filter((p) => p.trim().length > 0).join('\n\n').trim();
}

export function mergeMessageBlocks(
  primary: MessageBlock[],
  secondary: MessageBlock[],
): MessageBlock[] {
  const seen = new Set<string>();
  const merged = [...primary, ...secondary].filter((block) => {
    const key = JSON.stringify(block);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
  return normalizeMessageBlocks(merged);
}

const LIST_ROW_KEYS = ['data', 'list', 'items', 'records', 'rows'] as const;
const LIST_META_KEYS = new Set([
  'total',
  'count',
  'page',
  'pageSize',
  'pages',
  'matchedCount',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function looksLikeListContainer(row: Record<string, unknown>): boolean {
  return LIST_ROW_KEYS.some((key) => {
    const candidate = row[key];
    return Array.isArray(candidate) && candidate.length > 0;
  });
}

function normalizeListRowCandidate(item: unknown): Record<string, unknown>[] {
  if (!isRecord(item)) {
    return [];
  }
  if (Object.keys(item).length === 0) {
    return [];
  }
  if (looksLikeListContainer(item)) {
    return extractListRows(item);
  }
  return [item];
}

function normalizeListRowObjects(items: unknown[]): Record<string, unknown>[] {
  const merged: Record<string, unknown>[] = [];
  for (const item of items) {
    merged.push(...normalizeListRowCandidate(item));
  }
  return merged;
}

/** 从工具输出（含分页容器或多段合并结果）提取表格行。 */
export function extractListRowsFromToolOutput(
  output: unknown,
): Record<string, unknown>[] {
  if (Array.isArray(output)) {
    return normalizeListRowObjects(output);
  }
  if (!isRecord(output)) {
    return [];
  }
  for (const key of LIST_ROW_KEYS) {
    const candidate = output[key];
    if (Array.isArray(candidate) && candidate.length > 0) {
      return normalizeListRowObjects(candidate);
    }
  }
  return [];
}

function isMapReduceToolOutput(output: unknown): output is Record<string, unknown> {
  return isRecord(output) && isRecord(output.__mapReduce);
}

/** 多工具观测合并为单一列表容器，供 summarize / 规则化 table 使用。 */
export function mergeToolOutputsForSummary(outputs: unknown[]): unknown {
  if (outputs.length === 0) {
    return null;
  }
  if (outputs.length === 1) {
    return outputs[0];
  }
  const mapReduceOutputs = outputs.filter(isMapReduceToolOutput);
  if (mapReduceOutputs.length > 0) {
    const mergedMapReduce = mergeMapReduceObservationOutputs(mapReduceOutputs);
    const nonMapReduce = outputs.filter((row) => !isMapReduceToolOutput(row));
    if (nonMapReduce.length === 0) {
      return mergedMapReduce ?? mapReduceOutputs[0];
    }
    const legacy = mergeToolOutputsForSummary(nonMapReduce);
    if (legacy == null) {
      return mergedMapReduce ?? mapReduceOutputs[0];
    }
    if (mergedMapReduce) {
      return {
        ...mergedMapReduce,
        relatedOutputs: nonMapReduce,
      };
    }
    return legacy;
  }
  const rows: Record<string, unknown>[] = [];
  let total: number | undefined;
  for (const output of outputs) {
    rows.push(...extractListRowsFromToolOutput(output));
    if (isRecord(output) && typeof output.total === 'number') {
      total = Math.max(total ?? 0, output.total);
    }
  }
  if (rows.length === 0) {
    return outputs;
  }
  return {
    data: rows,
    total: total ?? rows.length,
  };
}

function extractListRows(output: unknown): Record<string, unknown>[] {
  return extractListRowsFromToolOutput(output);
}

function isContainerOnlyColumnKeys(keys: string[]): boolean {
  const meaningful = keys.filter(
    (key) => key !== 'data' && !LIST_META_KEYS.has(key),
  );
  return meaningful.length === 0;
}

function labelForKey(
  key: string,
  fieldLabels: Record<string, string>,
): string {
  return fieldLabels[key] ?? fieldLabels[`data.${key}`] ?? key;
}

function formatTableCellValue(val: unknown): string {
  if (val == null) {
    return '';
  }
  if (Array.isArray(val)) {
    if (val.length === 0) {
      return '';
    }
    if (
      val.every(
        (item) =>
          item != null &&
          typeof item === 'object' &&
          !Array.isArray(item) &&
          'type' in (item as Record<string, unknown>),
      )
    ) {
      return String(val.length);
    }
    return JSON.stringify(val);
  }
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val);
}

function tryBuildMapReduceMetricBlock(
  output: unknown,
): MessageBlock | null {
  const state = readMapReduceFromObservation(output);
  if (!state) {
    return null;
  }
  const items: Array<{ label: string; value: string }> = [
    {
      label: '已分析条数',
      value: String(state.fetchedCount),
    },
  ];
  if (state.total != null) {
    items.push({ label: '全量总数', value: String(state.total) });
  }
  if (state.truncatedByMaxRows === true) {
    items.push({
      label: '分析上限',
      value: `${state.maxRows} 条（样本分析）`,
    });
  }
  items.push({
    label: '页内摘要',
    value: `${state.pageSummaries.filter((row) => row.summary != null).length}/${state.pageCount}`,
  });
  return { type: 'metric', items };
}

function tryBuildMapReduceExamplesTable(
  output: unknown,
): MessageBlock | null {
  const state = readMapReduceFromObservation(output);
  if (!state) {
    return null;
  }
  const rows = collectNotableExamplesFromPageSummaries(state.pageSummaries, 12);
  if (rows.length === 0) {
    return null;
  }
  return {
    type: 'table',
    title: '典型样例',
    columns: [
      { key: 'page', label: '页码' },
      { key: 'id', label: 'ID' },
      { key: 'note', label: '说明' },
    ],
    data: rows.map((row) => ({
      page: row.page != null ? String(row.page) : '',
      id: row.id != null ? String(row.id) : '',
      note: typeof row.note === 'string' ? row.note : '',
    })),
  };
}

export function tryBuildTableBlockFromOutput(
  output: unknown,
  fieldLabels: Record<string, string>,
  maxRows = 50,
): MessageBlock | null {
  const mapReduceTable = tryBuildMapReduceExamplesTable(output);
  if (mapReduceTable) {
    return mapReduceTable;
  }
  const rows = extractListRows(output);
  if (rows.length < 1) {
    return null;
  }
  const keys = new Set<string>();
  for (const row of rows.slice(0, 5)) {
    for (const key of Object.keys(row)) {
      if (!key.startsWith('_') && !LIST_META_KEYS.has(key)) {
        keys.add(key);
      }
    }
  }
  const columnKeys = [...keys].slice(0, 12);
  if (columnKeys.length === 0 || isContainerOnlyColumnKeys(columnKeys)) {
    return null;
  }
  const columns: TableColumn[] = columnKeys.map((key) => ({
    key,
    label: labelForKey(key, fieldLabels),
  }));
  const data = rows.slice(0, maxRows).map((row) => {
    const out: Record<string, unknown> = {};
    for (const key of columnKeys) {
      out[key] = formatTableCellValue(row[key]);
    }
    return out;
  });
  return {
    type: 'table',
    columns,
    data,
  };
}

function pickNumericSeries(
  rows: Record<string, unknown>[],
): { xAxis: string[]; series: { name: string; values: number[] }[] } | null {
  if (rows.length < 2) {
    return null;
  }
  const labelKey =
    ['name', 'title', 'label', 'date', 'month', 'day', 'product'].find((k) =>
      rows.every((r) => r[k] != null && String(r[k]).trim().length > 0),
    ) ?? Object.keys(rows[0] ?? {})[0];
  if (!labelKey) {
    return null;
  }
  const numericKeys = Object.keys(rows[0] ?? {}).filter((key) => {
    if (key === labelKey) {
      return false;
    }
    return rows.every((r) => {
      const n = Number(r[key]);
      return !Number.isNaN(n);
    });
  });
  if (numericKeys.length === 0) {
    return null;
  }
  const key = numericKeys[0];
  const xAxis = rows.map((r) => String(r[labelKey] ?? ''));
  const values = rows.map((r) => Number(r[key]));
  return {
    xAxis,
    series: [{ name: key, values }],
  };
}

export function tryBuildChartBlockFromOutput(
  output: unknown,
  userMessage: string,
): MessageBlock | null {
  if (!CHART_KEYWORDS.test(userMessage)) {
    return null;
  }
  const rows = extractListRows(output);
  const series = pickNumericSeries(rows);
  if (!series) {
    return null;
  }
  return {
    type: 'chart',
    chartType: 'bar',
    xAxis: series.xAxis,
    series: series.series,
  };
}

export function buildRuleBasedMessageBlocks(input: {
  output: unknown;
  userMessage: string;
  fieldLabels: Record<string, string>;
  toolErrorHint?: string | null;
  downstreamResponseSource?: unknown;
}): MessageBlock[] {
  if (input.toolErrorHint) {
    const blocks: MessageBlock[] = [
      {
        type: 'alert',
        severity: 'error',
        title: '操作未成功',
        message: input.toolErrorHint,
      },
    ];
    if (input.downstreamResponseSource != null) {
      const sourceText = formatResponseSourceForDisplay(
        input.downstreamResponseSource,
      );
      if (sourceText) {
        blocks.push({
          type: 'text',
          content: `下游响应源数据：\n\`\`\`json\n${sourceText}\n\`\`\``,
          format: 'markdown',
        });
      }
    }
    return blocks;
  }
  const hint = inferRenderHint(input.userMessage);
  const blocks: MessageBlock[] = [];
  const mapReduceMetric = tryBuildMapReduceMetricBlock(input.output);
  if (mapReduceMetric) {
    blocks.push(mapReduceMetric);
  }
  if (hint === 'table' || hint === 'text') {
    const table = tryBuildTableBlockFromOutput(
      input.output,
      input.fieldLabels,
    );
    if (table) {
      blocks.push(table);
    }
  }
  if (hint === 'chart') {
    const chart = tryBuildChartBlockFromOutput(
      input.output,
      input.userMessage,
    );
    if (chart) {
      blocks.push(chart);
    }
  }
  return blocks;
}

export function textBlock(
  content: string,
  format: 'markdown' | 'plain' = 'markdown',
): MessageBlock {
  return { type: 'text', content, format };
}

export function ensureAtLeastOneTextBlock(
  blocks: MessageBlock[],
  fallbackText: string,
): MessageBlock[] {
  const normalized = normalizeMessageBlocks(blocks);
  if (normalized.length > 0) {
    return normalized;
  }
  return [textBlock(fallbackText)];
}
