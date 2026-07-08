import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  Prisma,
  type LlmModelConfig,
} from '../../../generated/prisma/client';
import {
  resolvePagination,
  toPaginatedResult,
  type PaginatedResult,
} from '../../common/pagination';
import { LlmService } from '../../core/llm/llm.service';
import { OutboundHttpService } from '../../core/outbound-http/outbound-http.service';
import { readPageAgentProxyTimeoutMs } from '../../core/outbound-http/outbound-http.policy.util';
import { OutboundHttpError } from '../../core/outbound-http/outbound-http.types';
import { summarizeRecordForAudit } from '../../core/page-action/page-action-run-audit.util';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryPageAgentLlmProxyAuditDto } from './dto/page-agent-audit.dto';
import {
  toPageAgentLlmProxyAuditDetail,
  toPageAgentLlmProxyAuditListItem,
} from './page-agent.mapper';
import {
  PAGE_AGENT_LLM_PROXY_AUDIT_INCLUDE,
  type PageAgentLlmProxyAuditDetail,
  type PageAgentLlmProxyAuditListItem,
} from './page-agent.types';

type UsageSnapshot = {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
};

type StreamAuditState = UsageSnapshot & {
  providerModel: string | null;
  errorPreview: string;
};

type ProxyChatInput = {
  userId: number;
  appClientId: number;
  body: unknown;
  req: Request;
  res: Response;
};

const ERROR_PREVIEW_MAX_CHARS = 2000;

@Injectable()
export class PageAgentProxyService {
  private readonly logger = new Logger(PageAgentProxyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
    private readonly outboundHttp: OutboundHttpService,
  ) {}

  async proxyChatCompletions(input: ProxyChatInput): Promise<void> {
    const body = this.assertRequestBody(input.body);
    const config = await this.llmService.getActiveChatModelConfig();
    const payload = this.buildUpstreamPayload(body, config);
    const timeoutMs = this.readTimeoutMs();
    const startedAt = Date.now();
    const audit = await this.prisma.pageAgentLlmProxyAudit.create({
      data: {
        appClientId: input.appClientId,
        userId: input.userId,
        modelConfigId: config.id,
        requestedModel: this.pickString(body.model),
        provider: config.provider,
        providerModel: config.model,
        requestMeta: this.buildRequestMeta(body, payload) as Prisma.InputJsonValue,
      },
    });

    const abortController = new AbortController();
    let timedOut = false;
    let clientClosed = false;
    const onClientClose = () => {
      if (!input.res.writableEnded) {
        clientClosed = true;
        abortController.abort();
      }
    };
    input.res.on('close', onClientClose);

    try {
      const upstream = await this.outboundHttp.fetchWithPolicy(
        this.resolveEndpoint(config),
        {
          method: 'POST',
          headers: this.buildHeaders(config),
          body: JSON.stringify(payload),
        },
        {
          timeoutMs,
          signal: abortController.signal,
          label: 'page_agent_proxy',
          // 上游来自 LlmModelConfig（B 端配置），允许内网 / 本机地址。
          ssrf: false,
        },
      );
      await this.writeUpstreamResponse(input.res, upstream, audit.id, startedAt);
    } catch (error) {
      timedOut =
        error instanceof OutboundHttpError && error.kind === 'timeout';
      const message = this.errorMessage(error, timedOut, clientClosed);
      await this.updateAuditFailed(audit.id, startedAt, message);
      if (input.res.headersSent) {
        if (!input.res.writableEnded) {
          input.res.end();
        }
        return;
      }
      if (timedOut) {
        throw new RequestTimeoutException('page-agent proxy upstream timeout');
      }
      if (clientClosed) {
        throw new BadGatewayException('page-agent client connection closed');
      }
      throw new BadGatewayException(`page-agent proxy failed: ${message}`);
    } finally {
      input.res.off('close', onClientClose);
    }
  }

  async findAuditPage(
    appClientId: number,
    query: QueryPageAgentLlmProxyAuditDto,
  ): Promise<PaginatedResult<PageAgentLlmProxyAuditListItem>> {
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where: Prisma.PageAgentLlmProxyAuditWhereInput = {
      appClientId,
      ...(query.userId != null ? { userId: query.userId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.modelConfigId != null
        ? { modelConfigId: query.modelConfigId }
        : {}),
      ...(query.upstreamStatus != null
        ? { upstreamStatus: query.upstreamStatus }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.pageAgentLlmProxyAudit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: PAGE_AGENT_LLM_PROXY_AUDIT_INCLUDE,
      }),
      this.prisma.pageAgentLlmProxyAudit.count({ where }),
    ]);
    return toPaginatedResult(
      rows.map(toPageAgentLlmProxyAuditListItem),
      total,
      page,
      pageSize,
    );
  }

  async findAuditDetail(
    appClientId: number,
    id: number,
  ): Promise<PageAgentLlmProxyAuditDetail> {
    const row = await this.prisma.pageAgentLlmProxyAudit.findFirst({
      where: { id, appClientId },
      include: PAGE_AGENT_LLM_PROXY_AUDIT_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`PageAgent audit ${id} not found`);
    }
    return toPageAgentLlmProxyAuditDetail(row);
  }

  private async writeUpstreamResponse(
    res: Response,
    upstream: globalThis.Response,
    auditId: number,
    startedAt: number,
  ): Promise<void> {
    const state: StreamAuditState = {
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
      providerModel: null,
      errorPreview: '',
    };
    const contentType =
      upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    res.status(upstream.status);
    res.setHeader('content-type', contentType);
    this.copyHeader(upstream, res, 'cache-control');
    this.copyHeader(upstream, res, 'x-request-id');
    try {
      const body = Buffer.from(await upstream.arrayBuffer());
      this.observeBufferedBody(body, contentType, state, upstream.ok);
      if (!res.writableEnded) {
        res.send(body);
      }
      await this.updateAuditFinished(auditId, startedAt, upstream.status, state);
    } catch (error) {
      if (!res.writableEnded) {
        res.end();
      }
      throw error;
    }
  }

  private observeBufferedBody(
    body: Buffer,
    contentType: string,
    state: StreamAuditState,
    upstreamOk: boolean,
  ): void {
    const text = body.toString('utf8');
    const parsed = this.tryParseJsonBody(text, contentType);
    if (parsed) {
      this.mergeProviderModel(state, parsed);
      this.mergeUsage(state, parsed);
      if (!upstreamOk) {
        state.errorPreview = this.extractErrorPreview(parsed, text);
      }
      return;
    }
    if (!upstreamOk) {
      state.errorPreview = text.slice(0, ERROR_PREVIEW_MAX_CHARS);
    }
  }

  private tryParseJsonBody(
    text: string,
    contentType: string,
  ): Record<string, unknown> | null {
    const trimmed = text.trim();
    if (
      !contentType.toLowerCase().includes('json') &&
      !trimmed.startsWith('{')
    ) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
    return null;
  }

  private extractErrorPreview(
    data: Record<string, unknown>,
    fallback: string,
  ): string {
    const error = data.error;
    if (typeof error === 'string' && error.trim()) {
      return error.slice(0, ERROR_PREVIEW_MAX_CHARS);
    }
    if (error && typeof error === 'object' && !Array.isArray(error)) {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === 'string' && message.trim()) {
        return message.slice(0, ERROR_PREVIEW_MAX_CHARS);
      }
    }
    return fallback.slice(0, ERROR_PREVIEW_MAX_CHARS);
  }

  private copyHeader(
    upstream: globalThis.Response,
    res: Response,
    header: string,
  ): void {
    const value = upstream.headers.get(header);
    if (value) {
      res.setHeader(header, value);
    }
  }

  private mergeProviderModel(
    state: StreamAuditState,
    data: Record<string, unknown>,
  ): void {
    if (typeof data.model === 'string' && data.model.trim()) {
      state.providerModel = data.model;
    }
  }

  private mergeUsage(
    state: UsageSnapshot,
    data: Record<string, unknown>,
  ): void {
    const raw = data.usage ?? data.token_usage ?? data.tokenUsage;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return;
    }
    const row = raw as Record<string, unknown>;
    const prompt =
      this.pickInt(row.prompt_tokens) ??
      this.pickInt(row.input_tokens) ??
      this.pickInt(row.promptTokens);
    const completion =
      this.pickInt(row.completion_tokens) ??
      this.pickInt(row.output_tokens) ??
      this.pickInt(row.completionTokens);
    const total =
      this.pickInt(row.total_tokens) ??
      this.pickInt(row.totalTokens) ??
      (prompt != null || completion != null
        ? (prompt ?? 0) + (completion ?? 0)
        : null);
    state.promptTokens = prompt ?? state.promptTokens;
    state.completionTokens = completion ?? state.completionTokens;
    state.totalTokens = total ?? state.totalTokens;
  }

  private async updateAuditFinished(
    auditId: number,
    startedAt: number,
    upstreamStatus: number,
    state: StreamAuditState,
  ): Promise<void> {
    const success = upstreamStatus >= 200 && upstreamStatus < 300;
    await this.safeUpdateAudit(auditId, {
      status: success ? 'success' : 'failed',
      upstreamStatus,
      providerModel: state.providerModel,
      promptTokens: state.promptTokens,
      completionTokens: state.completionTokens,
      totalTokens: state.totalTokens,
      durationMs: Date.now() - startedAt,
      finishedAt: new Date(),
      errorMessage: success ? null : state.errorPreview || `upstream ${upstreamStatus}`,
    });
  }

  private async updateAuditFailed(
    auditId: number,
    startedAt: number,
    errorMessage: string,
  ): Promise<void> {
    await this.safeUpdateAudit(auditId, {
      status: 'failed',
      durationMs: Date.now() - startedAt,
      finishedAt: new Date(),
      errorMessage,
    });
  }

  private async safeUpdateAudit(
    auditId: number,
    data: Prisma.PageAgentLlmProxyAuditUpdateInput,
  ): Promise<void> {
    try {
      await this.prisma.pageAgentLlmProxyAudit.update({
        where: { id: auditId },
        data,
      });
    } catch (error) {
      this.logger.warn(
        `failed to update page-agent proxy audit ${auditId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private buildHeaders(config: LlmModelConfig): Record<string, string> {
    const apiKey = this.resolveApiKey(config);
    return {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    };
  }

  private resolveApiKey(config: LlmModelConfig): string {
    const fromDb = config.apiKey != null ? String(config.apiKey).trim() : '';
    const fromEnv = process.env.OPENAI_API_KEY?.trim() ?? '';
    return fromDb || fromEnv || 'local-internal';
  }

  private resolveEndpoint(config: LlmModelConfig): string {
    const base = config.baseUrl.trim().replace(/\/+$/, '');
    const path = config.chatPath.trim();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
  }

  private buildUpstreamPayload(
    body: Record<string, unknown>,
    config: LlmModelConfig,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      ...body,
      model: config.model,
      stream: false,
    };
    delete payload.stream_options;
    if (payload.temperature == null && config.temperature != null) {
      payload.temperature = config.temperature;
    }
    if (
      payload.max_tokens == null &&
      payload.maxTokens == null &&
      config.maxTokens != null
    ) {
      payload.max_tokens = config.maxTokens;
    }
    return payload;
  }

  private buildRequestMeta(
    body: Record<string, unknown>,
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const tools = Array.isArray(body.tools) ? body.tools : [];
    return summarizeRecordForAudit({
      bodyKeys: Object.keys(body),
      messageCount: messages.length,
      toolCount: tools.length,
      requestedStream: body.stream,
      forcedStream: payload.stream,
      requestedModel: body.model,
      toolChoice: body.tool_choice,
      hasStreamOptions: body.stream_options != null,
    });
  }

  private assertRequestBody(body: unknown): Record<string, unknown> {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('OpenAI-compatible request body is required');
    }
    const row = body as Record<string, unknown>;
    if (!Array.isArray(row.messages)) {
      throw new BadRequestException('messages must be an array');
    }
    return row;
  }

  private readTimeoutMs(): number {
    return readPageAgentProxyTimeoutMs();
  }

  private pickString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private pickInt(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, Math.floor(value));
    }
    return null;
  }

  private errorMessage(
    error: unknown,
    timedOut: boolean,
    clientClosed: boolean,
  ): string {
    if (timedOut) {
      return 'upstream timeout';
    }
    if (clientClosed) {
      return 'client connection closed';
    }
    return error instanceof Error ? error.message : String(error);
  }
}
