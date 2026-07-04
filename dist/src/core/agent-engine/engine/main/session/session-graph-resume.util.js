"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromStoredTaskPlan = exports.toStoredTaskPlan = void 0;
const plan_stack_util_1 = require("../plan/plan-stack.util");
function asTaskDeliverable(value) {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'analysis' ||
        normalized === 'list' ||
        normalized === 'detail' ||
        normalized === 'mutation' ||
        normalized === 'answer') {
        return normalized;
    }
    return 'answer';
}
function mapStoredStep(step) {
    var _a, _b;
    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ id: step.id, phase: step.phase, kind: step.kind, objective: step.objective }, (step.skillId != null ? { skillId: step.skillId } : {})), (step.toolRole
        ? { toolRole: step.toolRole }
        : {})), (((_a = step.hostToolNames) === null || _a === void 0 ? void 0 : _a.length) ? { hostToolNames: step.hostToolNames } : {})), (((_b = step.hostToolIds) === null || _b === void 0 ? void 0 : _b.length) ? { hostToolIds: step.hostToolIds } : {})), (step.stopWhen
        ? { stopWhen: step.stopWhen }
        : {}));
}
function mapStoredFrame(frame) {
    var _a, _b, _c, _d;
    return {
        frameId: frame.frameId,
        skillId: frame.skillId,
        skillName: (_a = frame.skillName) !== null && _a !== void 0 ? _a : null,
        source: frame.source,
        steps: frame.steps.map(mapStoredStep),
        pendingStepIds: [...frame.pendingStepIds],
        completedStepIds: [...frame.completedStepIds],
        taskPhase: frame.taskPhase,
        currentObjective: frame.currentObjective,
        currentStepId: frame.currentStepId,
        parentSkillStepId: (_b = frame.parentSkillStepId) !== null && _b !== void 0 ? _b : null,
        skillPrompt: (_c = frame.skillPrompt) !== null && _c !== void 0 ? _c : null,
        skillDescription: (_d = frame.skillDescription) !== null && _d !== void 0 ? _d : null,
        skillConfig: frame.skillConfig,
        skillRiskLevel: frame.skillRiskLevel === 'L1' ||
            frame.skillRiskLevel === 'L2' ||
            frame.skillRiskLevel === 'L3'
            ? frame.skillRiskLevel
            : null,
    };
}
function mapFrameToStored(frame) {
    var _a, _b, _c, _d;
    return {
        frameId: frame.frameId,
        skillId: frame.skillId,
        skillName: frame.skillName,
        source: frame.source,
        steps: frame.steps.map((step) => {
            var _a, _b;
            return (Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ id: step.id, phase: step.phase, kind: step.kind, objective: step.objective }, (step.skillId != null ? { skillId: step.skillId } : {})), (step.toolRole ? { toolRole: step.toolRole } : {})), (((_a = step.hostToolNames) === null || _a === void 0 ? void 0 : _a.length)
                ? { hostToolNames: step.hostToolNames }
                : {})), (((_b = step.hostToolIds) === null || _b === void 0 ? void 0 : _b.length) ? { hostToolIds: step.hostToolIds } : {})), (step.stopWhen ? { stopWhen: step.stopWhen } : {})));
        }),
        pendingStepIds: [...frame.pendingStepIds],
        completedStepIds: [...frame.completedStepIds],
        taskPhase: frame.taskPhase,
        currentObjective: frame.currentObjective,
        currentStepId: frame.currentStepId,
        parentSkillStepId: (_a = frame.parentSkillStepId) !== null && _a !== void 0 ? _a : null,
        skillPrompt: (_b = frame.skillPrompt) !== null && _b !== void 0 ? _b : null,
        skillDescription: (_c = frame.skillDescription) !== null && _c !== void 0 ? _c : null,
        skillConfig: frame.skillConfig,
        skillRiskLevel: (_d = frame.skillRiskLevel) !== null && _d !== void 0 ? _d : null,
    };
}
function toStoredTaskPlan(plan) {
    return Object.assign(Object.assign({ source: plan.source, originalUserRequest: plan.originalUserRequest, goal: plan.goal, deliverable: plan.deliverable, constraints: [...plan.constraints], steps: plan.steps.map((step) => {
            var _a, _b;
            return (Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ id: step.id, phase: step.phase, kind: step.kind, objective: step.objective }, (step.skillId != null ? { skillId: step.skillId } : {})), (step.toolRole ? { toolRole: step.toolRole } : {})), (((_a = step.hostToolNames) === null || _a === void 0 ? void 0 : _a.length)
                ? { hostToolNames: step.hostToolNames }
                : {})), (((_b = step.hostToolIds) === null || _b === void 0 ? void 0 : _b.length) ? { hostToolIds: step.hostToolIds } : {})), (step.stopWhen ? { stopWhen: step.stopWhen } : {})));
        }), pendingStepIds: [...plan.pendingStepIds], completedStepIds: [...plan.completedStepIds], taskPhase: plan.taskPhase, currentObjective: plan.currentObjective, currentStepId: plan.currentStepId, frames: plan.frames.map(mapFrameToStored), activeFrameIndex: plan.activeFrameIndex }, (plan.outerSkillSelectMethod
        ? { outerSkillSelectMethod: plan.outerSkillSelectMethod }
        : {})), (plan.autoSelectedSkillId !== undefined
        ? { autoSelectedSkillId: plan.autoSelectedSkillId }
        : {}));
}
exports.toStoredTaskPlan = toStoredTaskPlan;
function planSelectMetadataFromStored(stored) {
    var _a;
    const method = (_a = stored.outerSkillSelectMethod) === null || _a === void 0 ? void 0 : _a.trim();
    return Object.assign(Object.assign({}, (method
        ? { outerSkillSelectMethod: method }
        : {})), (stored.autoSelectedSkillId !== undefined
        ? { autoSelectedSkillId: stored.autoSelectedSkillId }
        : {}));
}
function fromStoredTaskPlan(stored) {
    const selectMeta = planSelectMetadataFromStored(stored);
    if (stored.frames && stored.frames.length > 0) {
        const frames = stored.frames.map(mapStoredFrame);
        const activeFrameIndex = typeof stored.activeFrameIndex === 'number' &&
            stored.activeFrameIndex >= 0 &&
            stored.activeFrameIndex < frames.length
            ? stored.activeFrameIndex
            : 0;
        return Object.assign(Object.assign({}, (0, plan_stack_util_1.syncPlanFromActiveFrame)({
            source: stored.source,
            originalUserRequest: stored.originalUserRequest,
            goal: stored.goal,
            deliverable: asTaskDeliverable(stored.deliverable),
            constraints: [...stored.constraints],
            steps: [],
            pendingStepIds: [],
            completedStepIds: [],
            taskPhase: 'answer',
            currentObjective: stored.currentObjective,
            currentStepId: null,
            frames,
            activeFrameIndex,
        })), selectMeta);
    }
    const steps = stored.steps.map(mapStoredStep);
    return Object.assign(Object.assign({}, (0, plan_stack_util_1.wrapSnapshotWithPlanStack)({
        source: stored.source,
        originalUserRequest: stored.originalUserRequest,
        goal: stored.goal,
        deliverable: asTaskDeliverable(stored.deliverable),
        constraints: [...stored.constraints],
        steps,
        pendingStepIds: [...stored.pendingStepIds],
        completedStepIds: [...stored.completedStepIds],
        taskPhase: stored.taskPhase,
        currentObjective: stored.currentObjective,
        currentStepId: stored.currentStepId,
    })), selectMeta);
}
exports.fromStoredTaskPlan = fromStoredTaskPlan;
//# sourceMappingURL=session-graph-resume.util.js.map