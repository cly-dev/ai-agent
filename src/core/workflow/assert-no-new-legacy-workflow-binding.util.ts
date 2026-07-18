import { BadRequestException } from '@nestjs/common';

/**
 * 配置面只认 Flow：禁止新建 / 改绑到 legacy Workflow。
 * 运行时亦不再加载 Skill/PageAction.workflowId；存量须 migrate。
 * 允许显式传 null 清空。
 */
export function assertNoNewLegacyWorkflowBinding(
  workflowId: number | null | undefined,
  context: 'skill' | 'page_action',
): void {
  if (workflowId == null || workflowId <= 0) {
    return;
  }
  throw new BadRequestException({
    code: 'LEGACY_WORKFLOW_BINDING_REMOVED',
    message:
      context === 'skill'
        ? 'Skill 编排请绑定 flowId；存量 Workflow 请先 POST /admin/flow/migrate-from-workflow/:workflowId（运行时已不再执行 workflowId）'
        : 'PageAction 编排请绑定 flowId；存量 Workflow 请先 POST /admin/flow/migrate-from-workflow/:workflowId（运行时已不再执行 workflowId）',
  });
}
