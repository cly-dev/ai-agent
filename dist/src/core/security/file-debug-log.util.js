"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPageActionRunFileDebugEnabled = exports.isPageActionRunDebugEnabled = exports.isWorkflowFileDebugEnabled = exports.isWorkflowDebugEnabled = exports.isToolEngineFileDebugEnabled = exports.isFileDebugLogEnabled = exports.isAgentEngineDebugEnabled = void 0;
const runtime_env_util_1 = require("./runtime-env.util");
function readTriStateEnv(name) {
    var _a;
    const value = (_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    if ((0, runtime_env_util_1.isFalsyEnv)(value)) {
        return false;
    }
    if ((0, runtime_env_util_1.isTruthyEnv)(value)) {
        return true;
    }
    return undefined;
}
function isAgentEngineDebugEnabled() {
    if ((0, runtime_env_util_1.isProductionRuntime)()) {
        return false;
    }
    const explicit = readTriStateEnv('AGENT_ENGINE_DEBUG');
    if (explicit !== undefined) {
        return explicit;
    }
    return true;
}
exports.isAgentEngineDebugEnabled = isAgentEngineDebugEnabled;
function isFileDebugLogEnabled() {
    if ((0, runtime_env_util_1.isProductionRuntime)()) {
        return false;
    }
    return isAgentEngineDebugEnabled();
}
exports.isFileDebugLogEnabled = isFileDebugLogEnabled;
function isToolEngineFileDebugEnabled() {
    if ((0, runtime_env_util_1.isProductionRuntime)()) {
        return false;
    }
    const explicit = readTriStateEnv('TOOL_ENGINE_DEBUG');
    if (explicit !== undefined) {
        return explicit;
    }
    return isAgentEngineDebugEnabled();
}
exports.isToolEngineFileDebugEnabled = isToolEngineFileDebugEnabled;
function isWorkflowDebugEnabled() {
    if ((0, runtime_env_util_1.isProductionRuntime)()) {
        return false;
    }
    const explicit = readTriStateEnv('WORKFLOW_DEBUG');
    if (explicit !== undefined) {
        return explicit;
    }
    return isAgentEngineDebugEnabled();
}
exports.isWorkflowDebugEnabled = isWorkflowDebugEnabled;
function isWorkflowFileDebugEnabled() {
    if ((0, runtime_env_util_1.isProductionRuntime)()) {
        return false;
    }
    return isWorkflowDebugEnabled();
}
exports.isWorkflowFileDebugEnabled = isWorkflowFileDebugEnabled;
function isPageActionRunDebugEnabled() {
    if ((0, runtime_env_util_1.isProductionRuntime)()) {
        return false;
    }
    const explicit = readTriStateEnv('PAGE_ACTION_DEBUG');
    if (explicit !== undefined) {
        return explicit;
    }
    const fillExplicit = readTriStateEnv('PAGE_ACTION_FILL_DEBUG');
    if (fillExplicit === false) {
        return false;
    }
    return true;
}
exports.isPageActionRunDebugEnabled = isPageActionRunDebugEnabled;
function isPageActionRunFileDebugEnabled() {
    if ((0, runtime_env_util_1.isProductionRuntime)()) {
        return false;
    }
    return isPageActionRunDebugEnabled();
}
exports.isPageActionRunFileDebugEnabled = isPageActionRunFileDebugEnabled;
//# sourceMappingURL=file-debug-log.util.js.map