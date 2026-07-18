/**
 * Workflow IR — 机器语言（Compiler 产物 / Runtime 执行 / 研发排障）。
 *
 * 原则：
 * - 少而稳定（六类、≤30 type）；禁止垂直业务 type（退款/SEO/广告…）
 * - Intent 才是业务语言；本文件不是 Admin 配置真源
 * - pageContext / session / tenant → Runtime Context，不设 load_page_context
 *
 * @see openspec/changes/refactor-workflow-intent-ssot/design.md
 */

export type WorkflowIrNodeCategory =
  | 'trigger'
  | 'data'
  | 'ai'
  | 'control'
  | 'action'
  | 'system';

/** 目标词表；首期只实现子集，未实现 type 禁止出现在已保存 ir。 */
export type WorkflowIrNodeType =
  // Trigger
  | 'event_trigger'
  | 'schedule_trigger'
  | 'webhook_trigger'
  // Data
  | 'context_read'
  | 'data_query'
  | 'data_transform'
  | 'merge'
  // AI
  | 'llm'
  | 'structured_output'
  | 'embedding'
  | 'retrieval'
  | 'rerank'
  // Control
  | 'condition'
  | 'router'
  | 'parallel'
  | 'join'
  | 'loop'
  | 'delay'
  // Action
  | 'tool_call'
  | 'http_call'
  | 'host_effect'
  | 'message_send'
  | 'human_task'
  // System（策略也可挂节点字段；独立 type 可选）
  | 'catch_error'
  | 'sub_workflow';

export type WorkflowIrRetryPolicy = {
  maxAttempts: number;
  backoffMs?: number;
};

/**
 * 统一节点协议。input/output 描述与上下游/context 的契约；
 * config 为静态配置；retry/timeout 为执行策略。
 */
export type WorkflowIrNode = {
  id: string;
  type: WorkflowIrNodeType;
  name?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  config: Record<string, unknown>;
  retry?: WorkflowIrRetryPolicy;
  timeoutMs?: number;
};

export type WorkflowIrDocument = {
  version: 1;
  entryNodeId: string;
  nodes: WorkflowIrNode[];
  edges: Array<{
    id: string;
    from: string;
    to: string;
    /** always | condition key | router branch | default */
    kind?: 'always' | 'when' | 'default';
    /** kind=when：状态 key（与 Intent state.key 对齐） */
    when?: string;
    /** kind=when：给模型看的状态说明（来自 Intent state.description） */
    whenDescription?: string;
  }>;
};

/** 首期 Compiler 允许输出为「节点」的 type（condition/router 只作为边语义，不落节点）。 */
export const WORKFLOW_IR_IMPLEMENTED_TYPES = [
  'data_query',
  'data_transform',
  'llm',
  'structured_output',
  'tool_call',
  'host_effect',
  'message_send',
  'human_task',
] as const satisfies readonly WorkflowIrNodeType[];

export type WorkflowIrImplementedType =
  (typeof WORKFLOW_IR_IMPLEMENTED_TYPES)[number];

/** 明确禁止再现身为 IR type 的旧概念（文档 / review 用）。 */
export const WORKFLOW_IR_BANNED_LEGACY_ACTIONS = [
  'load_page_context',
  'summarize_images',
  'detect_clues',
  'generate_and_push',
] as const;

export function workflowIrCategoryOf(
  type: WorkflowIrNodeType,
): WorkflowIrNodeCategory {
  switch (type) {
    case 'event_trigger':
    case 'schedule_trigger':
    case 'webhook_trigger':
      return 'trigger';
    case 'context_read':
    case 'data_query':
    case 'data_transform':
    case 'merge':
      return 'data';
    case 'llm':
    case 'structured_output':
    case 'embedding':
    case 'retrieval':
    case 'rerank':
      return 'ai';
    case 'condition':
    case 'router':
    case 'parallel':
    case 'join':
    case 'loop':
    case 'delay':
      return 'control';
    case 'tool_call':
    case 'http_call':
    case 'host_effect':
    case 'message_send':
    case 'human_task':
      return 'action';
    case 'catch_error':
    case 'sub_workflow':
      return 'system';
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
