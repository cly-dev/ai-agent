"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePageWorkflowFetchData = void 0;
const common_1 = require("@nestjs/common");
const page_workflow_tool_bundle_util_1 = require("./page-workflow-tool-bundle.util");
const page_context_metadata_scan_util_1 = require("../host-bridge/page-context-metadata-scan.util");
const decision_util_1 = require("../agent-engine/engine/main/agent-graph/runtime/decision.util");
const resolve_workflow_node_tool_refs_util_1 = require("../workflow/resolve-workflow-node-tool-refs.util");
const page_action_run_audit_util_1 = require("./page-action-run-audit.util");
function buildReadToolInputFromPageContext(pageContext, pathTemplate) {
    var _a, _b;
    const input = {};
    const entity = pageContext === null || pageContext === void 0 ? void 0 : pageContext.entity;
    if (entity && typeof entity === 'object' && !Array.isArray(entity)) {
        Object.assign(input, entity);
    }
    const entityId = (0, page_context_metadata_scan_util_1.resolvePageContextEntityId)(pageContext);
    if (entityId) {
        input.id = entityId;
    }
    const pathKeys = (_b = (_a = pathTemplate.match(/\{([^/{}]+)\}/g)) === null || _a === void 0 ? void 0 : _a.map((match) => match.slice(1, -1))) !== null && _b !== void 0 ? _b : [];
    for (const key of pathKeys) {
        if (input[key] == null && entityId) {
            input[key] = entityId;
        }
    }
    return input;
}
async function resolveFetchDataTool(prisma, input) {
    var _a;
    const include = { integration: true };
    if (input.toolId != null) {
        const tool = await prisma.tool.findFirst({
            where: {
                id: input.toolId,
                appClientId: input.appClientId,
                isActive: true,
            },
            include,
        });
        if (!tool) {
            throw new common_1.NotFoundException({
                code: 'FETCH_TOOL_NOT_FOUND',
                message: `Tool id=${input.toolId} not found for app`,
            });
        }
        return tool;
    }
    const definitionKey = (_a = input.definitionKey) === null || _a === void 0 ? void 0 : _a.trim();
    if (definitionKey) {
        const tool = await prisma.tool.findFirst({
            where: {
                definitionKey,
                appClientId: input.appClientId,
                isActive: true,
            },
            include,
        });
        if (!tool) {
            throw new common_1.NotFoundException({
                code: 'FETCH_TOOL_NOT_FOUND',
                message: `Tool definitionKey="${definitionKey}" not found for app`,
            });
        }
        return tool;
    }
    throw new common_1.BadRequestException({
        code: 'FETCH_TOOL_UNRESOLVED',
        message: 'fetch_data node requires toolIds/toolId or definitionKey',
    });
}
async function resolveFetchToolsForNode(input) {
    var _a;
    const toolIds = (0, resolve_workflow_node_tool_refs_util_1.resolveFetchDataToolIds)(input.nodeInput);
    if (toolIds.length === 0) {
        return [
            await resolveFetchDataTool(input.prisma, {
                appClientId: input.appClientId,
                definitionKey: input.nodeInput.definitionKey,
            }),
        ];
    }
    const tools = [];
    for (const toolId of toolIds) {
        const cached = (_a = input.toolBundle) === null || _a === void 0 ? void 0 : _a.toolById.get(toolId);
        if (cached) {
            tools.push(cached);
            continue;
        }
        tools.push(await resolveFetchDataTool(input.prisma, {
            appClientId: input.appClientId,
            toolId,
        }));
    }
    return tools;
}
async function selectFetchToolViaLlm(input) {
    var _a;
    const defs = input.tools.map((tool) => (0, page_workflow_tool_bundle_util_1.toToolExecutionDefinition)(tool));
    const bundle = input.toolEngine.buildLangChainTools(defs, input.toolBuildCtx);
    const promptMessages = [...input.messages];
    if ((_a = input.objective) === null || _a === void 0 ? void 0 : _a.trim()) {
        promptMessages.push({
            role: 'user',
            content: [
                `Select and call exactly one of the bound read tools to satisfy: ${input.objective.trim()}`,
                'Do not answer in prose — emit a single tool_call.',
            ].join(' '),
        });
    }
    const { model, messages: fitted } = await input.llmService.createLangChainChatModelForMessages(promptMessages, {
        budgetHints: { callKind: 'decision' },
    });
    const bound = model.bindTools(bundle.tools);
    const aiMessage = (await bound.invoke(fitted));
    const calls = (0, decision_util_1.extractToolCalls)(aiMessage);
    const allowed = new Set(input.tools.map((tool) => tool.name));
    const selected = calls.find((call) => allowed.has(call.name));
    if (!selected) {
        throw new common_1.BadRequestException({
            code: 'FETCH_TOOL_CHOICE_FAILED',
            message: 'LLM did not select a bound fetch_data tool',
        });
    }
    const tool = input.tools.find((row) => row.name === selected.name);
    if (!tool) {
        throw new common_1.BadRequestException({
            code: 'FETCH_TOOL_CHOICE_FAILED',
            message: `Selected tool ${selected.name} not in candidates`,
        });
    }
    return tool;
}
async function executePageWorkflowFetchData(input) {
    var _a, _b, _c, _d, _e;
    const tools = await resolveFetchToolsForNode({
        prisma: input.prisma,
        appClientId: input.appClientId,
        nodeInput: input.nodeInput,
        toolBundle: input.toolBundle,
    });
    let tool = tools[0];
    if (!tool) {
        throw new common_1.BadRequestException({
            code: 'FETCH_TOOL_UNRESOLVED',
            message: 'fetch_data node has no resolvable tools',
        });
    }
    if (tools.length > 1) {
        if (!input.llmService || !input.toolBundle) {
            throw new common_1.BadRequestException({
                code: 'FETCH_TOOL_CHOICE_UNAVAILABLE',
                message: 'fetch_data with multiple toolIds requires LLM tool choice',
            });
        }
        tool = await selectFetchToolViaLlm({
            llmService: input.llmService,
            toolEngine: input.toolEngine,
            tools,
            messages: (_a = input.messages) !== null && _a !== void 0 ? _a : [],
            toolBuildCtx: input.toolBundle.toolBuildCtx,
            objective: input.nodeObjective,
        });
    }
    const args = buildReadToolInputFromPageContext(input.pageContext, tool.path);
    const toolStepId = (_b = input.nodeId) !== null && _b !== void 0 ? _b : 'fetch_data';
    (_c = input.stepRecorder) === null || _c === void 0 ? void 0 : _c.record({
        type: 'workflow',
        name: `${toolStepId}:tool:start`,
        detail: (0, page_action_run_audit_util_1.buildToolCallRequestAudit)({
            toolName: tool.name,
            toolId: tool.id,
            arguments: args,
            httpMethod: tool.method,
            httpPath: tool.path,
        }),
    });
    const result = await input.toolEngine.executeFromDefinition((0, page_workflow_tool_bundle_util_1.toToolExecutionDefinition)(tool), args, input.userId, {
        integrationCredentialCache: (_d = input.toolBundle) === null || _d === void 0 ? void 0 : _d.toolBuildCtx.integrationCredentialCache,
    });
    (_e = input.stepRecorder) === null || _e === void 0 ? void 0 : _e.record({
        type: 'workflow',
        name: `${toolStepId}:tool:complete`,
        detail: (0, page_action_run_audit_util_1.buildToolCallResultAudit)(result),
        status: 'ok',
    });
    return {
        name: tool.name,
        output: result.output,
        args,
        toolId: tool.id,
        toolName: tool.name,
        agentMetadata: tool.agentMetadata,
    };
}
exports.executePageWorkflowFetchData = executePageWorkflowFetchData;
//# sourceMappingURL=page-workflow-fetch-data.util.js.map