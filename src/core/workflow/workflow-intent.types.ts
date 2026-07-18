import type { WorkflowProfile } from './workflow.types';

/**
 * Workflow 配置真源（Intent）：业务编排，非执行 IR。
 * 产品面字段保持精简；语气/分页/展示细项由 compile 默认，不进 Intent。
 */

export const WORKFLOW_INTENT_VERSION = 1 as const;

export type WorkflowIntentOperation =
  | 'read'
  | 'judge'
  | 'deliver'
  | 'mutate';

/** 交付通道：对人说话 vs 对页填写。 */
export type WorkflowDeliverChannel = 'speak' | 'fill';

/** 识图能力：仅产品需要的开关与来源/提示。 */
export type WorkflowImageEvidenceCapability = {
  enabled: boolean;
  hint?: string;
  from?: 'upstream' | 'page_context' | 'all';
};

export type WorkflowIntentCapabilities = {
  images?: WorkflowImageEvidenceCapability;
  policyHint?: string;
};

export type WorkflowIntentSlots = {
  readToolIds?: number[];
  fillHostToolIds?: number[];
  writeToolId?: number;
};

export type WorkflowIntentStepBase = {
  id: string;
  name?: string;
  objective?: string;
};

export type WorkflowIntentReadStep = WorkflowIntentStepBase & {
  operation: 'read';
  slots?: Pick<WorkflowIntentSlots, 'readToolIds'>;
  capabilities?: Pick<WorkflowIntentCapabilities, 'images'>;
};

export type WorkflowIntentJudgeStep = WorkflowIntentStepBase & {
  operation: 'judge';
  capabilities?: Pick<WorkflowIntentCapabilities, 'policyHint'>;
};

export type WorkflowIntentDeliverStep = WorkflowIntentStepBase & {
  operation: 'deliver';
  channel: WorkflowDeliverChannel;
  slots?: Pick<WorkflowIntentSlots, 'fillHostToolIds'>;
};

export type WorkflowIntentMutateStep = WorkflowIntentStepBase & {
  operation: 'mutate';
  slots: { writeToolId: number; readToolIds?: number[] };
  /**
   * @deprecated 产品面不暴露。写入策略由绑定入口派生：
   * Skill/Chat 走 mutate ⇒ 必确认（组参→审批→执行）；PageAction 不配 mutate。
   * compile 仅当 `=== true` 时插 present / 写后 speak；运营配置勿传，Preset 永不写入。
   * 禁止用本字段或 skipConfirm 表达「页内免确认」。
   */
  explainBeforeConfirm?: boolean;
  /** @deprecated 同 explainBeforeConfirm；产品定死不传，compile 默认不追加写后 speak。 */
  summarizeAfter?: boolean;
};

export type WorkflowIntentStep =
  | WorkflowIntentReadStep
  | WorkflowIntentJudgeStep
  | WorkflowIntentDeliverStep
  | WorkflowIntentMutateStep;

export type WorkflowIntentEdgeKind = 'always' | 'state' | 'default';

export type WorkflowIntentStateDef = {
  key: string;
  description: string;
};

export type WorkflowIntentEdge = {
  id: string;
  from: string;
  to: string;
  kind?: WorkflowIntentEdgeKind;
  state?: WorkflowIntentStateDef;
};

export type WorkflowIntent = {
  version: typeof WORKFLOW_INTENT_VERSION;
  profile: WorkflowProfile;
  entryStepId: string;
  steps: WorkflowIntentStep[];
  edges: WorkflowIntentEdge[];
};

export function isWorkflowIntentOperation(
  value: unknown,
): value is WorkflowIntentOperation {
  return (
    value === 'read' ||
    value === 'judge' ||
    value === 'deliver' ||
    value === 'mutate'
  );
}
