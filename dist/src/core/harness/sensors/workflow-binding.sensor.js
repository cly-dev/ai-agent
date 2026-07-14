"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWorkflowBindingsSensor = exports.workflowBindingSensor = void 0;
const validate_workflow_util_1 = require("../../workflow/validate-workflow.util");
exports.workflowBindingSensor = {
    name: 'workflow-binding',
    run(_ctx, payload) {
        var _a;
        const data = payload;
        if (!(data === null || data === void 0 ? void 0 : data.definition)) {
            return {
                name: 'workflow-binding',
                verdict: 'fail',
                code: 'MISSING_DEFINITION',
                message: 'workflow definition is required for binding sensor',
            };
        }
        const issues = (0, validate_workflow_util_1.validateWorkflowDefinition)({
            definition: data.definition,
            bindings: (_a = data.bindings) !== null && _a !== void 0 ? _a : { toolIds: [], hostToolIds: [] },
        });
        const bindingIssues = issues.filter((issue) => issue.code.endsWith('_not_bound'));
        if (bindingIssues.length === 0) {
            return { name: 'workflow-binding', verdict: 'pass' };
        }
        const first = bindingIssues[0];
        return {
            name: 'workflow-binding',
            verdict: 'fail',
            code: first.code,
            message: first.message,
        };
    },
};
function validateWorkflowBindingsSensor(input) {
    return exports.workflowBindingSensor.run({ nodeId: '__config__', action: '__save__' }, input);
}
exports.validateWorkflowBindingsSensor = validateWorkflowBindingsSensor;
//# sourceMappingURL=workflow-binding.sensor.js.map