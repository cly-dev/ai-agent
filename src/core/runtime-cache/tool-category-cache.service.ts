import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MAX_RUN_SCOPE_CACHE_ENTRIES,
  getRunScopeCacheTtlMs,
} from './runtime-cache.constants';

export type ToolCategoryCacheRow = {
  id: number;
  label: string;
  description: string | null;
};

@Injectable()
export class ToolCategoryCacheService {
  private readonly cache = new Map<
    string,
    { rows: ToolCategoryCacheRow[]; expiresAt: number }
  >();

  constructor(private readonly prisma: PrismaService) {}

  async fetchByIds(toolCategoryIds: number[]): Promise<ToolCategoryCacheRow[]> {
    const uniq = Array.from(new Set(toolCategoryIds)).sort((a, b) => a - b);
    if (uniq.length === 0) {
      return [];
    }
    const cacheKey = uniq.join(',');
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.rows;
    }
    const rows = await this.prisma.toolCategory.findMany({
      where: { id: { in: uniq } },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, label: true, description: true },
    });
    this.cache.set(cacheKey, {
      rows,
      expiresAt: Date.now() + getRunScopeCacheTtlMs(),
    });
    this.prune();
    return rows;
  }

  clearAll(): void {
    this.cache.clear();
  }

  private prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
    while (this.cache.size > MAX_RUN_SCOPE_CACHE_ENTRIES) {
      const first = this.cache.keys().next().value;
      if (first === undefined) {
        break;
      }
      this.cache.delete(first);
    }
  }
}
