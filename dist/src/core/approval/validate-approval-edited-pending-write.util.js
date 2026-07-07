"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveApprovalSnapshotForDecision = void 0;
const draft_review_1 = require("../draft-review");
const write_draft_util_1 = require("../draft-review/write-draft.util");
const agent_tool_runtime_util_1 = require("../agent-engine/engine/main/runtime/agent-tool-runtime.util");
const common_1 = require("@nestjs/common");
const sanitize_draft_review_patch_util_1 = require("../draft-review/sanitize-draft-review-patch.util");
async function resolveApprovalSnapshotForDecision(input) {
    var _a;
    const decision = input.decision;
    if (!decision || decision.action !== 'confirm_with_edits') {
        return input.snapshot;
    }
    const allowedTools = await input.prisma.tool.findMany({
        where: { id: { in: input.snapshot.scopedToolIds } },
        include: { integration: true },
    });
    const { tools: resolvedScopedTools } = (0, agent_tool_runtime_util_1.buildEngineToolsFromAllowed)(allowedTools, input.userId, input.toolEngine);
    const draft = (0, write_draft_util_1.resolveWriteDraftFromApprovalSnapshot)(input.snapshot);
    const writeTool = (_a = resolvedScopedTools.find((tool) => tool.name === draft.tool.name)) !== null && _a !== void 0 ? _a : null;
    if (!writeTool) {
        throw new common_1.BadRequestException({
            code: 'WRITE_TOOL_NOT_RESOLVED',
            message: `write tool not found for draft: ${draft.tool.name}`,
        });
    }
    let editedDraft;
    try {
        editedDraft = (0, write_draft_util_1.applyDraftReviewToWriteDraft)({
            draft,
            decision,
            writeTool,
        });
    }
    catch (error) {
        if (error instanceof sanitize_draft_review_patch_util_1.DraftReviewPolicyViolationError) {
            throw new common_1.BadRequestException({
                code: error.code,
                message: error.message,
            });
        }
        throw error;
    }
    try {
        (0, draft_review_1.assertDraftReviewToolCallsValid)({
            toolCalls: [
                {
                    name: editedDraft.tool.name,
                    arguments: editedDraft.arguments,
                    riskLevel: String(editedDraft.tool.riskLevel),
                },
            ],
            scopedTools: resolvedScopedTools,
        });
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : 'edited write arguments invalid';
        throw new common_1.BadRequestException({
            code: 'EDITED_WRITE_ARGS_INVALID',
            message: detail,
        });
    }
    return (0, write_draft_util_1.attachWriteDraftToApprovalSnapshot)(input.snapshot, editedDraft);
}
exports.resolveApprovalSnapshotForDecision = resolveApprovalSnapshotForDecision;
//# sourceMappingURL=validate-approval-edited-pending-write.util.js.map