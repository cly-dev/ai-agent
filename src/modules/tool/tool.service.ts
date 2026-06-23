import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ToolLevel } from '../../../generated/prisma/client';
import {
  type PaginatedResult,
  resolvePagination,
  resolveSortOrder,
  toPaginatedResult,
} from '../../common/pagination';
import {
  normalizeDefinitionKey,
  resolveToolDefinitionKeyForCreate,
} from '../../common/tool/tool-definition-key.util';
import { RuntimeCacheInvalidator } from '../../core/runtime-cache/runtime-cache-invalidator.service';
import { ToolEngineService } from '../../core/tool-engine/tool-engine.service';
import type { ToolDebugResult } from '../../core/tool-engine/tool-engine.types';
import { LlmService } from '../../core/llm/llm.service';
import { PROMPT_KEYS } from '../../core/prompt/prompt-template.keys';
import { PromptRegistryService } from '../../core/prompt/prompt-registry.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  importSwaggerTools,
  type SwaggerToolImportResult,
} from '../../codegen/swagger-tool-import.core';
import { CreateToolDto } from './dto/create-tool.dto';
import { BatchSetToolsActiveDto } from './dto/batch-set-tools-active.dto';
import { DebugToolDto } from './dto/debug-tool.dto';
import { InitToolSchemasFromDebugDto } from './dto/init-tool-schemas-from-debug.dto';
import { ImportToolsFromSwaggerDto } from './dto/import-tools-from-swagger.dto';
import { QueryToolDto, type ToolOrderByField } from './dto/query-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { buildToolWhereFromFilters } from './tool-list-filter.util';
import { toToolResponse, toToolResponseList } from './tool.mapper';
import { TOOL_DETAIL_INCLUDE } from './tool.types';
import type {
  InitToolSchemasFromDebugResult,
  ToolDetailRow,
  ToolResponse,
} from './tool.types';
import { normalizeAgentMetadataForPersist } from '../../core/tool-engine/tool-decision-input.util';
import { parseAndNormalizeResponseProfile } from '../../core/tool-engine/tool-response-profile.spec.util';
import { inferToolSchemasFromSample } from './tool-schema-inference.util';

@Injectable()
export class ToolService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly toolEngine: ToolEngineService,
    private readonly runtimeCacheInvalidator: RuntimeCacheInvalidator,
    private readonly llmService: LlmService,
    private readonly promptRegistry: PromptRegistryService,
  ) {}

  async importFromSwagger(
    dto: ImportToolsFromSwaggerDto,
  ): Promise<SwaggerToolImportResult> {
    if (!dto.autoIntegration && dto.integrationId == null) {
      throw new BadRequestException(
        'integrationId is required when autoIntegration is false',
      );
    }
    if (dto.autoIntegration && dto.appClientId == null) {
      throw new BadRequestException(
        'appClientId is required when autoIntegration is true',
      );
    }
    if (dto.integrationId != null && dto.appClientId != null) {
      await this.assertIntegrationBelongsToApp(
        dto.integrationId,
        dto.appClientId,
      );
    }
    try {
      const result = await importSwaggerTools(
        this.prisma,
        {
          specUrl: dto.specUrl,
          insecure: dto.insecure,
          integrationId: dto.integrationId,
          appClientId: dto.appClientId,
          agentId: dto.agentId ?? null,
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
        },
        'api-default-all',
      );
      if (!result.dryRun && result.toolIds.length > 0) {
        await this.runtimeCacheInvalidator.invalidateForTools(result.toolIds);
        if (result.agentId != null) {
          await this.runtimeCacheInvalidator.invalidateForAgent({
            agentId: result.agentId,
          });
        }
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(message);
    }
  }

  async create(dto: CreateToolDto): Promise<ToolResponse> {
    await this.assertIntegrationBelongsToApp(
      dto.integrationId,
      dto.appClientId,
    );
    if (dto.toolCategoryId != null) {
      await this.assertToolCategoryExists(dto.toolCategoryId);
    }
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('name is required');
    }
    const categoryLabel = await this.resolveToolCategoryLabel(dto.toolCategoryId);
    const definitionKey = resolveToolDefinitionKeyForCreate({
      definitionKey: dto.definitionKey,
      method: dto.method,
      path: dto.path,
      name,
      categoryLabel,
    });
    await this.assertDefinitionKeyAvailable(
      dto.appClientId,
      definitionKey,
    );
    const row = await this.prisma.tool.create({
      data: {
        appClientId: dto.appClientId,
        definitionKey,
        name,
        description: dto.description.trim(),
        riskLevel: dto.riskLevel ?? ToolLevel.L1,
        schema: dto.schema as Prisma.InputJsonValue,
        inputSchema: dto.inputSchema as Prisma.InputJsonValue,
        outputSchema:
          dto.outputSchema === undefined
            ? undefined
            : (dto.outputSchema as Prisma.InputJsonValue),
        responseProfile: this.resolveResponseProfileForPersist(
          dto.responseProfile,
        ),
        agentMetadata: this.resolveAgentMetadataForPersist(
          dto.agentMetadata,
          dto.inputSchema,
          dto.schema,
        ),
        method: dto.method,
        path: dto.path.trim(),
        integrationId: dto.integrationId,
        toolCategoryId: dto.toolCategoryId ?? null,
        isActive: dto.isActive ?? true,
        timeout: dto.timeout ?? null,
      },
      include: TOOL_DETAIL_INCLUDE,
    });
    return toToolResponse(row);
  }

  async findPageByAppClientId(
    appClientId: number,
    query: QueryToolDto,
  ): Promise<PaginatedResult<ToolResponse>> {
    await this.assertAppClientExists(appClientId);
    return this.findPage({ ...query, appClientId });
  }

  async findPage(query: QueryToolDto): Promise<PaginatedResult<ToolResponse>> {
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(query.orderBy, query.order);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.tool.findMany({
        where,
        orderBy,
        skip,
        take,
        include: TOOL_DETAIL_INCLUDE,
      }),
      this.prisma.tool.count({ where }),
    ]);
    return toPaginatedResult(toToolResponseList(rows), total, page, pageSize);
  }

  async findOne(id: number): Promise<ToolResponse> {
    const row = await this.prisma.tool.findUnique({
      where: { id },
      include: TOOL_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`tool ${id} not found`);
    }
    return toToolResponse(row);
  }

  async update(id: number, dto: UpdateToolDto): Promise<ToolResponse> {
    const existing = await this.findOne(id);
    const appClientId = dto.appClientId ?? existing.appClientId;
    if (dto.integrationId != null) {
      await this.assertIntegrationBelongsToApp(dto.integrationId, appClientId);
    }
    if (dto.toolCategoryId !== undefined && dto.toolCategoryId != null) {
      await this.assertToolCategoryExists(dto.toolCategoryId);
    }
    let definitionKey: string | undefined;
    if (dto.definitionKey?.trim()) {
      definitionKey = normalizeDefinitionKey(dto.definitionKey);
      await this.assertDefinitionKeyAvailable(appClientId, definitionKey, id);
    }
    const nextInputSchema =
      dto.inputSchema === undefined ? existing.inputSchema : dto.inputSchema;
    const nextSchema =
      dto.schema === undefined ? existing.schema : dto.schema;
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
          name: dto.name?.trim(),
          description: dto.description?.trim(),
          riskLevel: dto.riskLevel,
          schema:
            dto.schema === undefined
              ? undefined
              : (dto.schema as Prisma.InputJsonValue),
          inputSchema:
            dto.inputSchema === undefined
              ? undefined
              : (dto.inputSchema as Prisma.InputJsonValue),
          outputSchema:
            dto.outputSchema === undefined
              ? undefined
              : (dto.outputSchema as Prisma.InputJsonValue),
          responseProfile: this.resolveResponseProfileForPersist(
            dto.responseProfile,
          ),
          agentMetadata: agentMetadataForPersist,
          method: dto.method,
          path: dto.path?.trim(),
          integrationId: dto.integrationId,
          toolCategoryId:
            dto.toolCategoryId === undefined
              ? undefined
              : dto.toolCategoryId,
          isActive: dto.isActive,
          timeout: dto.timeout,
        },
        include: TOOL_DETAIL_INCLUDE,
      });
      await this.runtimeCacheInvalidator.invalidateForTools([id]);
      return toToolResponse(row);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`tool ${id} not found`);
      }
      throw error;
    }
  }

  async batchSetActive(dto: BatchSetToolsActiveDto): Promise<{
    isActive: boolean;
    updatedCount: number;
    notFoundIds: number[];
    items: ToolResponse[];
  }> {
    const ids = [...new Set(dto.ids)];
    const existing = await this.prisma.tool.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((row) => row.id));
    const notFoundIds = ids.filter((id) => !existingIds.has(id));

    if (existingIds.size === 0) {
      throw new NotFoundException('no tools found for the given ids');
    }

    await this.prisma.tool.updateMany({
      where: { id: { in: [...existingIds] } },
      data: { isActive: dto.isActive },
    });

    const rows = await this.prisma.tool.findMany({
      where: { id: { in: [...existingIds] } },
      include: TOOL_DETAIL_INCLUDE,
      orderBy: { id: 'asc' },
    });

    await this.runtimeCacheInvalidator.invalidateForTools([...existingIds]);

    return {
      isActive: dto.isActive,
      updatedCount: rows.length,
      notFoundIds,
      items: toToolResponseList(rows),
    };
  }

  async debug(id: number, dto: DebugToolDto): Promise<ToolDebugResult> {
    await this.findOne(id);
    return this.toolEngine.debugExecute(id, {
      parameters: dto.parameters,
      headers: dto.headers,
      apiKey: dto.apiKey,
      timeoutMs: dto.timeoutMs,
    });
  }

  async initSchemasFromDebug(
    appClientId: number,
    id: number,
    dto: InitToolSchemasFromDebugDto,
  ): Promise<InitToolSchemasFromDebugResult> {
    await this.assertAppClientExists(appClientId);
    const tool = await this.assertToolInAppClient(id, appClientId);

    const debug = await this.toolEngine.debugExecute(id, {
      parameters: dto.parameters,
      headers: dto.headers,
      apiKey: dto.apiKey,
      timeoutMs: dto.timeoutMs,
    });
    if (!debug.ok || debug.response?.data === undefined) {
      throw new BadRequestException(
        debug.error ??
          `tool debug failed with status ${debug.response?.status ?? 'unknown'}`,
      );
    }

    const schemaPrompt = await this.promptRegistry.render(
      PROMPT_KEYS.TOOLS_SCHEMA_INFERENCE,
      { appClientId },
    );
    const inferred = await inferToolSchemasFromSample(
      this.llmService,
      {
        toolName: tool.name,
        toolDescription: tool.description,
        method: tool.method,
        path: tool.path,
        httpStatus: debug.response.status,
        sampleData: debug.response.data,
        inputSchema: tool.inputSchema,
        hint: dto.hint,
        agentMetadata: tool.agentMetadata,
      },
      schemaPrompt,
    );

    const persist = dto.persist !== false;
    let updatedTool: ToolResponse;
    if (persist) {
      const row = await this.prisma.tool.update({
        where: { id },
        data: {
          outputSchema: inferred.outputSchema as Prisma.InputJsonValue,
          responseProfile: this.resolveResponseProfileForPersist(
            inferred.responseProfile,
            debug.response.data,
          )!,
          agentMetadata: this.resolveAgentMetadataForPersist(
            inferred.agentMetadata,
            tool.inputSchema,
            tool.schema,
          )!,
        },
        include: TOOL_DETAIL_INCLUDE,
      });
      updatedTool = toToolResponse(row);
    } else {
      updatedTool = toToolResponse(tool);
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

  private resolveResponseProfileForPersist(
    raw: unknown,
    sampleData?: unknown,
  ): Prisma.InputJsonValue | undefined {
    if (raw === undefined) {
      return undefined;
    }
    const profile = parseAndNormalizeResponseProfile(raw, sampleData);
    if (!profile) {
      throw new BadRequestException(
        'responseProfile invalid: coreFields is required',
      );
    }
    return profile as unknown as Prisma.InputJsonValue;
  }

  private resolveAgentMetadataForPersist(
    raw: unknown,
    inputSchema: unknown,
    fallbackSchema?: unknown,
  ): Prisma.InputJsonValue | undefined {
    if (raw === undefined) {
      return undefined;
    }
    const normalized = normalizeAgentMetadataForPersist(
      raw,
      inputSchema,
      fallbackSchema,
    );
    if (!normalized) {
      throw new BadRequestException(
        'agentMetadata invalid: mode, resource, and operation are required',
      );
    }
    return normalized as unknown as Prisma.InputJsonValue;
  }

  /**
   * 创建/更新时同步 paramFormatHints：仅维护 inputSchema.parameters（及 body），
   * 忽略请求里的 paramFormatHints；仅改 inputSchema 时也会刷新已有 agentMetadata。
   */
  private resolveAgentMetadataForToolPersist(options: {
    agentMetadataRaw: unknown | undefined;
    existingAgentMetadata?: unknown;
    inputSchema: unknown;
    fallbackSchema?: unknown;
    inputSchemaTouched: boolean;
  }): Prisma.InputJsonValue | undefined {
    const {
      agentMetadataRaw,
      existingAgentMetadata,
      inputSchema,
      fallbackSchema,
      inputSchemaTouched,
    } = options;

    if (agentMetadataRaw !== undefined) {
      return this.resolveAgentMetadataForPersist(
        agentMetadataRaw,
        inputSchema,
        fallbackSchema,
      );
    }

    if (inputSchemaTouched && existingAgentMetadata != null) {
      const synced = normalizeAgentMetadataForPersist(
        existingAgentMetadata,
        inputSchema,
        fallbackSchema,
      );
      if (synced) {
        return synced as unknown as Prisma.InputJsonValue;
      }
    }

    return undefined;
  }

  async remove(id: number): Promise<ToolResponse> {
    await this.findOne(id);
    try {
      const row = await this.prisma.tool.delete({
        where: { id },
        include: TOOL_DETAIL_INCLUDE,
      });
      await this.runtimeCacheInvalidator.invalidateForTools([id]);
      return toToolResponse(row);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          `tool ${id} is referenced by agent/skill/role and cannot be deleted`,
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`tool ${id} not found`);
      }
      throw error;
    }
  }

  private buildWhere(query: QueryToolDto): Prisma.ToolWhereInput {
    const base: Prisma.ToolWhereInput = {};
    if (query.appClientId != null) {
      base.appClientId = query.appClientId;
    }
    return buildToolWhereFromFilters(query, base);
  }

  private buildOrderBy(
    orderBy?: ToolOrderByField,
    order?: 'asc' | 'desc',
  ): Prisma.ToolOrderByWithRelationInput {
    const direction = resolveSortOrder(order);
    switch (orderBy ?? 'id') {
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

  private async assertAppClientExists(appClientId: number): Promise<void> {
    const row = await this.prisma.appClient.findUnique({
      where: { id: appClientId },
      select: { id: true },
    });
    if (!row) {
      throw new BadRequestException(`appClient ${appClientId} not found`);
    }
  }

  private async assertToolInAppClient(
    toolId: number,
    appClientId: number,
  ): Promise<ToolDetailRow> {
    const row = await this.prisma.tool.findFirst({
      where: { id: toolId, appClientId },
      include: TOOL_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(
        `tool ${toolId} not found under appClient ${appClientId}`,
      );
    }
    return row;
  }

  private async assertIntegrationBelongsToApp(
    integrationId: number,
    appClientId: number,
  ): Promise<void> {
    const row = await this.prisma.integration.findFirst({
      where: { id: integrationId, appClientId },
      select: { id: true },
    });
    if (!row) {
      throw new BadRequestException(
        `integration ${integrationId} not found under appClient ${appClientId}`,
      );
    }
  }

  private async assertToolCategoryExists(toolCategoryId: number): Promise<void> {
    const row = await this.prisma.toolCategory.findUnique({
      where: { id: toolCategoryId },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException(`toolCategory ${toolCategoryId} not found`);
    }
  }

  private async resolveToolCategoryLabel(
    toolCategoryId?: number | null,
  ): Promise<string | null> {
    if (toolCategoryId == null) {
      return null;
    }
    const row = await this.prisma.toolCategory.findUnique({
      where: { id: toolCategoryId },
      select: { label: true },
    });
    return row?.label ?? null;
  }

  private async assertDefinitionKeyAvailable(
    appClientId: number,
    definitionKey: string,
    excludeToolId?: number,
  ): Promise<void> {
    const row = await this.prisma.tool.findFirst({
      where: { appClientId, definitionKey },
      select: { id: true },
    });
    if (row && row.id !== excludeToolId) {
      throw new BadRequestException(
        `definitionKey "${definitionKey}" already exists under appClient ${appClientId}`,
      );
    }
  }
}
