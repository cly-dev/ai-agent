/**
 * Workflow 共享类型与编译入口（迁移期占位）。
 * 后续从 src/core/workflow 逐步迁入。
 */
export type WorkflowNodeAction =
  | 'fetch_data'
  | 'generate_and_push'
  | 'summarize'
  | 'present_mutation'
  | 'write_data'
  | 'await_user_confirm';

export type WorkflowBindingRefs = {
  toolIds: number[];
  hostToolIds: number[];
};

export const WORKFLOW_CORE_PACKAGE = '@omnix/workflow-core';
