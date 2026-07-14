"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRunModule = void 0;
const common_1 = require("@nestjs/common");
const agent_engine_module_1 = require("../agent-engine/agent-engine.module");
const memory_module_1 = require("../memory/memory.module");
const chat_session_run_bridge_module_1 = require("../../modules/chat/chat-session-run-bridge.module");
const agent_run_launcher_service_1 = require("./agent-run-launcher.service");
const agent_run_sse_gateway_1 = require("./agent-run-sse.gateway");
const session_run_coordinator_service_1 = require("./session-run-coordinator.service");
const session_run_job_queue_service_1 = require("./session-run-job-queue.service");
let SessionRunModule = class SessionRunModule {
};
SessionRunModule = __decorate([
    (0, common_1.Module)({
        imports: [
            memory_module_1.MemoryModule,
            chat_session_run_bridge_module_1.ChatSessionRunBridgeModule,
            (0, common_1.forwardRef)(() => agent_engine_module_1.AgentEngineModule),
        ],
        providers: [
            session_run_coordinator_service_1.SessionRunCoordinator,
            session_run_job_queue_service_1.SessionRunJobQueueService,
            agent_run_launcher_service_1.AgentRunLauncher,
            agent_run_sse_gateway_1.AgentRunSseGateway,
        ],
        exports: [session_run_coordinator_service_1.SessionRunCoordinator, agent_run_launcher_service_1.AgentRunLauncher, agent_run_sse_gateway_1.AgentRunSseGateway],
    })
], SessionRunModule);
exports.SessionRunModule = SessionRunModule;
//# sourceMappingURL=session-run.module.js.map