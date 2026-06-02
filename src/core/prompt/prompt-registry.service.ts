import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import type { Prisma, PromptTemplate } from '../../../generated/prisma/client';
import {
  getCanadaXShopId,
  getDefaultXShopId,
} from '../../common/integration-site.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ensureGlobalPromptTemplates } from './ensure-global-prompt-templates';
import { PROMPT_DEFAULT_CONTENT } from './prompt-defaults';
import { PROMPT_KEY_LIST } from './prompt-template.keys';
import type { PromptTemplateKey } from './prompt-template.keys';
import { renderPromptTemplate } from './prompt-template.render.util';
import { PromptTemplateStore } from './prompt-template.store';
import type { PromptResolveScope, ResolvedPrompt } from './prompt-registry.types';

@Injectable()
export class PromptRegistryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PromptRegistryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly promptStore: PromptTemplateStore,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const ensured = await ensureGlobalPromptTemplates(this.prisma);
      if (ensured.created.length > 0) {
        this.logger.log(
          `prompt templates initialized in DB: ${ensured.created.join(', ')}`,
        );
      }
      await this.reloadAllActiveFromDb();
    } catch (error) {
      this.logger.warn(
        `prompt registry bootstrap skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** 从 DB 全量同步当前 isActive 行到 Redis（启动或手动刷新） */
  async reloadAllActiveFromDb(): Promise<void> {
    const rows = await this.prisma.promptTemplate.findMany({
      where: { isActive: true },
    });
    for (const row of rows) {
      await this.syncActiveRowToRedis(row);
    }
    this.logger.log(
      `prompt templates synced to redis: ${rows.length} active row(s)`,
    );
  }

  /** 发布/变更后写入 Redis（与 DB isActive 行一致） */
  async syncActiveRowToRedis(row: PromptTemplate): Promise<void> {
    if (!row.isActive) {
      await this.promptStore.delete(
        row.key,
        row.appClientId,
        row.agentId,
        row.locale,
      );
      return;
    }
    const resolved = this.toResolved(row);
    await this.promptStore.set(
      row.key,
      row.appClientId,
      row.agentId,
      row.locale,
      resolved,
    );
  }

  async render(
    key: PromptTemplateKey | string,
    scope: PromptResolveScope = {},
    variables: Record<string, string | number | boolean | undefined> = {},
  ): Promise<string> {
    const resolved = await this.resolve(key, scope);
    const mergedVars = {
      usShopId: getDefaultXShopId(),
      caShopId: getCanadaXShopId(),
      defaultUsShopId: getDefaultXShopId(),
      ...variables,
    };
    return renderPromptTemplate(resolved.content, mergedVars);
  }

  async resolve(
    key: PromptTemplateKey | string,
    scope: PromptResolveScope = {},
  ): Promise<ResolvedPrompt> {
    const locale = scope.locale?.trim() || 'zh-CN';
    const resolved = await this.resolveFromRedis(key, scope, locale);
    if (resolved) {
      return resolved;
    }

    const row = await this.findActiveRow(
      key,
      scope.appClientId,
      scope.agentId,
      locale,
    );
    if (row) {
      await this.syncActiveRowToRedis(row);
      return this.toResolved(row);
    }

    const fallback = this.resolveCodeFallback(key);
    if (fallback) {
      this.logger.debug(`prompt code fallback key=${key} (no active DB/Redis row)`);
      return fallback;
    }

    throw new Error(`prompt template not found: key=${key}`);
  }

  private async resolveFromRedis(
    key: string,
    scope: PromptResolveScope,
    locale: string,
  ): Promise<ResolvedPrompt | null> {
    if (!this.promptStore.isAvailable()) {
      return null;
    }
    const { appClientId, agentId } = scope;
    const candidates: Array<{
      appClientId: number | null;
      agentId: number | null;
    }> = [];
    if (agentId != null && appClientId != null) {
      candidates.push({ appClientId, agentId });
    }
    if (appClientId != null) {
      candidates.push({ appClientId, agentId: null });
    }
    candidates.push({ appClientId: null, agentId: null });

    for (const candidate of candidates) {
      const hit = await this.promptStore.get(
        key,
        candidate.appClientId,
        candidate.agentId,
        locale,
      );
      if (hit) {
        return hit;
      }
    }
    return null;
  }

  private async findActiveRow(
    key: string,
    appClientId: number | null | undefined,
    agentId: number | null | undefined,
    locale: string,
  ) {
    const scopes: Prisma.PromptTemplateWhereInput[] = [];
    if (agentId != null && appClientId != null) {
      scopes.push({ key, agentId, appClientId, locale, isActive: true });
    }
    if (appClientId != null) {
      scopes.push({ key, agentId: null, appClientId, locale, isActive: true });
    }
    scopes.push({ key, agentId: null, appClientId: null, locale, isActive: true });

    for (const where of scopes) {
      const row = await this.prisma.promptTemplate.findFirst({ where });
      if (row) {
        return row;
      }
    }
    return null;
  }

  private toResolved(row: PromptTemplate): ResolvedPrompt {
    return {
      key: row.key,
      version: row.version,
      content: row.content,
      scope: this.scopeLabel(row.agentId, row.appClientId),
      templateId: row.id,
    };
  }

  /** DB/Redis 均无记录时，使用代码内兜底（与 seed 初始文案一致）。 */
  private resolveCodeFallback(key: string): ResolvedPrompt | null {
    if (!(PROMPT_KEY_LIST as string[]).includes(key)) {
      return null;
    }
    const content = PROMPT_DEFAULT_CONTENT[key as PromptTemplateKey];
    if (!content) {
      return null;
    }
    return {
      key,
      version: 0,
      content,
      scope: 'global',
      templateId: 0,
    };
  }

  private scopeLabel(
    agentId: number | null,
    appClientId: number | null,
  ): ResolvedPrompt['scope'] {
    if (agentId != null) {
      return 'agent';
    }
    if (appClientId != null) {
      return 'app_client';
    }
    return 'global';
  }
}
