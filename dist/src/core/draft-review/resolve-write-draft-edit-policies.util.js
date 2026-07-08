"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEditPolicyGateFields = exports.resolveWriteDraftEditPoliciesForPublicDrafts = void 0;
const resolve_write_draft_edit_policy_util_1 = require("./resolve-write-draft-edit-policy.util");
function resolveWriteToolForPublicDraft(draft, input) {
    var _a, _b, _c, _d, _e;
    const toolId = draft.tool.toolId;
    if (toolId != null && ((_a = input.writeToolsById) === null || _a === void 0 ? void 0 : _a.has(toolId))) {
        return (_b = input.writeToolsById.get(toolId)) !== null && _b !== void 0 ? _b : null;
    }
    if ((_c = input.writeToolsById) === null || _c === void 0 ? void 0 : _c.size) {
        const byName = [...input.writeToolsById.values()].find((tool) => tool.name === draft.tool.name);
        if (byName) {
            return byName;
        }
    }
    if ((_d = input.scopedTools) === null || _d === void 0 ? void 0 : _d.length) {
        if (toolId != null) {
            const byId = input.scopedTools.find((tool) => 'id' in tool && tool.id === toolId);
            if (byId) {
                return byId;
            }
        }
        return ((_e = input.scopedTools.find((tool) => tool.name === draft.tool.name)) !== null && _e !== void 0 ? _e : null);
    }
    return null;
}
function resolveWriteDraftEditPoliciesForPublicDrafts(publicList, input = {}) {
    return publicList
        .map((draft) => (0, resolve_write_draft_edit_policy_util_1.resolveWriteDraftEditPolicyForToolCall)({
        writeTool: resolveWriteToolForPublicDraft(draft, input),
        arguments: draft.arguments,
    }))
        .filter((policy) => policy != null);
}
exports.resolveWriteDraftEditPoliciesForPublicDrafts = resolveWriteDraftEditPoliciesForPublicDrafts;
function buildEditPolicyGateFields(editPolicies) {
    if (editPolicies.length === 0) {
        return {};
    }
    return Object.assign({ editPolicy: editPolicies[0] }, (editPolicies.length > 1 ? { editPolicies } : {}));
}
exports.buildEditPolicyGateFields = buildEditPolicyGateFields;
//# sourceMappingURL=resolve-write-draft-edit-policies.util.js.map