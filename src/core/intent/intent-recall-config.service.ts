import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { IntentRecallConfig } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IntentRecallConfigCacheStore } from './intent-recall-config-cache.store';
import type {
  IntentRecallMode,
  ResolvedIntentRecallConfig,
} from './intent-recall-config.types';

@Injectable()
export class IntentRecallConfigService implements OnModuleInit {
  private readonly logger = new Logger(IntentRecallConfigService.name);
  private cached: ResolvedIntentRecallConfig | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configCache: IntentRecallConfigCacheStore,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.refreshCache();
    } catch (error) {
      this.logger.warn(
        `intent recall config preload skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async get(): Promise<ResolvedIntentRecallConfig> {
    if (this.cached) {
      return this.cached;
    }
    const fromRedis = await this.configCache.get();
    if (fromRedis) {
      this.cached = fromRedis;
      return fromRedis;
    }
    return this.refreshCache();
  }

  async refreshCache(): Promise<ResolvedIntentRecallConfig> {
    const row = await this.prisma.intentRecallConfig.findFirst({
      where: { singletonKey: 1 },
    });
    const resolved = row ? this.mapRow(row) : this.resolveFromEnv();
    this.cached = resolved;
    await this.configCache.trySet(resolved);
    return resolved;
  }

  async resolveRecallMode(embeddingConfigured: boolean): Promise<{
    useVector: boolean;
    reason: string;
  }> {
    const cfg = await this.get();
    if (cfg.recallMode === 'keyword') {
      return { useVector: false, reason: 'recallMode=keyword (db)' };
    }
    if (cfg.recallMode === 'vector') {
      return {
        useVector: true,
        reason: embeddingConfigured
          ? 'recallMode=vector (db)'
          : 'recallMode=vector but embedding not configured',
      };
    }
    return {
      useVector: embeddingConfigured,
      reason: embeddingConfigured
        ? 'recallMode=auto with embedding configured'
        : 'recallMode=auto without embedding',
    };
  }

  shouldFallbackToKeywordOnError(): Promise<boolean> {
    return this.get().then((cfg) => cfg.fallbackToKeyword);
  }

  private mapRow(row: IntentRecallConfig): ResolvedIntentRecallConfig {
    return {
      recallMode: this.parseRecallMode(row.recallMode),
      vectorTopK: row.vectorTopK > 0 ? row.vectorTopK : 10,
      vectorMinScore:
        Number.isFinite(row.vectorMinScore) && row.vectorMinScore >= 0
          ? row.vectorMinScore
          : 0.25,
      bindToolsMax: row.bindToolsMax > 0 ? row.bindToolsMax : 25,
      fallbackToKeyword: row.fallbackToKeyword,
      source: 'database',
    };
  }

  private resolveFromEnv(): ResolvedIntentRecallConfig {
    return {
      recallMode: this.parseRecallMode(process.env.AGENT_INTENT_RECALL_MODE),
      vectorTopK: this.readPositiveIntEnv('AGENT_INTENT_VECTOR_TOP_K', 10),
      vectorMinScore: this.readFloatEnv('AGENT_INTENT_VECTOR_MIN_SCORE', 0.25),
      bindToolsMax: this.readPositiveIntEnv('AGENT_BIND_TOOLS_MAX', 25),
      fallbackToKeyword: true,
      source: 'env',
    };
  }

  private parseRecallMode(raw: string | undefined): IntentRecallMode {
    const mode = raw?.trim().toLowerCase();
    if (mode === 'vector' || mode === 'keyword') {
      return mode;
    }
    return 'auto';
  }

  private readPositiveIntEnv(name: string, fallback: number): number {
    const raw = process.env[name]?.trim();
    if (!raw) {
      return fallback;
    }
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private readFloatEnv(name: string, fallback: number): number {
    const raw = process.env[name]?.trim();
    if (!raw) {
      return fallback;
    }
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }
}
