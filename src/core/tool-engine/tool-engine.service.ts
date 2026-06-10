import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import {
  HttpMethod,
  IntegrationAuthMode,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  applyToolParameterDefaults,
  collectOpenApiParameterSpecs,
  formatQueryScalar,
  sanitizeToolInvokeInput,
  type OpenApiParamSpec,
} from './tool-input-sanitize.util';
import {
  buildHttpResponseSource,
  ToolHttpResponseError,
} from './tool-response-source.util';
import {
  resolveToolZodSchema,
  type ToolDefinitionInput,
} from './tool-schema.util';
import type {
  BuiltLangChainTools,
  ToolBuildContext,
  ToolDebugOptions,
  ToolDebugResult,
  ToolExecutionDefinition,
  ToolExecutionResult,
} from './tool-engine.types';

export type {
  BuiltLangChainTools,
  ToolBuildContext,
  ToolDebugOptions,
  ToolDebugResult,
  ToolDefinitionInput,
  ToolExecutionDefinition,
  ToolExecutionResult,
  ToolIntegrationDefinition,
} from './tool-engine.types';

@Injectable()
export class ToolEngineService {
  private readonly logger = new Logger(ToolEngineService.name);
  private static readonly DEFAULT_TIMEOUT_MS = 10_000;
  private static readonly MAX_TIMEOUT_MS = 2_147_483_647;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 将数据库工具定义统一构建为 LangChain tool（Zod schema），
   * 供 ChatModel.bindTools 与 tool.invoke 使用。
   */
  buildLangChainTools(
    definitions: ToolExecutionDefinition[],
    ctx: ToolBuildContext,
  ): BuiltLangChainTools {
    const allowedIds = new Set(ctx.allowedToolIds);
    const tools: BuiltLangChainTools['tools'] = [];
    const byName = new Map<string, BuiltLangChainTools['tools'][number]>();

    for (const def of definitions) {
      if (!allowedIds.has(def.id)) {
        continue;
      }
      const parameters = resolveToolZodSchema(def.inputSchema, def.schema);
      const lcTool = tool(
        async (input: Record<string, unknown>) =>
          this.executeFromDefinition(def, input, ctx.userId),
        {
          name: def.name,
          description: def.description,
          schema: parameters,
        },
      );
      tools.push(lcTool);
      byName.set(def.name, lcTool);
    }

    return { tools, byName };
  }

  /** 按名称调用已构建的 LangChain tool（与 bindTools 使用同一套定义）。 */
  async invokeLangChainTool(
    bundle: BuiltLangChainTools,
    toolName: string,
    input: Record<string, unknown>,
  ): Promise<ToolExecutionResult> {
    const lcTool = bundle.byName.get(toolName);
    if (!lcTool) {
      throw new NotFoundException(`tool ${toolName} not found in bound tools`);
    }
    return lcTool.invoke(input) as Promise<ToolExecutionResult>;
  }

  /**
   * 管理端调试：按 tool 配置发起 HTTP 请求，支持自定义 parameters / headers。
   * 不校验用户 token 绑定，默认使用 Integration 系统 apiKey（可被 options.apiKey 覆盖）。
   */
  async debugExecute(
    toolId: number,
    options: ToolDebugOptions = {},
  ): Promise<ToolDebugResult> {
    const tool = await this.prisma.tool.findUnique({
      where: { id: toolId },
      include: { integration: true },
    });
    if (!tool) {
      throw new NotFoundException(`tool ${toolId} not found`);
    }

    let specs = this.loadOpenApiParameterSpecs(
      tool.inputSchema,
      tool.schema,
    );
    let input = applyToolParameterDefaults(options.parameters ?? {}, specs, {
      agentMetadata: tool.agentMetadata,
      responseProfile: tool.responseProfile,
    });
    input = sanitizeToolInvokeInput(input, specs);

    const apiKey =
      options.apiKey?.trim() || tool.integration.apiKey?.trim() || '';
    const headers = this.buildBaseHeaders(apiKey);
    this.applyHeaderParameters(headers, specs, input);
    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        if (value === undefined || value === null) {
          continue;
        }
        headers[key] = String(value);
      }
    }

    const resolvedPath = this.applyPathPlaceholders(tool.path, input);
    const url = this.resolveUrl(
      tool.integration.baseUrl,
      resolvedPath,
      tool.method,
      input,
      specs,
    );
    const bodyPayload = this.buildJsonBody(
      tool.method,
      input,
      specs,
      tool.path,
    );
    const httpMethod = this.toHttpMethod(tool.method);

    const startedAt = Date.now();
    const controller = new AbortController();
    const timeoutMs = this.resolveTimeoutMs(
      options.timeoutMs ?? tool.timeout,
      tool.name,
    );
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const baseResult: Omit<ToolDebugResult, 'ok' | 'durationMs' | 'response' | 'error'> = {
      toolId: tool.id,
      toolName: tool.name,
      method: httpMethod,
      url,
      request: {
        headers: this.redactHeaders(headers),
        body: bodyPayload ?? null,
      },
    };

    try {
      const response = await fetch(url, {
        method: httpMethod,
        headers,
        body: bodyPayload,
        signal: controller.signal,
      });
      const bodyText = await response.text();
      const data = this.safeJsonParse(bodyText);
      return {
        ...baseResult,
        ok: response.ok,
        durationMs: Date.now() - startedAt,
        response: {
          status: response.status,
          statusText: response.statusText,
          body: bodyText,
          data,
        },
        error: response.ok
          ? undefined
          : `HTTP ${response.status} ${response.statusText}`,
      };
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      const message = aborted
        ? `request timed out after ${timeoutMs}ms`
        : error instanceof Error
          ? error.message
          : String(error);
      return {
        ...baseResult,
        ok: false,
        durationMs: Date.now() - startedAt,
        error: message,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async executeByName(
    toolName: string,
    input: Record<string, unknown>,
    allowedToolIds: number[],
    userId: number,
  ): Promise<ToolExecutionResult> {
    const tool = await this.prisma.tool.findFirst({
      where: {
        name: toolName,
        id: { in: allowedToolIds },
        isActive: true,
      },
      include: {
        integration: true,
      },
    });
    if (!tool) {
      this.writeToolDebugSnapshot({
        phase: 'tool_not_found',
        at: new Date().toISOString(),
        toolNameRequested: toolName,
        allowedToolIds,
        input,
      });
      throw new NotFoundException(`tool ${toolName} not found or not allowed`);
    }

    return this.executeFromDefinition(
      {
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
      },
      input,
      userId,
    );
  }

  /** 使用运行期已加载的 tool 定义执行 HTTP，不再查 Tool 表。 */
  async executeFromDefinition(
    def: ToolExecutionDefinition,
    input: Record<string, unknown>,
    userId: number,
  ): Promise<ToolExecutionResult> {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeoutMs = this.resolveTimeoutMs(def.timeout, def.name);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const specs = this.loadOpenApiParameterSpecs(def.inputSchema, def.schema);
      input = applyToolParameterDefaults(input, specs, {
        agentMetadata: def.agentMetadata,
        responseProfile: def.responseProfile,
      });
      input = sanitizeToolInvokeInput(input, specs);

      const userIntegration = await this.prisma.userIntegration.findUnique({
        where: {
          userId_integrationId: {
            userId,
            integrationId: def.integration.id,
          },
        },
        select: {
          userApiKey: true,
          isActive: true,
        },
      });
      const authMode = def.integration.authMode;
      const userApiKey =
        userIntegration?.isActive === true
          ? userIntegration.userApiKey?.trim() ?? ''
          : '';
      const systemApiKey =
        authMode === IntegrationAuthMode.SYSTEM_ONLY ||
        authMode === IntegrationAuthMode.USER_PREFERRED
          ? def.integration.apiKey?.trim() ?? ''
          : '';
      const { apiKey: selectedApiKey, source: authSource } =
        this.resolveAuthCredential(authMode, userApiKey, systemApiKey);
      if (!selectedApiKey) {
        throw new BadRequestException(
          `integration ${def.integration.name} auth unresolved (mode=${authMode})`,
        );
      }
      const headers = this.buildBaseHeaders(selectedApiKey);
      this.applyHeaderParameters(headers, specs, input);

      const resolvedPath = this.applyPathPlaceholders(def.path, input);
      const url = this.resolveUrl(
        def.integration.baseUrl,
        resolvedPath,
        def.method,
        input,
        specs,
      );
      const bodyPayload = this.buildJsonBody(
        def.method,
        input,
        specs,
        def.path,
      );

      const httpMethod = this.toHttpMethod(def.method);

      const response = await fetch(url, {
        method: httpMethod,
        headers,
        body: bodyPayload,
        signal: controller.signal,
      });
      const bodyText = await response.text();
      const output = this.safeJsonParse(bodyText);
      const httpResponse = buildHttpResponseSource(response, bodyText, output);

      this.writeToolDebugSnapshot({
        phase: 'after_fetch',
        at: new Date().toISOString(),
        toolNameRequested: def.name,
        input,
        tool: {
          id: def.id,
          name: def.name,
          method: def.method,
          pathTemplate: def.path,
          resolvedPath,
          timeoutMs,
          isActive: true,
        },
        openApiParameterSpecs: specs,
        integration: {
          id: def.integration.id,
          name: def.integration.name,
          baseUrl: def.integration.baseUrl,
          authMode: def.integration.authMode,
          authSource,
          userApiKey: this.redactSecret(userApiKey),
          systemApiKey: this.redactSecret(systemApiKey),
        },
        request: {
          url,
          method: httpMethod,
          headers: this.redactHeaders(headers),
          body: bodyPayload ?? null,
        },
        response: {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          bodyLength: bodyText.length,
          bodyPreview: bodyText.slice(0, 8_000),
        },
        latencyMs: Date.now() - startedAt,
      });

      if (!response.ok) {
        const apiKey = selectedApiKey?.trim();
        const authHint =
          response.status === 401
            ? apiKey
              ? ` downstream returned 401: verify ${authSource} api key, or confirm the API expects Bearer (not x-api-key / Basic).`
              : ' downstream returned 401: auth key is empty — set a valid key, or configure the upstream to accept unauthenticated requests.'
            : '';
        throw new ToolHttpResponseError(
          `tool ${def.name} failed: ${response.status} ${response.statusText}.${authHint}`,
          httpResponse,
        );
      }
      return {
        toolId: def.id,
        name: def.name,
        input,
        output,
        latency: Date.now() - startedAt,
        responseSource: bodyText,
        httpResponse,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildBaseHeaders(apiKeyRaw: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const apiKey = apiKeyRaw?.trim();
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }
    return headers;
  }

  private resolveAuthCredential(
    mode: IntegrationAuthMode,
    userApiKey: string,
    systemApiKey: string,
  ): { apiKey: string; source: 'user' | 'system' | 'none' } {
    if (mode === IntegrationAuthMode.USER_ONLY) {
      return userApiKey
        ? { apiKey: userApiKey, source: 'user' }
        : { apiKey: '', source: 'none' };
    }
    if (mode === IntegrationAuthMode.SYSTEM_ONLY) {
      return systemApiKey
        ? { apiKey: systemApiKey, source: 'system' }
        : { apiKey: '', source: 'none' };
    }
    if (userApiKey) {
      return { apiKey: userApiKey, source: 'user' };
    }
    if (systemApiKey) {
      return { apiKey: systemApiKey, source: 'system' };
    }
    return { apiKey: '', source: 'none' };
  }

  /** 从 OpenAPI parameters 里识别 `in: header`，用 input 同名字段补全请求头。 */
  private applyHeaderParameters(
    headers: Record<string, string>,
    specs: OpenApiParamSpec[],
    input: Record<string, unknown>,
  ): void {
    for (const spec of specs) {
      if (spec.in !== 'header') {
        continue;
      }
      const value = input[spec.name];
      if (value === undefined || value === null) {
        continue;
      }
      headers[spec.name] = formatQueryScalar(value);
    }
  }

  private loadOpenApiParameterSpecs(
    inputSchema: unknown,
    fallbackSchema: unknown,
  ) {
    let specs = collectOpenApiParameterSpecs(inputSchema);
    if (specs.length === 0) {
      specs = collectOpenApiParameterSpecs(fallbackSchema);
    }
    return specs;
  }

  /** `/items/{id}` → 从 input 取值替换占位符（OpenAPI path 参数）。 */
  private applyPathPlaceholders(
    path: string,
    input: Record<string, unknown>,
  ): string {
    return path.replace(/\{([^/{}]+)\}/g, (_m, rawName: string) => {
      const key =
        typeof rawName === 'string' ? rawName.trim() : String(rawName);
      const value = input[key];
      if (value === undefined || value === null) {
        return `{${key}}`;
      }
      return encodeURIComponent(formatQueryScalar(value));
    });
  }

  /** path / header / query 用到的 input 字段不再进入 JSON body。 */
  private reservedBodyKeys(
    specs: OpenApiParamSpec[],
    pathTemplate: string,
  ): Set<string> {
    const reserved = new Set<string>();
    const re = /\{([^/{}]+)\}/g;
    let m: RegExpExecArray | null = re.exec(pathTemplate);
    while (m !== null) {
      reserved.add(m[1].trim());
      m = re.exec(pathTemplate);
    }
    for (const s of specs) {
      if (s.in === 'header' || s.in === 'query' || s.in === 'path') {
        reserved.add(s.name);
      }
    }
    return reserved;
  }

  private resolveUrl(
    baseUrl: string,
    path: string,
    method: HttpMethod,
    input: Record<string, unknown>,
    specs: OpenApiParamSpec[],
  ): string {
    const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${normalizedBase}${normalizedPath}`);
    if (method !== HttpMethod.Get) {
      return url.toString();
    }

    if (specs.length === 0) {
      for (const [key, value] of Object.entries(input)) {
        this.appendQueryParam(url, key, value);
      }
      return url.toString();
    }

    const querySpecs = specs.filter((s) => s.in === 'query');
    for (const spec of querySpecs) {
      this.appendQueryParam(url, spec.name, input[spec.name], spec);
    }
    return url.toString();
  }

  private appendQueryParam(
    url: URL,
    name: string,
    value: unknown,
    spec?: { type?: string; collectionFormat?: string },
  ): void {
    if (value === undefined || value === null) {
      return;
    }
    const useMulti =
      spec?.collectionFormat === 'multi' || spec?.type === 'array';
    if (useMulti && Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) {
          continue;
        }
        url.searchParams.append(name, formatQueryScalar(item));
      }
      return;
    }
    if (Array.isArray(value)) {
      url.searchParams.set(
        name,
        value.map((item) => formatQueryScalar(item)).join(','),
      );
      return;
    }
    url.searchParams.set(name, formatQueryScalar(value));
  }

  private buildJsonBody(
    method: HttpMethod,
    input: Record<string, unknown>,
    specs: OpenApiParamSpec[],
    pathTemplate: string,
  ): string | undefined {
    if (method === HttpMethod.Get) {
      return undefined;
    }
    if (specs.length === 0) {
      return JSON.stringify(input);
    }
    const reserved = this.reservedBodyKeys(specs, pathTemplate);
    const body: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (reserved.has(key)) {
        continue;
      }
      body[key] = value;
    }
    return JSON.stringify(body, (_key, value) =>
      value === undefined ? undefined : value,
    );
  }

  private toHttpMethod(method: HttpMethod): string {
    switch (method) {
      case HttpMethod.Get:
        return 'GET';
      case HttpMethod.Post:
        return 'POST';
      case HttpMethod.Put:
        return 'PUT';
      case HttpMethod.Delete:
        return 'DELETE';
      default:
        return 'POST';
    }
  }

  private safeJsonParse(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private resolveTimeoutMs(
    configured: number | null,
    toolName: string,
  ): number {
    if (typeof configured !== 'number' || !Number.isFinite(configured)) {
      return ToolEngineService.DEFAULT_TIMEOUT_MS;
    }
    const rounded = Math.floor(configured);
    if (rounded < 1) {
      return ToolEngineService.DEFAULT_TIMEOUT_MS;
    }
    if (rounded > ToolEngineService.MAX_TIMEOUT_MS) {
      this.logger.warn(
        `tool ${toolName} timeout ${rounded} exceeds setTimeout max; clamped to ${ToolEngineService.MAX_TIMEOUT_MS}`,
      );
      return ToolEngineService.MAX_TIMEOUT_MS;
    }
    return rounded;
  }

  /** 非 production 默认写文件；production 仅当 TOOL_ENGINE_DEBUG=1/true；任一环境 TOOL_ENGINE_DEBUG=0/false 可关闭。 */
  private isToolDebugFileEnabled(): boolean {
    const v = process.env.TOOL_ENGINE_DEBUG?.trim().toLowerCase();
    if (v === '0' || v === 'false' || v === 'off') {
      return false;
    }
    if (v === '1' || v === 'true' || v === 'on') {
      return true;
    }
    return process.env.NODE_ENV !== 'production';
  }

  private writeToolDebugSnapshot(record: Record<string, unknown>): void {
    if (!this.isToolDebugFileEnabled()) {
      return;
    }
    const toolName = String(
      record.toolNameRequested ??
        (record.tool as { name?: string } | undefined)?.name ??
        'tool',
    );
    const phase = String(record.phase ?? 'debug');
    const latencyMs =
      typeof record.latencyMs === 'number' ? record.latencyMs : null;
    const response = record.response as
      | { status?: number; ok?: boolean }
      | undefined;
    const status =
      response?.status != null
        ? String(response.status)
        : response?.ok === false
          ? 'error'
          : '-';
    this.logger.log(
      `tool HTTP tool=${toolName} phase=${phase} status=${status}${
        latencyMs != null ? ` latencyMs=${latencyMs}` : ''
      }`,
    );
    try {
      const dir = path.join(process.cwd(), 'logs', 'tool-engine');
      fs.mkdirSync(dir, { recursive: true });
      const nameHint = toolName.replace(/[^a-zA-Z0-9._-]+/g, '_');
      const file = path.join(dir, `${Date.now()}-${nameHint}-${phase}.json`);
      fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');
      this.logger.log(`tool HTTP debug file tool=${toolName} path=${file}`);
    } catch (err) {
      this.logger.warn(
        `tool-engine debug file write failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  private redactSecret(value: string | null | undefined): string {
    if (value == null || String(value).trim() === '') {
      return '';
    }
    const s = String(value);
    if (s.length <= 6) {
      return '***';
    }
    return `${s.slice(0, 4)}…[redacted len=${s.length}]`;
  }

  private redactHeaders(
    headers: Record<string, string>,
  ): Record<string, string> {
    const sensitive = /^(authorization|proxy-authorization)$/i;
    const out: Record<string, string> = { ...headers };
    for (const key of Object.keys(out)) {
      if (sensitive.test(key) || /api-key|apikey|token/i.test(key)) {
        out[key] = this.redactSecret(out[key]);
      }
    }
    return out;
  }
}
