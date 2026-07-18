"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSkillWorkflowForInit = exports.resolveWorkflowBoundSkillId = void 0;
const load_flow_for_run_util_1 = require("./load-flow-for-run.util");
const load_workflow_definition_util_1 = require("./load-workflow-definition.util");
function resolveWorkflowBoundSkillId(bundle, state) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (((_b = (_a = state.turnExecutionContract) === null || _a === void 0 ? void 0 : _a.skillAlignment) === null || _b === void 0 ? void 0 : _b.status) === 'intent_first') {
        return null;
    }
    const skillId = (_h = (_f = (_e = (_c = bundle.ctx.input.requestedSkillId) !== null && _c !== void 0 ? _c : (_d = bundle.ctx.requestedSkillCtx) === null || _d === void 0 ? void 0 : _d.skillId) !== null && _e !== void 0 ? _e : state.activeSkillId) !== null && _f !== void 0 ? _f : (_g = state.taskPlan) === null || _g === void 0 ? void 0 : _g.autoSelectedSkillId) !== null && _h !== void 0 ? _h : null;
    return skillId != null && skillId > 0 ? skillId : null;
}
exports.resolveWorkflowBoundSkillId = resolveWorkflowBoundSkillId;
async function resolveSkillWorkflowForInit(prisma, input) {
    const skillRow = await prisma.skill.findUnique({
        where: { id: input.skillId },
        select: {
            flowId: true,
            flowVersion: true,
            workflowOverrides: true,
        },
    });
    const overrides = (0, load_workflow_definition_util_1.parseWorkflowOverridesJson)(skillRow === null || skillRow === void 0 ? void 0 : skillRow.workflowOverrides);
    if ((skillRow === null || skillRow === void 0 ? void 0 : skillRow.flowId) == null || skillRow.flowId <= 0) {
        return { kind: 'no_workflow_binding' };
    }
    const loadResult = await (0, load_flow_for_run_util_1.loadFlowForRunDetailed)(prisma, {
        flowId: skillRow.flowId,
        appClientId: input.appClientId,
        flowVersion: skillRow.flowVersion,
        workflowOverrides: overrides,
        scope: input.scope,
    });
    return mapLoadResult(loadResult);
}
exports.resolveSkillWorkflowForInit = resolveSkillWorkflowForInit;
function mapLoadResult(loadResult) {
    if (loadResult.status === 'loaded') {
        const { status: _status } = loadResult, workflow = __rest(loadResult, ["status"]);
        return { kind: 'loaded', workflow, source: 'flow' };
    }
    if (loadResult.reason === 'scope_incompatible') {
        return {
            kind: 'scope_incompatible',
            workflowId: loadResult.workflowId,
            source: 'flow',
        };
    }
    return {
        kind: 'load_failed',
        workflowId: loadResult.workflowId,
        reason: loadResult.reason,
        source: 'flow',
    };
}
//# sourceMappingURL=workflow-init-skill.util.js.map