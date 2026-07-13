"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logStartupInfo = exports.resolveNestBootstrapLogger = void 0;
const common_1 = require("@nestjs/common");
const runtime_env_util_1 = require("./runtime-env.util");
const PRODUCTION_LOG_LEVELS = ['error', 'warn'];
function resolveNestBootstrapLogger() {
    if (!(0, runtime_env_util_1.isProductionRuntime)()) {
        return undefined;
    }
    return new common_1.ConsoleLogger('AgentServer', {
        logLevels: PRODUCTION_LOG_LEVELS,
    });
}
exports.resolveNestBootstrapLogger = resolveNestBootstrapLogger;
function logStartupInfo(message) {
    if ((0, runtime_env_util_1.isProductionRuntime)()) {
        return;
    }
    new common_1.ConsoleLogger('Bootstrap').log(message);
}
exports.logStartupInfo = logStartupInfo;
//# sourceMappingURL=nest-bootstrap.util.js.map