"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertNoNewLegacyWorkflowBinding = void 0;
const common_1 = require("@nestjs/common");
function assertNoNewLegacyWorkflowBinding(workflowId, context) {
    if (workflowId == null || workflowId <= 0) {
        return;
    }
    throw new common_1.BadRequestException({
        code: 'LEGACY_WORKFLOW_BINDING_REMOVED',
        message: context === 'skill'
            ? 'Skill 编排请绑定 flowId；存量 Workflow 请先 POST /admin/flow/migrate-from-workflow/:workflowId（运行时已不再执行 workflowId）'
            : 'PageAction 编排请绑定 flowId；存量 Workflow 请先 POST /admin/flow/migrate-from-workflow/:workflowId（运行时已不再执行 workflowId）',
    });
}
exports.assertNoNewLegacyWorkflowBinding = assertNoNewLegacyWorkflowBinding;
//# sourceMappingURL=assert-no-new-legacy-workflow-binding.util.js.map