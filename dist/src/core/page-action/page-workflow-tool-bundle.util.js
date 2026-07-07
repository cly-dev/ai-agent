"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toToolExecutionDefinition = exports.loadPageWorkflowToolBundle = void 0;
const agent_tool_runtime_util_1 = require("../agent-engine/engine/main/runtime/agent-tool-runtime.util");
const TOOL_WITH_INTEGRATION_INCLUDE = { integration: true };
function integrationCredentialCacheKey(userId, integrationId) {
    return `${userId}:${integrationId}`;
}
async function loadPageWorkflowToolBundle(input) {
    var _a, _b;
    const allowedToolIds = [...new Set(input.allowedToolIds)];
    if (allowedToolIds.length === 0) {
        return {
            allowedToolIds: [],
            prismaTools: [],
            toolById: new Map(),
            engineTools: [],
            toolBuildCtx: {
                userId: input.userId,
                allowedToolIds: [],
                integrationCredentialCache: new Map(),
            },
        };
    }
    const prismaTools = await input.prisma.tool.findMany({
        where: {
            id: { in: allowedToolIds },
            appClientId: input.appClientId,
            isActive: true,
        },
        include: TOOL_WITH_INTEGRATION_INCLUDE,
    });
    const integrationCredentialCache = new Map();
    const integrationIds = [
        ...new Set(prismaTools.map((tool) => tool.integration.id)),
    ];
    if (integrationIds.length > 0) {
        const userIntegrations = await input.prisma.userIntegration.findMany({
            where: {
                userId: input.userId,
                integrationId: { in: integrationIds },
                isActive: true,
            },
            select: {
                integrationId: true,
                userApiKey: true,
            },
        });
        for (const row of userIntegrations) {
            integrationCredentialCache.set(integrationCredentialCacheKey(input.userId, row.integrationId), (_b = (_a = row.userApiKey) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '');
        }
    }
    const { tools: engineTools, toolBuildCtx } = (0, agent_tool_runtime_util_1.buildEngineToolsFromAllowed)(prismaTools, input.userId, input.toolEngine);
    return {
        allowedToolIds,
        prismaTools,
        toolById: new Map(prismaTools.map((tool) => [tool.id, tool])),
        engineTools,
        toolBuildCtx: Object.assign(Object.assign({}, toolBuildCtx), { integrationCredentialCache }),
    };
}
exports.loadPageWorkflowToolBundle = loadPageWorkflowToolBundle;
function toToolExecutionDefinition(tool) {
    return {
        id: tool.id,
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        schema: tool.schema,
        method: tool.method,
        path: tool.path,
        timeout: tool.timeout,
        integration: {
            id: tool.integration.id,
            name: tool.integration.name,
            baseUrl: tool.integration.baseUrl,
            authMode: tool.integration.authMode,
            apiKey: tool.integration.apiKey,
        },
        agentMetadata: tool.agentMetadata,
        responseProfile: tool.responseProfile,
    };
}
exports.toToolExecutionDefinition = toToolExecutionDefinition;
//# sourceMappingURL=page-workflow-tool-bundle.util.js.map