import type { WorkflowActionKind } from './workflow.types';

export type WorkflowFetchCompleteWhen = 'first_success' | 'fetch_all_pages';

export type WorkflowSummarizeMode = 'brief' | 'detailed' | 'draft' | 'final';

export type LoadPageContextNodeInput = {
  materialize?: boolean;
};

export type FetchDataNodeInput = {
  toolId?: number;
  definitionKey?: string;
  completeWhen?: WorkflowFetchCompleteWhen;
};

export type GenerateAndPushNodeInput = {
  hostToolId: number;
  stream?: boolean;
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
  load_page_context: LoadPageContextNodeInput;
  fetch_data: FetchDataNodeInput;
  generate_and_push: GenerateAndPushNodeInput;
  summarize: SummarizeNodeInput;
  compose_mutation: ComposeMutationNodeInput;
  present_mutation: PresentMutationNodeInput;
  write_data: WriteDataNodeInput;
  await_user_confirm: AwaitUserConfirmNodeInput;
};

export type WorkflowNodeInput = WorkflowNodeInputByAction[WorkflowActionKind];
