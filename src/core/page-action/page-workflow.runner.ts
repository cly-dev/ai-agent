/**
 * @deprecated 使用 orchestratePageWorkflow；保留兼容旧 import。
 */
import type { ApprovalGateService } from '../approval/approval-gate.service';
import {
  orchestratePageWorkflow,
  type PageWorkflowOrchestratorInput,
  type PageWorkflowOrchestratorResult,
} from './page-workflow-orchestrator';
import type { PageWorkflowRunnerInput, PageWorkflowRunnerResult } from './page-workflow-runtime.util';

export type { PageWorkflowRunnerInput, PageWorkflowRunnerResult };

export async function runPageWorkflow(
  input: PageWorkflowRunnerInput & {
    allowedToolIds?: number[];
    approvalGate?: ApprovalGateService;
  },
): Promise<PageWorkflowRunnerResult> {
  const result = await orchestratePageWorkflow({
    ...input,
    allowedToolIds: input.allowedToolIds ?? [],
    approvalGate: input.approvalGate,
  } as PageWorkflowOrchestratorInput);
  return result;
}

export type { PageWorkflowOrchestratorResult };
