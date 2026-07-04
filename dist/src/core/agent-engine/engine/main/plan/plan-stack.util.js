"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSkillFrameActiveForPendingStep = exports.isPendingSkillEntryStep = exports.resolveSkillContextFromPlan = exports.applyActiveFrameStepComplete = exports.popPlanFrameIfInnerComplete = exports.pushPlanFrame = exports.wrapSnapshotWithPlanStack = exports.createOuterPlanFrame = exports.updateActivePlanFrame = exports.syncPlanFromActiveFrame = exports.getActivePlanFrame = void 0;
function getActivePlanFrame(plan) {
    return plan.frames[plan.activeFrameIndex];
}
exports.getActivePlanFrame = getActivePlanFrame;
function syncPlanFromActiveFrame(plan) {
    const frame = plan.frames[plan.activeFrameIndex];
    if (!frame) {
        return plan;
    }
    return Object.assign(Object.assign({}, plan), { source: frame.source, steps: frame.steps, pendingStepIds: [...frame.pendingStepIds], completedStepIds: [...frame.completedStepIds], taskPhase: frame.taskPhase, currentObjective: frame.currentObjective, currentStepId: frame.currentStepId });
}
exports.syncPlanFromActiveFrame = syncPlanFromActiveFrame;
function updateActivePlanFrame(plan, updater) {
    const frames = plan.frames.map((frame, index) => index === plan.activeFrameIndex ? updater(frame) : frame);
    return syncPlanFromActiveFrame(Object.assign(Object.assign({}, plan), { frames }));
}
exports.updateActivePlanFrame = updateActivePlanFrame;
function createOuterPlanFrame(input) {
    return {
        frameId: 'outer',
        skillId: null,
        skillName: null,
        source: input.source,
        steps: input.steps,
        pendingStepIds: input.pendingStepIds,
        completedStepIds: input.completedStepIds,
        taskPhase: input.taskPhase,
        currentObjective: input.currentObjective,
        currentStepId: input.currentStepId,
        parentSkillStepId: null,
    };
}
exports.createOuterPlanFrame = createOuterPlanFrame;
function wrapSnapshotWithPlanStack(plan) {
    const outer = createOuterPlanFrame({
        source: plan.source,
        steps: plan.steps,
        pendingStepIds: plan.pendingStepIds,
        completedStepIds: plan.completedStepIds,
        taskPhase: plan.taskPhase,
        currentObjective: plan.currentObjective,
        currentStepId: plan.currentStepId,
    });
    return syncPlanFromActiveFrame(Object.assign(Object.assign({}, plan), { frames: [outer], activeFrameIndex: 0 }));
}
exports.wrapSnapshotWithPlanStack = wrapSnapshotWithPlanStack;
function pushPlanFrame(plan, frame) {
    const frames = [...plan.frames, frame];
    return syncPlanFromActiveFrame(Object.assign(Object.assign({}, plan), { frames, activeFrameIndex: frames.length - 1 }));
}
exports.pushPlanFrame = pushPlanFrame;
function advancePlanFrameStep(frame, completedStepId) {
    var _a, _b, _c, _d;
    const pendingStepIds = frame.pendingStepIds.filter((id) => id !== completedStepId);
    const completedStepIds = frame.completedStepIds.includes(completedStepId)
        ? frame.completedStepIds
        : [...frame.completedStepIds, completedStepId];
    const nextStep = (_a = frame.steps.find((step) => { var _a; return step.id === ((_a = pendingStepIds[0]) !== null && _a !== void 0 ? _a : ''); })) !== null && _a !== void 0 ? _a : null;
    return Object.assign(Object.assign({}, frame), { pendingStepIds,
        completedStepIds, currentStepId: (_b = nextStep === null || nextStep === void 0 ? void 0 : nextStep.id) !== null && _b !== void 0 ? _b : null, currentObjective: (_c = nextStep === null || nextStep === void 0 ? void 0 : nextStep.objective) !== null && _c !== void 0 ? _c : frame.currentObjective, taskPhase: (_d = nextStep === null || nextStep === void 0 ? void 0 : nextStep.phase) !== null && _d !== void 0 ? _d : 'answer' });
}
function popPlanFrameIfInnerComplete(plan) {
    var _a, _b;
    if (plan.activeFrameIndex === 0) {
        return plan;
    }
    const active = getActivePlanFrame(plan);
    if (active.pendingStepIds.length > 0) {
        return plan;
    }
    const parentIndex = plan.activeFrameIndex - 1;
    const parentFrame = plan.frames[parentIndex];
    const skillStepId = (_b = (_a = active.parentSkillStepId) !== null && _a !== void 0 ? _a : parentFrame.pendingStepIds[0]) !== null && _b !== void 0 ? _b : null;
    const frames = [...plan.frames];
    if (skillStepId) {
        frames[parentIndex] = advancePlanFrameStep(parentFrame, skillStepId);
    }
    return syncPlanFromActiveFrame(Object.assign(Object.assign({}, plan), { frames, activeFrameIndex: parentIndex }));
}
exports.popPlanFrameIfInnerComplete = popPlanFrameIfInnerComplete;
function applyActiveFrameStepComplete(plan, completedStepId) {
    let updated = updateActivePlanFrame(plan, (frame) => advancePlanFrameStep(frame, completedStepId));
    updated = popPlanFrameIfInnerComplete(updated);
    return updated;
}
exports.applyActiveFrameStepComplete = applyActiveFrameStepComplete;
function resolveSkillContextFromPlan(plan) {
    var _a, _b, _c, _d;
    if (!plan) {
        return {
            skillApplied: false,
            activeSkillId: null,
            activeSkillName: null,
            activeSkillDescription: null,
            activeSkillPrompt: null,
            activeSkillConfig: null,
            activeSkillRiskLevel: null,
        };
    }
    const frame = plan.frames[plan.activeFrameIndex];
    if (!(frame === null || frame === void 0 ? void 0 : frame.skillId)) {
        return {
            skillApplied: false,
            activeSkillId: null,
            activeSkillName: null,
            activeSkillDescription: null,
            activeSkillPrompt: null,
            activeSkillConfig: null,
            activeSkillRiskLevel: null,
        };
    }
    return {
        skillApplied: true,
        activeSkillId: frame.skillId,
        activeSkillName: frame.skillName,
        activeSkillDescription: (_a = frame.skillDescription) !== null && _a !== void 0 ? _a : null,
        activeSkillPrompt: (_b = frame.skillPrompt) !== null && _b !== void 0 ? _b : null,
        activeSkillConfig: (_c = frame.skillConfig) !== null && _c !== void 0 ? _c : null,
        activeSkillRiskLevel: (_d = frame.skillRiskLevel) !== null && _d !== void 0 ? _d : null,
    };
}
exports.resolveSkillContextFromPlan = resolveSkillContextFromPlan;
function isPendingSkillEntryStep(plan) {
    var _a;
    if (!plan) {
        return false;
    }
    const stepId = (_a = plan.pendingStepIds[0]) !== null && _a !== void 0 ? _a : plan.currentStepId;
    if (!stepId) {
        return false;
    }
    const step = plan.steps.find((row) => row.id === stepId);
    return (step === null || step === void 0 ? void 0 : step.kind) === 'skill' && step.skillId != null;
}
exports.isPendingSkillEntryStep = isPendingSkillEntryStep;
function isSkillFrameActiveForPendingStep(plan) {
    if (plan.activeFrameIndex === 0) {
        return false;
    }
    const active = getActivePlanFrame(plan);
    if (!active.parentSkillStepId) {
        return false;
    }
    const parentFrame = plan.frames[plan.activeFrameIndex - 1];
    return (parentFrame === null || parentFrame === void 0 ? void 0 : parentFrame.pendingStepIds[0]) === active.parentSkillStepId;
}
exports.isSkillFrameActiveForPendingStep = isSkillFrameActiveForPendingStep;
//# sourceMappingURL=plan-stack.util.js.map