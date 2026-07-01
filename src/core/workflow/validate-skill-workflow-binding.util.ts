import { collectWorkflowNodeBindingRefs } from './derive-workflow-bindings-from-nodes.util';
import type {
  WorkflowNodeDef,
  WorkflowValidationIssue,
} from './workflow.types';

function pushIssue(
  issues: WorkflowValidationIssue[],
  path: string,
  code: string,
  message: string,
): void {
  issues.push({ path, code, message });
}

export type SkillWorkflowBindingInput = {
  nodes: WorkflowNodeDef[];
  workflowToolIds: number[];
  workflowHostToolIds: number[];
  skillToolIds: number[];
  skillHostToolIds: number[];
};

/**
 * Skill 绑定 Workflow 时的保存期校验：
 * - WorkflowTool / WorkflowHostTool 必须分别被 SkillTool / SkillHostTool 覆盖
 * - 节点 input 引用的 toolId / hostToolId 必须在 Skill 运行白名单内
 *
 * 与运行时 `validate-workflow-against-scope` 对齐，在 B 端配置阶段阻断 scope 不匹配。
 */
export function validateSkillWorkflowBinding(
  input: SkillWorkflowBindingInput,
): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = [];
  const skillTools = new Set(input.skillToolIds);
  const skillHosts = new Set(input.skillHostToolIds);

  for (const toolId of input.workflowToolIds) {
    if (!skillTools.has(toolId)) {
      pushIssue(
        issues,
        'skillTools',
        'workflow_tool_not_in_skill',
        `WorkflowTool toolId=${toolId} must be bound on Skill (SkillTool)`,
      );
    }
  }

  for (const hostToolId of input.workflowHostToolIds) {
    if (!skillHosts.has(hostToolId)) {
      pushIssue(
        issues,
        'skillHostTools',
        'workflow_host_tool_not_in_skill',
        `WorkflowHostTool hostToolId=${hostToolId} must be bound on Skill (SkillHostTool)`,
      );
    }
  }

  const nodeRefs = collectWorkflowNodeBindingRefs(input.nodes);
  for (const toolId of nodeRefs.toolIds) {
    if (!skillTools.has(toolId)) {
      pushIssue(
        issues,
        'nodes.input.toolId',
        'node_tool_not_in_skill',
        `Workflow node references toolId=${toolId} which is not in SkillTool bindings`,
      );
    }
  }
  for (const hostToolId of nodeRefs.hostToolIds) {
    if (!skillHosts.has(hostToolId)) {
      pushIssue(
        issues,
        'nodes.input.hostToolId',
        'node_host_tool_not_in_skill',
        `Workflow node references hostToolId=${hostToolId} which is not in SkillHostTool bindings`,
      );
    }
  }

  return issues;
}

export function isValidSkillWorkflowBinding(
  input: SkillWorkflowBindingInput,
): boolean {
  return validateSkillWorkflowBinding(input).length === 0;
}
