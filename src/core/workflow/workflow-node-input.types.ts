import type { WorkflowActionKind } from './workflow.types';

export type WorkflowFetchCompleteWhen = 'first_success' | 'fetch_all_pages';

export type WorkflowSummarizeMode = 'brief' | 'detailed' | 'draft' | 'final';

/**
 * 状态识别节点 input：状态目录在出边 clue（key+description）上；
 * hint 仅补充判定口径（薄 Policy）。
 */
export type DetectCluesNodeInput = {
  hint?: string;
};

/** 图片 URL 候选来源：默认只扫上游节点输出。 */
export type SummarizeImagesFrom = 'upstream' | 'page_context' | 'all';

export type SummarizeImagesOnFailure = 'degrade' | 'fail';

/**
 * 图片识别节点：显式 opt-in；按实体组识图（文+图绑定），非整包摊平 URL。
 * @see lower / Intent images capability（B 端见 v2/docs/b-end-flow-admin-guide.md）
 */
export type SummarizeImagesNodeInput = {
  /** URL 扫描范围；默认 upstream */
  from?: SummarizeImagesFrom;
  /** 全局最多识图像素数（各组之和），默认 6 */
  maxCells?: number;
  /** 最多处理多少个实体组（列表条数上限），默认 5 */
  maxGroups?: number;
  /** 每组最多几张图，默认 2 */
  maxCellsPerGroup?: number;
  /** 正方形格边长 px，默认 512 */
  cellPx?: number;
  /** 追加给视觉模型的业务提示 */
  hint?: string;
  /** 识图失败策略；默认 degrade */
  onFailure?: SummarizeImagesOnFailure;
  /** 同 URL 摘要缓存 TTL（秒）；默认 86400；0=禁用 */
  cacheTtlSec?: number;
};

export type FetchDataNodeInput = {
  /**
   * 候选 HTTP Tool（ReAct / Page 从中选择）。
   * 至少 1 个；可与遗留 `toolId` 并存，解析时优先本字段。
   */
  toolIds?: number[];
  /** @deprecated 使用 toolIds；单绑兼容，等价 toolIds:[toolId] */
  toolId?: number;
  definitionKey?: string;
  completeWhen?: WorkflowFetchCompleteWhen;
};

export type GenerateAndPushNodeInput = {
  /**
   * 候选 HostTool（ReAct / Page 从中选择）。
   * 至少 1 个；可与遗留 `hostToolId` 并存，解析时优先本字段。
   */
  hostToolIds?: number[];
  /** @deprecated 使用 hostToolIds；单绑兼容，等价 hostToolIds:[hostToolId] */
  hostToolId?: number;
};

export type SummarizeNodeInput = {
  mode?: WorkflowSummarizeMode;
  /** 是否 prose 流式；默认 true（终态 summarize）。 */
  stream?: boolean;
  /**
   * @deprecated 已忽略。总结走 page_action phase=stream，不再绑定 HostTool。
   */
  hostToolId?: number;
};

export type ComposeMutationNodeInput = {
  toolId: number;
};

export type PresentMutationNodeInput = {
  mode?: 'brief' | 'detailed';
};

export type WriteDataNodeInput = {
  toolId: number;
  useComposedArgs?: boolean;
};

export type AwaitUserConfirmNodeInput = {
  confirmKind?: 'mutation' | 'generic';
};

export type WorkflowNodeInputByAction = {
  detect_clues: DetectCluesNodeInput;
  fetch_data: FetchDataNodeInput;
  summarize_images: SummarizeImagesNodeInput;
  generate_and_push: GenerateAndPushNodeInput;
  summarize: SummarizeNodeInput;
  compose_mutation: ComposeMutationNodeInput;
  present_mutation: PresentMutationNodeInput;
  write_data: WriteDataNodeInput;
  await_user_confirm: AwaitUserConfirmNodeInput;
};

export type WorkflowNodeInput = WorkflowNodeInputByAction[WorkflowActionKind];
