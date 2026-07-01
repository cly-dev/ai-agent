"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryModule = void 0;
const common_1 = require("@nestjs/common");
const llm_module_1 = require("../llm/llm.module");
const prompt_module_1 = require("../prompt/prompt.module");
const prisma_module_1 = require("../../prisma/prisma.module");
const redis_connection_service_1 = require("./redis/redis-connection.service");
const session_context_store_1 = require("./context/session-context.store");
const user_memory_store_1 = require("./user/user-memory.store");
const session_history_compression_service_1 = require("./context/session-history-compression.service");
const session_message_context_sync_service_1 = require("./context/session-message-context-sync.service");
const session_goa_store_1 = require("./goa/session-goa.store");
const session_goa_replay_service_1 = require("./goa/session-goa-replay.service");
const session_goa_service_1 = require("./goa/session-goa.service");
const session_resume_gate_service_1 = require("./resume/session-resume-gate.service");
const session_task_resume_followup_service_1 = require("./resume/session-task-resume-followup.service");
const session_run_state_store_1 = require("./session-run/session-run-state.store");
let MemoryModule = class MemoryModule {
};
MemoryModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [llm_module_1.LlmModule, prompt_module_1.PromptModule, prisma_module_1.PrismaModule],
        providers: [
            redis_connection_service_1.RedisConnectionService,
            user_memory_store_1.UserMemoryStore,
            session_context_store_1.SessionContextStore,
            session_goa_replay_service_1.SessionGoaReplayService,
            session_goa_store_1.SessionGoaStore,
            session_goa_service_1.SessionGoaService,
            session_resume_gate_service_1.SessionResumeGateService,
            session_task_resume_followup_service_1.SessionTaskResumeFollowUpService,
            session_history_compression_service_1.SessionHistoryCompressionService,
            session_message_context_sync_service_1.SessionMessageContextSyncService,
            session_run_state_store_1.SessionRunStateStore,
        ],
        exports: [
            redis_connection_service_1.RedisConnectionService,
            user_memory_store_1.UserMemoryStore,
            session_context_store_1.SessionContextStore,
            session_goa_replay_service_1.SessionGoaReplayService,
            session_goa_store_1.SessionGoaStore,
            session_goa_service_1.SessionGoaService,
            session_resume_gate_service_1.SessionResumeGateService,
            session_task_resume_followup_service_1.SessionTaskResumeFollowUpService,
            session_history_compression_service_1.SessionHistoryCompressionService,
            session_message_context_sync_service_1.SessionMessageContextSyncService,
            session_run_state_store_1.SessionRunStateStore,
        ],
    })
], MemoryModule);
exports.MemoryModule = MemoryModule;
//# sourceMappingURL=memory.module.js.map