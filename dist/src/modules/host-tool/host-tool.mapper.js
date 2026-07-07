"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSkillHostToolsBindingResponse = exports.toAgentHostToolsBindingResponse = exports.toSkillHostToolBindingResponse = exports.toAgentHostToolBindingResponse = exports.toClientHostToolCatalogItem = exports.toHostToolResponse = exports.toHostPageResponse = void 0;
function toHostPageResponse(row) {
    var _a, _b;
    return {
        id: row.id,
        appClientId: row.appClientId,
        appClientName: (_a = row.appClient) === null || _a === void 0 ? void 0 : _a.name,
        scope: row.scope,
        label: row.label,
        description: row.description,
        routePattern: row.routePattern,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
        hostToolCount: (_b = row._count) === null || _b === void 0 ? void 0 : _b.hostTools,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
exports.toHostPageResponse = toHostPageResponse;
function toHostToolResponse(row) {
    var _a, _b, _c, _d, _e;
    return {
        id: row.id,
        appClientId: row.appClientId,
        appClientName: (_a = row.appClient) === null || _a === void 0 ? void 0 : _a.name,
        hostPageId: row.hostPageId,
        pageScope: (_c = (_b = row.hostPage) === null || _b === void 0 ? void 0 : _b.scope) !== null && _c !== void 0 ? _c : null,
        pageLabel: (_e = (_d = row.hostPage) === null || _d === void 0 ? void 0 : _d.label) !== null && _e !== void 0 ? _e : null,
        definitionKey: row.definitionKey,
        name: row.name,
        description: row.description,
        argsSchema: row.argsSchema,
        argsTemplate: row.argsTemplate,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
        config: row.config,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
exports.toHostToolResponse = toHostToolResponse;
function toClientHostToolCatalogItem(row) {
    var _a, _b;
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        argsSchema: row.argsSchema,
        pageScope: (_b = (_a = row.hostPage) === null || _a === void 0 ? void 0 : _a.scope) !== null && _b !== void 0 ? _b : null,
        definitionKey: row.definitionKey,
    };
}
exports.toClientHostToolCatalogItem = toClientHostToolCatalogItem;
function toAgentHostToolBindingResponse(row) {
    return {
        id: row.id,
        agentId: row.agentId,
        hostToolId: row.hostToolId,
        hostTool: toHostToolResponse(row.hostTool),
    };
}
exports.toAgentHostToolBindingResponse = toAgentHostToolBindingResponse;
function toSkillHostToolBindingResponse(row) {
    return {
        id: row.id,
        skillId: row.skillId,
        hostToolId: row.hostToolId,
        trigger: row.trigger,
        priority: row.priority,
        isRequired: row.isRequired,
        skillArgsTemplate: row.argsTemplate,
        hostTool: toHostToolResponse(row.hostTool),
    };
}
exports.toSkillHostToolBindingResponse = toSkillHostToolBindingResponse;
function toAgentHostToolsBindingResponse(agentId, appClientId, bindings) {
    const agentHostTools = bindings.map((row) => toAgentHostToolBindingResponse(row));
    return {
        agentId,
        appClientId,
        hostTools: agentHostTools.map((row) => row.hostTool),
        agentHostTools,
    };
}
exports.toAgentHostToolsBindingResponse = toAgentHostToolsBindingResponse;
function toSkillHostToolsBindingResponse(skillId, appClientId, bindings) {
    const skillHostTools = bindings.map((row) => toSkillHostToolBindingResponse(row));
    return {
        skillId,
        appClientId,
        hostTools: skillHostTools.map((row) => row.hostTool),
        skillHostTools,
    };
}
exports.toSkillHostToolsBindingResponse = toSkillHostToolsBindingResponse;
//# sourceMappingURL=host-tool.mapper.js.map