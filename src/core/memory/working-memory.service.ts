import { Injectable, Logger } from '@nestjs/common';
import {
  getDefaultXShopId,
  resolveXShopIdFromUserMessage,
} from '../../common/integration-site.util';
import { LlmService } from '../llm/llm.service';
import { PROMPT_KEYS } from '../prompt/prompt-template.keys';
import { PromptRegistryService } from '../prompt/prompt-registry.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionContextStore } from './session-context.store';
import {
  isSessionContextPayload,
  type WorkingMemoryFact,
  type WorkingMemoryState,
  type WorkingMemoryUpdateContext,
} from './session-context.types';

const MAX_SUMMARY_CHARS = 800;
const MAX_FACTS = 32;
const REFRESH_MAX_TOKENS = 1024;

@Injectable()
export class WorkingMemoryService {
  private readonly logger = new Logger(WorkingMemoryService.name);

  constructor(
    private readonly sessionContextStore: SessionContextStore,
    private readonly llmService: LlmService,
    private readonly promptRegistry: PromptRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  async get(sessionId: string): Promise<WorkingMemoryState | null> {
    const raw = await this.sessionContextStore.get(sessionId);
    if (!raw || !isSessionContextPayload(raw)) {
      return null;
    }
    return raw.workingMemory ?? null;
  }

  /**
   * 一轮问答结束后刷新工作记忆：默认 LLM 归纳；失败时回退规则 merge。
   */
  async refreshFromAgentRun(
    sessionId: string,
    ctx: WorkingMemoryUpdateContext,
  ): Promise<void> {
    if (this.readRefreshMode() === 'merge') {
      await this.mergeFromAgentRun(sessionId, ctx);
      return;
    }
    try {
      const prev = await this.get(sessionId);
      const next = await this.synthesizeWithLlm(sessionId, prev, ctx);
      await this.patchWorkingMemory(sessionId, next);
    } catch (error) {
      this.logger.warn(
        `working memory LLM refresh failed sessionId=${sessionId}, fallback merge: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      await this.mergeFromAgentRun(sessionId, ctx);
    }
  }

  /** @deprecated 使用 refreshFromAgentRun；保留作 LLM 失败时的 merge 降级。 */
  async updateFromAgentRun(
    sessionId: string,
    ctx: WorkingMemoryUpdateContext,
  ): Promise<void> {
    await this.mergeFromAgentRun(sessionId, ctx);
  }

  private async mergeFromAgentRun(
    sessionId: string,
    ctx: WorkingMemoryUpdateContext,
  ): Promise<void> {
    try {
      const prev = await this.get(sessionId);
      const next = this.buildMergedState(prev, ctx);
      await this.patchWorkingMemory(sessionId, next);
    } catch (error) {
      this.logger.warn(
        `working memory merge skipped sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async patchWorkingMemory(
    sessionId: string,
    next: WorkingMemoryState,
  ): Promise<void> {
    await this.sessionContextStore.patch(sessionId, {
      workingMemory: next,
      updatedAt: new Date().toISOString(),
    });
  }

  private async synthesizeWithLlm(
    sessionId: string,
    prev: WorkingMemoryState | null,
    ctx: WorkingMemoryUpdateContext,
  ): Promise<WorkingMemoryState> {
    const scope = await this.loadSessionPromptScope(sessionId);
    const systemPrompt = await this.promptRegistry.render(
      PROMPT_KEYS.MEMORY_WORKING_MEMORY_REFRESH,
      scope,
    );

    const userContent = [
      `上一轮工作记忆：${JSON.stringify(prev ?? {})}`,
      `用户本轮输入：${ctx.userInput.trim()}`,
      `助手最终回复：${this.truncate(ctx.finalOutput)}`,
      `工具观测：${this.formatToolObservations(ctx.toolObservations)}`,
    ].join('\n\n');

    const result = await this.llmService.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      maxTokens: REFRESH_MAX_TOKENS,
      temperature: 0.2,
      stream: false,
    });

    const parsed = this.parseWorkingMemoryPayload(result.content ?? '');
    return this.normalizeWorkingMemory(parsed, prev, ctx);
  }

  private parseWorkingMemoryPayload(content: string): Partial<WorkingMemoryState> {
    const raw = this.extractJsonObjectText(content);
    const row: unknown = JSON.parse(raw);
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error('working memory refresh response is not an object');
    }
    const o = row as Record<string, unknown>;
    const goal =
      o.goal === null || o.goal === undefined
        ? undefined
        : typeof o.goal === 'string'
          ? o.goal.trim() || undefined
          : undefined;
    const facts = this.parseFacts(o.facts);
    const entities = this.parseEntities(o.entities);
    const pendingActions = this.parseStringArray(o.pendingActions);
    const lastToolSummary =
      o.lastToolSummary === null || o.lastToolSummary === undefined
        ? undefined
        : typeof o.lastToolSummary === 'string'
          ? this.truncate(o.lastToolSummary)
          : undefined;
    return {
      goal,
      facts,
      entities,
      pendingActions,
      lastToolSummary,
    };
  }

  private normalizeWorkingMemory(
    parsed: Partial<WorkingMemoryState>,
    prev: WorkingMemoryState | null,
    ctx: WorkingMemoryUpdateContext,
  ): WorkingMemoryState {
    const now = new Date().toISOString();
    let facts = parsed.facts ?? [];
    if (facts.length === 0 && ctx.finalOutput.trim()) {
      facts = [{ key: 'assistant:lastReply', value: this.truncate(ctx.finalOutput) }];
    }
    const fallbackLastTool = this.lastToolSummaryFromObservations(
      ctx.toolObservations,
    );
    const entities = {
      ...(prev?.entities ?? {}),
      ...(parsed.entities ?? {}),
    };
    this.ensureXShopIdEntity(entities, ctx.userInput);

    return {
      goal: parsed.goal,
      facts: facts.slice(-MAX_FACTS),
      entities,
      pendingActions: parsed.pendingActions,
      lastToolSummary: parsed.lastToolSummary ?? fallbackLastTool ?? prev?.lastToolSummary,
      updatedAt: now,
    };
  }

  private ensureXShopIdEntity(
    entities: Record<string, unknown>,
    userInput: string,
  ): void {
    if (entities.xShopId != null && String(entities.xShopId).trim() !== '') {
      return;
    }
    entities.xShopId = resolveXShopIdFromUserMessage(userInput);
  }

  private buildMergedState(
    prev: WorkingMemoryState | null | undefined,
    ctx: WorkingMemoryUpdateContext,
  ): WorkingMemoryState {
    const now = new Date().toISOString();
    const facts = [...(prev?.facts ?? [])];
    const entities = { ...(prev?.entities ?? {}) };

    let lastToolSummary = prev?.lastToolSummary;
    for (const observation of ctx.toolObservations) {
      const summary = this.summarizeToolOutput(observation.output);
      lastToolSummary = `[${observation.name}] ${summary}`;
      this.upsertFact(facts, `tool:${observation.name}`, summary);
      if (
        observation.output &&
        typeof observation.output === 'object' &&
        !Array.isArray(observation.output)
      ) {
        entities[observation.name] = observation.output;
      }
    }

    if (ctx.finalOutput.trim()) {
      this.upsertFact(
        facts,
        'assistant:lastReply',
        this.truncate(ctx.finalOutput),
      );
    }

    const goal = prev?.goal?.trim() || ctx.userInput.trim() || undefined;
    this.ensureXShopIdEntity(entities, ctx.userInput);

    return {
      goal,
      facts: facts.slice(-MAX_FACTS),
      entities,
      pendingActions: prev?.pendingActions,
      lastToolSummary,
      updatedAt: now,
    };
  }

  private parseFacts(value: unknown): WorkingMemoryFact[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null;
        }
        const row = item as Record<string, unknown>;
        if (typeof row.key !== 'string' || typeof row.value !== 'string') {
          return null;
        }
        const key = row.key.trim();
        const factValue = this.truncate(row.value);
        if (!key || !factValue) {
          return null;
        }
        return { key, value: factValue };
      })
      .filter((item): item is WorkingMemoryFact => item !== null);
  }

  private parseEntities(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return value as Record<string, unknown>;
  }

  private parseStringArray(value: unknown): string[] | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (!Array.isArray(value)) {
      return undefined;
    }
    const items = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length > 0 ? items : undefined;
  }

  private formatToolObservations(
    observations: WorkingMemoryUpdateContext['toolObservations'],
  ): string {
    if (observations.length === 0) {
      return '（无）';
    }
    return JSON.stringify(
      observations.map((item) => ({
        name: item.name,
        output: this.summarizeToolOutput(item.output),
      })),
    );
  }

  private lastToolSummaryFromObservations(
    observations: WorkingMemoryUpdateContext['toolObservations'],
  ): string | undefined {
    const last = observations[observations.length - 1];
    if (!last) {
      return undefined;
    }
    const summary = this.summarizeToolOutput(last.output);
    return summary ? `[${last.name}] ${summary}` : undefined;
  }

  private extractJsonObjectText(content: string): string {
    const trimmed = content.trim();
    const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
    if (fence?.[1]) {
      return fence[1].trim();
    }
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return trimmed.slice(start, end + 1);
    }
    return trimmed;
  }

  private async loadSessionPromptScope(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { appClientId: true, agentId: true },
    });
    return {
      appClientId: session?.appClientId ?? null,
      agentId: session?.agentId ?? null,
    };
  }

  private readRefreshMode(): 'refresh' | 'merge' {
    const raw = process.env.AGENT_WORKING_MEMORY_MODE?.trim().toLowerCase();
    if (raw === 'merge') {
      return 'merge';
    }
    return 'refresh';
  }

  private upsertFact(
    facts: Array<{ key: string; value: string }>,
    key: string,
    value: string,
  ): void {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    const index = facts.findIndex((item) => item.key === key);
    const row = { key, value: trimmed };
    if (index >= 0) {
      facts[index] = row;
      return;
    }
    facts.push(row);
  }

  private summarizeToolOutput(output: unknown): string {
    if (output === null || output === undefined) {
      return '';
    }
    if (typeof output === 'string') {
      return this.truncate(output);
    }
    try {
      return this.truncate(JSON.stringify(output));
    } catch {
      return this.truncate(String(output));
    }
  }

  private truncate(value: string): string {
    const trimmed = value.trim();
    if (trimmed.length <= MAX_SUMMARY_CHARS) {
      return trimmed;
    }
    return `${trimmed.slice(0, MAX_SUMMARY_CHARS)}…`;
  }
}
