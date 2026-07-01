"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const pagination_1 = require("../../common/pagination");
const tool_definition_key_util_1 = require("../../common/tool/tool-definition-key.util");
const runtime_cache_invalidator_service_1 = require("../../core/runtime-cache/runtime-cache-invalidator.service");
const tool_engine_service_1 = require("../../core/tool-engine/tool-engine.service");
const llm_service_1 = require("../../core/llm/llm.service");
const prompt_template_keys_1 = require("../../core/prompt/prompt-template.keys");
const prompt_registry_service_1 = require("../../core/prompt/prompt-registry.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const swagger_tool_import_core_1 = require("../../codegen/swagger-tool-import.core");
const tool_list_filter_util_1 = require("./tool-list-filter.util");
const tool_mapper_1 = require("./tool.mapper");
const tool_types_1 = require("./tool.types");
const tool_decision_input_util_1 = require("../../core/tool-engine/tool-decision-input.util");
const tool_response_profile_spec_util_1 = require("../../core/tool-engine/tool-response-profile.spec.util");
const tool_schema_inference_util_1 = require("./tool-schema-inference.util");
let ToolService = class ToolService {
    constructor(prisma, toolEngine, runtimeCacheInvalidator, llmService, promptRegistry) {
        this.prisma = prisma;
        this.toolEngine = toolEngine;
        this.runtimeCacheInvalidator = runtimeCacheInvalidator;
        this.llmService = llmService;
        this.promptRegistry = promptRegistry;
    }
    async importFromSwagger(dto) {
        var _a;
        if (!dto.autoIntegration && dto.integrationId == null) {
            throw new common_1.BadRequestException('integrationId is required when autoIntegration is false');
        }
        if (dto.autoIntegration && dto.appClientId == null) {
            throw new common_1.BadRequestException('appClientId is required when autoIntegration is true');
        }
        if (dto.integrationId != null && dto.appClientId != null) {
            await this.assertIntegrationBelongsToApp(dto.integrationId, dto.appClientId);
        }
        try {
            const result = await (0, swagger_tool_import_core_1.importSwaggerTools)(this.prisma, {
                specUrl: dto.specUrl,
                insecure: dto.insecure,
                integrationId: dto.integrationId,
                appClientId: dto.appClientId,
                agentId: (_a = dto.agentId) !== null && _a !== void 0 ? _a : null,
                autoIntegration: dto.autoIntegration,
                integrationName: dto.integrationName,
                integrationBaseUrl: dto.integrationBaseUrl,
                integrationApiKey: dto.integrationApiKey,
                integrationAuthMode: dto.integrationAuthMode,
                dryRun: dto.dryRun,
                tags: dto.tags,
                ops: dto.ops,
                pathInclude: dto.pathInclude,
                pathExclude: dto.pathExclude,
                noDefaultPathExclude: dto.noDefaultPathExclude,
            }, 'api-default-all');
            if (!result.dryRun && result.toolIds.length > 0) {
                await this.runtimeCacheInvalidator.invalidateForTools(result.toolIds);
                if (result.agentId != null) {
                    await this.runtimeCacheInvalidator.invalidateForAgent({
                        agentId: result.agentId,
                    });
                }
            }
            return result;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new common_1.BadRequestException(message);
        }
    }
    async create(dto) {
        var _a, _b, _c, _d;
        await this.assertIntegrationBelongsToApp(dto.integrationId, dto.appClientId);
        if (dto.toolCategoryId != null) {
            await this.assertToolCategoryExists(dto.toolCategoryId);
        }
        const name = dto.name.trim();
        if (!name) {
            throw new common_1.BadRequestException('name is required');
        }
        const categoryLabel = await this.resolveToolCategoryLabel(dto.toolCategoryId);
        const definitionKey = (0, tool_definition_key_util_1.resolveToolDefinitionKeyForCreate)({
            definitionKey: dto.definitionKey,
            method: dto.method,
            path: dto.path,
            name,
            categoryLabel,
        });
        await this.assertDefinitionKeyAvailable(dto.appClientId, definitionKey);
        const row = await this.prisma.tool.create({
            data: {
                appClientId: dto.appClientId,
                definitionKey,
                name,
                description: dto.description.trim(),
                riskLevel: (_a = dto.riskLevel) !== null && _a !== void 0 ? _a : client_1.ToolLevel.L1,
                schema: dto.schema,
                inputSchema: dto.inputSchema,
                outputSchema: dto.outputSchema === undefined
                    ? undefined
                    : dto.outputSchema,
                responseProfile: this.resolveResponseProfileForPersist(dto.responseProfile),
                agentMetadata: this.resolveAgentMetadataForPersist(dto.agentMetadata, dto.inputSchema, dto.schema),
                method: dto.method,
                path: dto.path.trim(),
                integrationId: dto.integrationId,
                toolCategoryId: (_b = dto.toolCategoryId) !== null && _b !== void 0 ? _b : null,
                isActive: (_c = dto.isActive) !== null && _c !== void 0 ? _c : true,
                timeout: (_d = dto.timeout) !== null && _d !== void 0 ? _d : null,
            },
            include: tool_types_1.TOOL_DETAIL_INCLUDE,
        });
        return (0, tool_mapper_1.toToolResponse)(row);
    }
    async findPageByAppClientId(appClientId, query) {
        await this.assertAppClientExists(appClientId);
        return this.findPage(Object.assign(Object.assign({}, query), { appClientId }));
    }
    async findPage(query) {
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = this.buildWhere(query);
        const orderBy = this.buildOrderBy(query.orderBy, query.order);
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.tool.findMany({
                where,
                orderBy,
                skip,
                take,
                include: tool_types_1.TOOL_DETAIL_INCLUDE,
            }),
            this.prisma.tool.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)((0, tool_mapper_1.toToolResponseList)(rows), total, page, pageSize);
    }
    async findOne(id) {
        const row = await this.prisma.tool.findUnique({
            where: { id },
            include: tool_types_1.TOOL_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`tool ${id} not found`);
        }
        return (0, tool_mapper_1.toToolResponse)(row);
    }
    async update(id, dto) {
        var _a, _b, _c, _d, _e;
        const existing = await this.findOne(id);
        const appClientId = (_a = dto.appClientId) !== null && _a !== void 0 ? _a : existing.appClientId;
        if (dto.integrationId != null) {
            await this.assertIntegrationBelongsToApp(dto.integrationId, appClientId);
        }
        if (dto.toolCategoryId !== undefined && dto.toolCategoryId != null) {
            await this.assertToolCategoryExists(dto.toolCategoryId);
        }
        let definitionKey;
        if ((_b = dto.definitionKey) === null || _b === void 0 ? void 0 : _b.trim()) {
            definitionKey = (0, tool_definition_key_util_1.normalizeDefinitionKey)(dto.definitionKey);
            await this.assertDefinitionKeyAvailable(appClientId, definitionKey, id);
        }
        const nextInputSchema = dto.inputSchema === undefined ? existing.inputSchema : dto.inputSchema;
        const nextSchema = dto.schema === undefined ? existing.schema : dto.schema;
        const agentMetadataForPersist = this.resolveAgentMetadataForToolPersist({
            agentMetadataRaw: dto.agentMetadata,
            existingAgentMetadata: existing.agentMetadata,
            inputSchema: nextInputSchema,
            fallbackSchema: nextSchema,
            inputSchemaTouched: dto.inputSchema !== undefined,
        });
        try {
            const row = await this.prisma.tool.update({
                where: { id },
                data: {
                    appClientId: dto.appClientId,
                    definitionKey,
                    name: (_c = dto.name) === null || _c === void 0 ? void 0 : _c.trim(),
                    description: (_d = dto.description) === null || _d === void 0 ? void 0 : _d.trim(),
                    riskLevel: dto.riskLevel,
                    schema: dto.schema === undefined
                        ? undefined
                        : dto.schema,
                    inputSchema: dto.inputSchema === undefined
                        ? undefined
                        : dto.inputSchema,
                    outputSchema: dto.outputSchema === undefined
                        ? undefined
                        : dto.outputSchema,
                    responseProfile: this.resolveResponseProfileForPersist(dto.responseProfile),
                    agentMetadata: agentMetadataForPersist,
                    method: dto.method,
                    path: (_e = dto.path) === null || _e === void 0 ? void 0 : _e.trim(),
                    integrationId: dto.integrationId,
                    toolCategoryId: dto.toolCategoryId === undefined
                        ? undefined
                        : dto.toolCategoryId,
                    isActive: dto.isActive,
                    timeout: dto.timeout,
                },
                include: tool_types_1.TOOL_DETAIL_INCLUDE,
            });
            await this.runtimeCacheInvalidator.invalidateForTools([id]);
            return (0, tool_mapper_1.toToolResponse)(row);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`tool ${id} not found`);
            }
            throw error;
        }
    }
    async batchSetActive(dto) {
        const ids = [...new Set(dto.ids)];
        const existing = await this.prisma.tool.findMany({
            where: { id: { in: ids } },
            select: { id: true },
        });
        const existingIds = new Set(existing.map((row) => row.id));
        const notFoundIds = ids.filter((id) => !existingIds.has(id));
        if (existingIds.size === 0) {
            throw new common_1.NotFoundException('no tools found for the given ids');
        }
        await this.prisma.tool.updateMany({
            where: { id: { in: [...existingIds] } },
            data: { isActive: dto.isActive },
        });
        const rows = await this.prisma.tool.findMany({
            where: { id: { in: [...existingIds] } },
            include: tool_types_1.TOOL_DETAIL_INCLUDE,
            orderBy: { id: 'asc' },
        });
        await this.runtimeCacheInvalidator.invalidateForTools([...existingIds]);
        return {
            isActive: dto.isActive,
            updatedCount: rows.length,
            notFoundIds,
            items: (0, tool_mapper_1.toToolResponseList)(rows),
        };
    }
    async debug(id, dto) {
        await this.findOne(id);
        return this.toolEngine.debugExecute(id, {
            parameters: dto.parameters,
            headers: dto.headers,
            apiKey: dto.apiKey,
            timeoutMs: dto.timeoutMs,
        });
    }
    async initSchemasFromDebug(appClientId, id, dto) {
        var _a, _b, _c, _d;
        await this.assertAppClientExists(appClientId);
        const tool = await this.assertToolInAppClient(id, appClientId);
        const debug = await this.toolEngine.debugExecute(id, {
            parameters: dto.parameters,
            headers: dto.headers,
            apiKey: dto.apiKey,
            timeoutMs: dto.timeoutMs,
        });
        if (!debug.ok || ((_a = debug.response) === null || _a === void 0 ? void 0 : _a.data) === undefined) {
            throw new common_1.BadRequestException((_b = debug.error) !== null && _b !== void 0 ? _b : `tool debug failed with status ${(_d = (_c = debug.response) === null || _c === void 0 ? void 0 : _c.status) !== null && _d !== void 0 ? _d : 'unknown'}`);
        }
        const schemaPrompt = await this.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.TOOLS_SCHEMA_INFERENCE, { appClientId });
        const inferred = await (0, tool_schema_inference_util_1.inferToolSchemasFromSample)(this.llmService, {
            toolName: tool.name,
            toolDescription: tool.description,
            method: tool.method,
            path: tool.path,
            httpStatus: debug.response.status,
            sampleData: debug.response.data,
            inputSchema: tool.inputSchema,
            hint: dto.hint,
            agentMetadata: tool.agentMetadata,
        }, schemaPrompt);
        const persist = dto.persist !== false;
        let updatedTool;
        if (persist) {
            const row = await this.prisma.tool.update({
                where: { id },
                data: {
                    outputSchema: inferred.outputSchema,
                    responseProfile: this.resolveResponseProfileForPersist(inferred.responseProfile, debug.response.data),
                    agentMetadata: this.resolveAgentMetadataForPersist(inferred.agentMetadata, tool.inputSchema, tool.schema),
                },
                include: tool_types_1.TOOL_DETAIL_INCLUDE,
            });
            updatedTool = (0, tool_mapper_1.toToolResponse)(row);
        }
        else {
            updatedTool = (0, tool_mapper_1.toToolResponse)(tool);
        }
        return {
            debug,
            outputSchema: inferred.outputSchema,
            responseProfile: inferred.responseProfile,
            agentMetadata: inferred.agentMetadata,
            source: inferred.source,
            agentMetadataSource: inferred.agentMetadataSource,
            persisted: persist,
            tool: updatedTool,
        };
    }
    resolveResponseProfileForPersist(raw, sampleData) {
        if (raw === undefined) {
            return undefined;
        }
        const profile = (0, tool_response_profile_spec_util_1.parseAndNormalizeResponseProfile)(raw, sampleData);
        if (!profile) {
            throw new common_1.BadRequestException('responseProfile invalid: coreFields is required');
        }
        return profile;
    }
    resolveAgentMetadataForPersist(raw, inputSchema, fallbackSchema) {
        if (raw === undefined) {
            return undefined;
        }
        const normalized = (0, tool_decision_input_util_1.normalizeAgentMetadataForPersist)(raw, inputSchema, fallbackSchema);
        if (!normalized) {
            throw new common_1.BadRequestException('agentMetadata invalid: mode, resource, and operation are required');
        }
        return normalized;
    }
    resolveAgentMetadataForToolPersist(options) {
        const { agentMetadataRaw, existingAgentMetadata, inputSchema, fallbackSchema, inputSchemaTouched, } = options;
        if (agentMetadataRaw !== undefined) {
            return this.resolveAgentMetadataForPersist(agentMetadataRaw, inputSchema, fallbackSchema);
        }
        if (inputSchemaTouched && existingAgentMetadata != null) {
            const synced = (0, tool_decision_input_util_1.normalizeAgentMetadataForPersist)(existingAgentMetadata, inputSchema, fallbackSchema);
            if (synced) {
                return synced;
            }
        }
        return undefined;
    }
    async remove(id) {
        await this.findOne(id);
        try {
            const row = await this.prisma.tool.delete({
                where: { id },
                include: tool_types_1.TOOL_DETAIL_INCLUDE,
            });
            await this.runtimeCacheInvalidator.invalidateForTools([id]);
            return (0, tool_mapper_1.toToolResponse)(row);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2003') {
                throw new common_1.BadRequestException(`tool ${id} is referenced by agent/skill/role and cannot be deleted`);
            }
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`tool ${id} not found`);
            }
            throw error;
        }
    }
    buildWhere(query) {
        const base = {};
        if (query.appClientId != null) {
            base.appClientId = query.appClientId;
        }
        return (0, tool_list_filter_util_1.buildToolWhereFromFilters)(query, base);
    }
    buildOrderBy(orderBy, order) {
        const direction = (0, pagination_1.resolveSortOrder)(order);
        switch (orderBy !== null && orderBy !== void 0 ? orderBy : 'id') {
            case 'name':
                return { name: direction };
            case 'createdAt':
                return { createdAt: direction };
            case 'updatedAt':
                return { updatedAt: direction };
            case 'riskLevel':
                return { riskLevel: direction };
            case 'path':
                return { path: direction };
            case 'id':
            default:
                return { id: direction };
        }
    }
    async assertAppClientExists(appClientId) {
        const row = await this.prisma.appClient.findUnique({
            where: { id: appClientId },
            select: { id: true },
        });
        if (!row) {
            throw new common_1.BadRequestException(`appClient ${appClientId} not found`);
        }
    }
    async assertToolInAppClient(toolId, appClientId) {
        const row = await this.prisma.tool.findFirst({
            where: { id: toolId, appClientId },
            include: tool_types_1.TOOL_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`tool ${toolId} not found under appClient ${appClientId}`);
        }
        return row;
    }
    async assertIntegrationBelongsToApp(integrationId, appClientId) {
        const row = await this.prisma.integration.findFirst({
            where: { id: integrationId, appClientId },
            select: { id: true },
        });
        if (!row) {
            throw new common_1.BadRequestException(`integration ${integrationId} not found under appClient ${appClientId}`);
        }
    }
    async assertToolCategoryExists(toolCategoryId) {
        const row = await this.prisma.toolCategory.findUnique({
            where: { id: toolCategoryId },
            select: { id: true },
        });
        if (!row) {
            throw new common_1.NotFoundException(`toolCategory ${toolCategoryId} not found`);
        }
    }
    async resolveToolCategoryLabel(toolCategoryId) {
        var _a;
        if (toolCategoryId == null) {
            return null;
        }
        const row = await this.prisma.toolCategory.findUnique({
            where: { id: toolCategoryId },
            select: { label: true },
        });
        return (_a = row === null || row === void 0 ? void 0 : row.label) !== null && _a !== void 0 ? _a : null;
    }
    async assertDefinitionKeyAvailable(appClientId, definitionKey, excludeToolId) {
        const row = await this.prisma.tool.findFirst({
            where: { appClientId, definitionKey },
            select: { id: true },
        });
        if (row && row.id !== excludeToolId) {
            throw new common_1.BadRequestException(`definitionKey "${definitionKey}" already exists under appClient ${appClientId}`);
        }
    }
};
ToolService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tool_engine_service_1.ToolEngineService,
        runtime_cache_invalidator_service_1.RuntimeCacheInvalidator,
        llm_service_1.LlmService,
        prompt_registry_service_1.PromptRegistryService])
], ToolService);
exports.ToolService = ToolService;
//# sourceMappingURL=tool.service.js.map