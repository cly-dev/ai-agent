"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveToolRoleForPlanStepId = exports.scopedToolSummaryByName = exports.planToolStepsAreExecutable = exports.compilePlanToolSteps = void 0;
function compilePlanToolSteps(steps, scopedToolSummaries) {
    if (scopedToolSummaries.length === 0) {
        return steps;
    }
    const toolByName = new Map(scopedToolSummaries.map((tool) => [tool.name, tool]));
    return steps.map((step) => bindPlanToolStep(step, toolByName));
}
exports.compilePlanToolSteps = compilePlanToolSteps;
function bindPlanToolStep(step, toolByName) {
    var _a;
    if (step.kind !== 'tool') {
        return step;
    }
    let pinnedToolNames = ((_a = step.pinnedToolNames) === null || _a === void 0 ? void 0 : _a.length)
        ? [...step.pinnedToolNames]
        : undefined;
    const pinnedFromId = toolByName.get(step.id);
    if (pinnedFromId) {
        pinnedToolNames = [pinnedFromId.name];
    }
    let toolRole = step.toolRole;
    if (pinnedToolNames === null || pinnedToolNames === void 0 ? void 0 : pinnedToolNames.length) {
        for (const name of pinnedToolNames) {
            const summary = toolByName.get(name);
            if (summary && !toolRole) {
                toolRole = summary.role;
                break;
            }
        }
    }
    else if (pinnedFromId && !toolRole) {
        toolRole = pinnedFromId.role;
    }
    if (pinnedToolNames === step.pinnedToolNames &&
        toolRole === step.toolRole) {
        return step;
    }
    return Object.assign(Object.assign(Object.assign({}, step), (toolRole ? { toolRole } : {})), (pinnedToolNames ? { pinnedToolNames } : {}));
}
function planToolStepsAreExecutable(steps) {
    for (const step of steps) {
        if (step.kind === 'tool' && !step.toolRole) {
            return false;
        }
    }
    return true;
}
exports.planToolStepsAreExecutable = planToolStepsAreExecutable;
function scopedToolSummaryByName(scopedToolSummaries) {
    return new Map(scopedToolSummaries.map((tool) => [tool.name, tool]));
}
exports.scopedToolSummaryByName = scopedToolSummaryByName;
function resolveToolRoleForPlanStepId(stepId, toolByName) {
    var _a;
    return (_a = toolByName.get(stepId)) === null || _a === void 0 ? void 0 : _a.role;
}
exports.resolveToolRoleForPlanStepId = resolveToolRoleForPlanStepId;
//# sourceMappingURL=plan-step-bind.util.js.map