import type { WorkflowNodeDef } from './workflow.types';
import type { WriteDataNodeInput } from './workflow-node-input.types';
import { resolveWorkflowNodeRuntimeInput } from './resolve-workflow-node-runtime-input.util';

/**
 * Workflow 触发权限（派生自 RoleTool，不新增授权表）。
 *
 * workflow 的 `write_data.toolId` 是 HTTP Tool，本就受 `RoleTool`（+ App 默认共享 + 风险等级）管。
 * 触发/恢复前对这些必需写工具做 fail-fast 校验，避免生成永远确认不了的审批卡。
 * 校验主体：chat/pageAction = 发起人；webhook = workflow 配置审批人（由调用方决定 allowedToolIds 来源）。
 */

const WORKFLOW_TRIGGER_PERMISSION_ENV = 'WORKFLOW_TRIGGER_PERMISSION';

/** 触发前 fail-fast 校验开关；默认开启，设为 'false' 时跳过（运行时工具门仍生效）。 */
export function isWorkflowTriggerPermissionEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env[WORKFLOW_TRIGGER_PERMISSION_ENV] !== 'false';
}

/** 提取 workflow 中 `write_data` 节点引用的写工具 toolId（去重、正整数）。 */
export function extractWorkflowWriteToolIds(
  nodes: WorkflowNodeDef[],
): number[] {
  const ids = new Set<number>();
  for (const node of nodes) {
    if (node.action !== 'write_data') {
      continue;
    }
    const input = resolveWorkflowNodeRuntimeInput(node) as WriteDataNodeInput;
    const toolId = input?.toolId;
    if (typeof toolId === 'number' && Number.isInteger(toolId) && toolId > 0) {
      ids.add(toolId);
    }
  }
  return [...ids];
}

export type WorkflowTriggerPermissionDecision = {
  allowed: boolean;
  /** 缺失授权的写工具 id（allowed=false 时非空）。 */
  missingToolIds: number[];
  /** 是否因开关关闭而跳过校验。 */
  skipped: boolean;
};

/**
 * 评估触发权限：workflow 所有 `write_data.toolId` 是否都在调用方解析出的 allowedToolIds 内。
 * allowedToolIds 由各链路自行解析（= RoleTool ∩ 风险等级 ∩ active ∩ 绑定），本 util 只做集合判定。
 */
export function evaluateWorkflowTriggerPermission(input: {
  writeToolIds: number[];
  allowedToolIds: Iterable<number>;
  enabled?: boolean;
}): WorkflowTriggerPermissionDecision {
  const enabled = input.enabled ?? true;
  if (!enabled) {
    return { allowed: true, missingToolIds: [], skipped: true };
  }
  const allowed = new Set(input.allowedToolIds);
  const missingToolIds = input.writeToolIds.filter((id) => !allowed.has(id));
  return {
    allowed: missingToolIds.length === 0,
    missingToolIds,
    skipped: false,
  };
}

/** 便捷入口：直接从 nodes 提取写工具再评估。 */
export function evaluateWorkflowTriggerPermissionForNodes(input: {
  nodes: WorkflowNodeDef[];
  allowedToolIds: Iterable<number>;
  enabled?: boolean;
}): WorkflowTriggerPermissionDecision {
  return evaluateWorkflowTriggerPermission({
    writeToolIds: extractWorkflowWriteToolIds(input.nodes),
    allowedToolIds: input.allowedToolIds,
    enabled: input.enabled,
  });
}
