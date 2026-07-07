import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { LlmService } from '../../core/llm/llm.service';
import { RedisConnectionService } from '../../core/memory/redis/redis-connection.service';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ConnectivityBatchResult,
  ConnectivityCheckResult,
  ConnectivityCheckTarget,
} from './connectivity.types';

const DEFAULT_TARGETS: ConnectivityCheckTarget[] = [
  'database',
  'redis',
  'llm_chat',
  'llm_embedding',
];

@Injectable()
export class ConnectivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisConnection: RedisConnectionService,
    private readonly llmService: LlmService,
  ) {}

  async checkDatabase(): Promise<ConnectivityCheckResult> {
    const startedAt = Date.now();
    try {
      await this.prisma.$queryRaw(Prisma.sql`SELECT 1`);
      return {
        target: 'database',
        ok: true,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        target: 'database',
        ok: false,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async checkRedis(): Promise<ConnectivityCheckResult> {
    const startedAt = Date.now();
    const ping = await this.redisConnection.ping();
    return {
      target: 'redis',
      ok: ping.ok,
      durationMs: Date.now() - startedAt,
      ...(ping.ok
        ? {}
        : { error: ping.error ?? 'redis unavailable' }),
      ...(ping.configured === false
        ? { detail: { configured: false } }
        : {}),
    };
  }

  async checkLlmChat(): Promise<ConnectivityCheckResult> {
    const startedAt = Date.now();
    try {
      const result = await this.llmService.testActiveChatConnection();
      return {
        target: 'llm_chat',
        ok: result.ok,
        durationMs: Date.now() - startedAt,
        error: result.error,
        detail: {
          configId: result.configId,
          provider: result.provider,
          model: result.model,
          probe: result.probe,
        },
      };
    } catch (error) {
      return {
        target: 'llm_chat',
        ok: false,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async checkLlmEmbedding(): Promise<ConnectivityCheckResult> {
    const startedAt = Date.now();
    try {
      const result = await this.llmService.testActiveEmbeddingConnection();
      if (!result) {
        return {
          target: 'llm_embedding',
          ok: false,
          durationMs: Date.now() - startedAt,
          error: 'no active embedding model configured',
          detail: { configured: false },
        };
      }
      return {
        target: 'llm_embedding',
        ok: result.ok,
        durationMs: Date.now() - startedAt,
        error: result.error,
        detail: {
          configId: result.configId,
          provider: result.provider,
          model: result.model,
          probe: result.probe,
        },
      };
    } catch (error) {
      return {
        target: 'llm_embedding',
        ok: false,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async runBatch(
    targets?: ConnectivityCheckTarget[],
  ): Promise<ConnectivityBatchResult> {
    const selected = targets?.length ? targets : DEFAULT_TARGETS;
    const checks: ConnectivityCheckResult[] = [];
    for (const target of selected) {
      switch (target) {
        case 'database':
          checks.push(await this.checkDatabase());
          break;
        case 'redis':
          checks.push(await this.checkRedis());
          break;
        case 'llm_chat':
          checks.push(await this.checkLlmChat());
          break;
        case 'llm_embedding':
          checks.push(await this.checkLlmEmbedding());
          break;
        default:
          break;
      }
    }
    return {
      checkedAt: new Date().toISOString(),
      checks,
    };
  }
}
