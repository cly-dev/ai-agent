"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPageWorkflow = void 0;
const page_workflow_orchestrator_1 = require("./page-workflow-orchestrator");
async function runPageWorkflow(input) {
    var _a;
    const result = await (0, page_workflow_orchestrator_1.orchestratePageWorkflow)(Object.assign(Object.assign({}, input), { allowedToolIds: (_a = input.allowedToolIds) !== null && _a !== void 0 ? _a : [], approvalGate: input.approvalGate }));
    return result;
}
exports.runPageWorkflow = runPageWorkflow;
//# sourceMappingURL=page-workflow.runner.js.map