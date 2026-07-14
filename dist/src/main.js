"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./core/env/load-env");
const common_1 = require("@nestjs/common");
const session_run_bullmq_connection_util_1 = require("./core/session-run/session-run-bullmq.connection.util");
const create_nest_app_util_1 = require("./bootstrap/create-nest-app.util");
const register_process_error_handlers_util_1 = require("./bootstrap/register-process-error-handlers.util");
async function bootstrap() {
    var _a;
    const app = await (0, create_nest_app_util_1.createNestApp)();
    if ((0, session_run_bullmq_connection_util_1.readHttpServerEnabled)()) {
        await (0, create_nest_app_util_1.listenRuntimeHttp)(app, Number((_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3030));
        return;
    }
    await (0, create_nest_app_util_1.initBackgroundOnly)(app, 'HTTP disabled (SESSION_RUN_HTTP_ENABLED=0); BullMQ worker / background only');
}
(0, register_process_error_handlers_util_1.registerProcessErrorHandlers)();
bootstrap().catch((error) => {
    var _a;
    if (error instanceof Error) {
        common_1.Logger.error('Application bootstrap failed', (_a = error.stack) !== null && _a !== void 0 ? _a : error.message);
    }
    else {
        common_1.Logger.error('Application bootstrap failed', String(error));
    }
    process.exit(1);
});
//# sourceMappingURL=main.js.map