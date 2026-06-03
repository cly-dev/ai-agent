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

export function stripMarkdownFenceForBlocksParse(text: string): string {
  const trimmed = text.trim();
  const match = /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i.exec(trimmed);
  return match ? match[1].trim() : trimmed;
}

/** 避免 LLM 再输出与规则化结果同类型的 structured block。 */
export function filterLlmBlocksAvoidDuplicatingRule(
  ruleBlocks: MessageBlock[],
  llmBlocks: MessageBlock[],
): MessageBlock[] {
  const ruleStructuredTypes = new Set(
    ruleBlocks.filter(isStructuredMessageBlock).map((block) => block.type),
  );
  return llmBlocks.filter((block) => {
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

export function serializeMessageBlocksForStorage(
  blocks: MessageBlock[],
): string {
  const normalized = normalizeMessageBlocks(blocks);
  return JSON.stringify({ blocks: normalized });
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

function extractListRows(output: unknown): Record<string, unknown>[] {
  if (Array.isArray(output)) {
    return output.filter(
      (row): row is Record<string, unknown> =>
        row != null && typeof row === 'object' && !Array.isArray(row),
    );
  }
  if (!output || typeof output !== 'object') {
    return [];
  }
  const row = output as Record<string, unknown>;
  for (const key of ['data', 'list', 'items', 'records', 'rows']) {
    const candidate = row[key];
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate.filter(
        (item): item is Record<string, unknown> =>
          item != null && typeof item === 'object' && !Array.isArray(item),
      );
    }
  }
  return [];
}

function labelForKey(
  key: string,
  fieldLabels: Record<string, string>,
): string {
  return fieldLabels[key] ?? fieldLabels[`data.${key}`] ?? key;
}

export function tryBuildTableBlockFromOutput(
  output: unknown,
  fieldLabels: Record<string, string>,
  maxRows = 50,
): MessageBlock | null {
  const rows = extractListRows(output);
  if (rows.length < 2) {
    return null;
  }
  const keys = new Set<string>();
  for (const row of rows.slice(0, 5)) {
    for (const key of Object.keys(row)) {
      if (!key.startsWith('_')) {
        keys.add(key);
      }
    }
  }
  const columnKeys = [...keys].slice(0, 12);
  if (columnKeys.length === 0) {
    return null;
  }
  const columns: TableColumn[] = columnKeys.map((key) => ({
    key,
    label: labelForKey(key, fieldLabels),
  }));
  const data = rows.slice(0, maxRows).map((row) => {
    const out: Record<string, unknown> = {};
    for (const key of columnKeys) {
      const val = row[key];
      out[key] =
        val == null
          ? ''
          : typeof val === 'object'
            ? JSON.stringify(val)
            : String(val);
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
}): MessageBlock[] {
  if (input.toolErrorHint) {
    return [
      {
        type: 'alert',
        severity: 'error',
        title: '操作未成功',
        message: input.toolErrorHint,
      },
    ];
  }
  const hint = inferRenderHint(input.userMessage);
  const blocks: MessageBlock[] = [];
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
