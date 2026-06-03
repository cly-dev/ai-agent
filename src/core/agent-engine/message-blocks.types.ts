/** Message Blocks 协议（与前端 message-blocks 技术方案 v1.0 对齐）。 */

export type TextBlock = {
  type: 'text';
  content: string;
  format?: 'markdown' | 'plain' | 'html';
};

export type ListBlockItem = {
  text: string;
  checked?: boolean;
};

export type ListBlock = {
  type: 'list';
  title?: string;
  listType?: 'bullet' | 'ordered' | 'checklist';
  items: ListBlockItem[];
};

export type QuoteBlock = {
  type: 'quote';
  content: string;
  source?: string;
  url?: string;
};

export type CodeBlock = {
  type: 'code';
  language?: string;
  filename?: string;
  content: string;
};

export type ChartBlock = {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie';
  title?: string;
  xAxis: string[];
  series: Array<{ name: string; values: number[] }>;
};

export type TableColumn = {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
};

export type TableBlock = {
  type: 'table';
  title?: string;
  columns: TableColumn[];
  data: Array<Record<string, unknown>>;
};

export type MetricBlockItem = {
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
};

export type MetricBlock = {
  type: 'metric';
  items: MetricBlockItem[];
};

export type AlertBlock = {
  type: 'alert';
  severity: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  message: string;
};

export type ImageBlock = {
  type: 'image';
  url: string;
  alt?: string;
  caption?: string;
  width?: string;
};

export type LoadingBlock = {
  type: 'loading';
  id: string;
  hint?: string;
};

/** SSE patch：用 replaceId 替换此前 loading 占位，不推全量 blocks。 */
export type MessageBlockPatch = {
  replaceId: string;
  block: Exclude<MessageBlock, LoadingBlock>;
};

export type MessageBlock =
  | TextBlock
  | ListBlock
  | QuoteBlock
  | CodeBlock
  | ChartBlock
  | TableBlock
  | MetricBlock
  | AlertBlock
  | ImageBlock
  | LoadingBlock;

export type MessageBlocksPayload = {
  blocks: MessageBlock[];
};

export type RenderPlanHint = 'text' | 'table' | 'chart' | 'metric' | 'list';
