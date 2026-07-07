"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWriteGateEditedToolCalls = void 0;
const draft_review_1 = require("../../../draft-review");
const sanitize_draft_review_patch_util_1 = require("../../../draft-review/sanitize-draft-review-patch.util");
const agent_tool_runtime_util_1 = require("../main/runtime/agent-tool-runtime.util");
const write_gate_decision_error_1 = require("./write-gate-decision.error");
async function validateWriteGateEditedToolCalls(input) {
    if (input.decision.action !== 'confirm_with_edits') {
        return;
    }
    const allowedTools = await input.agentService.getAllowedTools(input.consumed.agentId, input.userId, input.consumed.appClientId);
    const { tools } = await (0, agent_tool_runtime_util_1.buildEngineToolsFromAllowedWithCredentials)(allowedTools, input.userId, input.toolEngine, input.prisma);
    const scopedIdSet = new Set(input.consumed.resumeContext.scopedToolIds);
    const resolvedScopedTools = tools.filter((tool) => scopedIdSet.has(tool.id)).length > 0
        ? tools.filter((tool) => scopedIdSet.has(tool.id))
        : tools;
    try {
        const toolCallsForWrite = (0, draft_review_1.applyDraftReviewToChatGateToolCalls)({
            pending: input.consumed,
            decision: input.decision,
            scopedTools: resolvedScopedTools,
        });
        (0, draft_review_1.assertDraftReviewToolCallsValid)({
            toolCalls: toolCallsForWrite,
            scopedTools: resolvedScopedTools,
        });
    }
    catch (error) {
        if (error instanceof sanitize_draft_review_patch_util_1.DraftReviewPolicyViolationError) {
            throw new write_gate_decision_error_1.WriteGateDecisionRejectedError(error.message, error.code);
        }
        const detail = error instanceof Error ? error.message : 'edited write arguments invalid';
        throw new write_gate_decision_error_1.WriteGateDecisionRejectedError(detail, 'EDITED_WRITE_ARGS_INVALID');
    }
}
exports.validateWriteGateEditedToolCalls = validateWriteGateEditedToolCalls;
//# sourceMappingURL=validate-write-gate-edited-tool-calls.util.js.map