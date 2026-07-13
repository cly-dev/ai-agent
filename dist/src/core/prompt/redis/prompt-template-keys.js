"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptTemplateActiveKey = void 0;
const memory_constants_1 = require("../../memory/shared/memory.constants");
function promptTemplateActiveKey(key, appClientId, agentId, locale) {
    const app = appClientId == null ? '_' : String(appClientId);
    const agent = agentId == null ? '_' : String(agentId);
    return `${memory_constants_1.REDIS_KEY_PREFIX}prompt:active:${key}:${app}:${agent}:${locale}`;
}
exports.promptTemplateActiveKey = promptTemplateActiveKey;
//# sourceMappingURL=prompt-template-keys.js.map