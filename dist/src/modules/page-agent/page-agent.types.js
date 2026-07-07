"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGE_AGENT_LLM_PROXY_AUDIT_INCLUDE = void 0;
exports.PAGE_AGENT_LLM_PROXY_AUDIT_INCLUDE = {
    appClient: { select: { id: true, name: true, dsn: true } },
    user: { select: { id: true, username: true, email: true } },
    modelConfig: { select: { id: true, provider: true, model: true } },
};
//# sourceMappingURL=page-agent.types.js.map