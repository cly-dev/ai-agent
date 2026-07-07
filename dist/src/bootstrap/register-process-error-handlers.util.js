"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProcessErrorHandlers = void 0;
const common_1 = require("@nestjs/common");
function registerProcessErrorHandlers() {
    process.on('uncaughtException', (error) => {
        var _a;
        common_1.Logger.error('Uncaught exception', (_a = error.stack) !== null && _a !== void 0 ? _a : error.message);
    });
    process.on('unhandledRejection', (reason) => {
        var _a;
        if (reason instanceof Error) {
            common_1.Logger.error('Unhandled promise rejection', (_a = reason.stack) !== null && _a !== void 0 ? _a : reason.message);
            return;
        }
        common_1.Logger.error('Unhandled promise rejection', String(reason));
    });
}
exports.registerProcessErrorHandlers = registerProcessErrorHandlers;
//# sourceMappingURL=register-process-error-handlers.util.js.map