import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HttpMethod } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type ToolExecutionResult = {
  toolId: number;
  name: string;
  input: Record<string, unknown>;
  output: unknown;
  latency: number;
};

/** OpenAPI 3 `parameters[].in`，用于拆分 path / header / query / body。 */
type OpenApiParamSpec = {
  name: string;
  in: string;
};

@Injectable()
export class ToolEngineService {
  private readonly logger = new Logger(ToolEngineService.name);
  private static readonly DEFAULT_TIMEOUT_MS = 10_000;
  private static readonly MAX_TIMEOUT_MS = 2_147_483_647;

  constructor(private readonly prisma: PrismaService) {}

  async executeByName(
    toolName: string,
    input: Record<string, unknown>,
    allowedToolIds: number[],
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

    const startedAt = Date.now();
    const controller = new AbortController();
    const timeoutMs = this.resolveTimeoutMs(tool.timeout, tool.name);
    console.log('timeoutMs', timeoutMs);
    console.log(tool.timeout);
    console.log("------------------------")
    console.log("------------------------")
    console.log("------------------------")
    console.log("------------------------")
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      let specs = this.collectOpenApiParameterSpecs(tool.inputSchema);
      if (specs.length === 0) {
        specs = this.collectOpenApiParameterSpecs(tool.schema);
      }

      const headers = this.buildBaseHeaders(tool.integration.apiKey);
      this.applyHeaderParameters(headers, specs, input);

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

      const response = await fetch(url, {
        method: httpMethod,
        headers,
        body: bodyPayload,
        signal: controller.signal,
      });
      const bodyText = await response.text();
      const output = this.safeJsonParse(bodyText);

      this.writeToolDebugSnapshot({
        phase: 'after_fetch',
        at: new Date().toISOString(),
        toolNameRequested: toolName,
        allowedToolIds,
        input,
        tool: {
          id: tool.id,
          name: tool.name,
          method: tool.method,
          pathTemplate: tool.path,
          resolvedPath,
          timeoutMs,
          isActive: tool.isActive,
        },
        openApiParameterSpecs: specs,
        integration: {
          id: tool.integration.id,
          name: tool.integration.name,
          baseUrl: tool.integration.baseUrl,
          apiKey: this.redactSecret(tool.integration.apiKey),
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
        const apiKey = tool.integration.apiKey?.trim();
        const authHint =
          response.status === 401
            ? apiKey
              ? ' downstream returned 401: verify Integration.apiKey/value, or confirm the API expects Bearer (not x-api-key / Basic).'
              : ' downstream returned 401: Integration.apiKey is empty — set a valid key, or configure the upstream to accept unauthenticated requests.'
            : '';
        throw new BadRequestException(
          `tool ${tool.name} failed: ${response.status} ${response.statusText}.${authHint}`,
        );
      }
      return {
        toolId: tool.id,
        name: tool.name,
        input,
        output,
        latency: Date.now() - startedAt,
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
      headers[spec.name] = String(value);
    }
  }

  private collectOpenApiParameterSpecs(schema: unknown): OpenApiParamSpec[] {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
      return [];
    }
    const row = schema as Record<string, unknown>;
    const parameters = row.parameters;
    if (!Array.isArray(parameters)) {
      return [];
    }
    const out: OpenApiParamSpec[] = [];
    for (const item of parameters) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        continue;
      }
      const p = item as Record<string, unknown>;
      const name = p.name;
      const inn = p.in;
      if (typeof name === 'string' && typeof inn === 'string') {
        out.push({ name, in: inn });
      }
    }
    return out;
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
      return encodeURIComponent(String(value));
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
        if (value === undefined || value === null) {
          continue;
        }
        url.searchParams.set(key, String(value));
      }
      return url.toString();
    }

    const queryNames = new Set(
      specs.filter((s) => s.in === 'query').map((s) => s.name),
    );
    for (const name of queryNames) {
      const value = input[name];
      if (value === undefined || value === null) {
        continue;
      }
      url.searchParams.set(name, String(value));
    }
    return url.toString();
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
    return JSON.stringify(body);
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
    try {
      const dir = path.join(process.cwd(), 'logs', 'tool-engine');
      fs.mkdirSync(dir, { recursive: true });
      const nameHint = String(
        record.toolNameRequested ??
          (record.tool as { name?: string } | undefined)?.name ??
          'tool',
      ).replace(/[^a-zA-Z0-9._-]+/g, '_');
      const file = path.join(
        dir,
        `${Date.now()}-${nameHint}-${record.phase ?? 'debug'}.json`,
      );
      fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');
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
