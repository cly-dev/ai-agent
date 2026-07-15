import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { LlmModelKind } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmModelConfigCacheStore } from '../llm/llm-model-config-cache.store';
import { OutboundHttpService } from '../outbound-http/outbound-http.service';
import { buildImagePanelFromUrls } from './image-panel-build.util';
import type {
  ImagePanelBuildOptions,
  ImagePanelManifest,
  ImagePanelRenderResult,
} from './image-panel.types';
import {
  buildImagePanelVisionMessages,
  tryParseVisionJson,
} from './image-panel-vision-demo.util';
import { isImagePanelVisionEnabled } from './image-panel-env.util';
import { requireSharp, tryLoadSharp } from './sharp-loader.util';
import type { ImageEntityGroup } from './collect-image-urls.util';

export type ImagePanelCellSummary = {
  index: number;
  url: string;
  /** skipped：环境关闭 / sharp 缺失等未真正识图 */
  status: 'ok' | 'fetch_failed' | 'skipped';
  summary?: string;
  legible?: boolean;
  cached?: boolean;
  error?: string;
  sourceSize?: { w: number; h: number };
};

export type ImagePanelRecognizeResult = {
  panelVersion: number;
  layout: ImagePanelManifest['layout'];
  cells: ImagePanelCellSummary[];
  omittedCount: number;
  omittedUrls: string[];
  timing: {
    fetchMs: number;
    renderMs: number;
    visionMs: number;
    totalMs: number;
  };
  visionError?: string;
  model?: { id: number; model: string; baseUrl: string; endpoint: string };
};

/** 按实体绑定的识图结果（列表/详情统一结构）。 */
export type ImagePanelEntityGroupResult = {
  entityKey: string;
  path: string;
  contextText?: string;
  cells: ImagePanelCellSummary[];
  omittedCount: number;
  omittedUrls: string[];
  visionError?: string;
  timing: ImagePanelRecognizeResult['timing'];
};

export type ImagePanelGroupedRecognizeResult = {
  panelVersion: number;
  groups: ImagePanelEntityGroupResult[];
  /** 兼容扁平消费：各组 cells 按顺序拼接并重编号 */
  cells: ImagePanelCellSummary[];
  omittedGroupCount: number;
  omittedGroups: Array<{ entityKey: string; path: string; urlCount: number }>;
  timing: ImagePanelRecognizeResult['timing'];
  visionError?: string;
};

type CacheEntry = { summary: string; legible: boolean; expiresAt: number };

function buildSummaryCacheKey(input: {
  url: string;
  hint?: string;
  objective?: string;
}): string {
  // hint/objective 纳入 key，避免改提示词后仍返回旧摘要
  const hint = input.hint?.trim() ?? '';
  const objective = input.objective?.trim() ?? '';
  if (!hint && !objective) {
    return input.url;
  }
  return `${input.url}\0${hint}\0${objective}`;
}

/** 进程内摘要缓存硬顶：先清过期，再按最早过期驱逐；防 URL 风暴缓胀 OOM。 */
const SUMMARY_CACHE_MAX_ENTRIES = (() => {
  const raw = process.env.IMAGE_PANEL_SUMMARY_CACHE_MAX?.trim();
  const n = raw ? Number(raw) : 256;
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 16) {
    return 256;
  }
  return Math.min(n, 2_048);
})();

/** 单条缓存摘要字符上限，避免个别超长 VL 输出占满内存。 */
const SUMMARY_CACHE_MAX_SUMMARY_CHARS = 2_000;

let boundImagePanelService: ImagePanelService | null = null;

/** Executor 用：从 Nest 绑定的单例取服务（避免扩大 AgentGraphDeps）。 */
export function getImagePanelService(): ImagePanelService | null {
  return boundImagePanelService;
}

@Injectable()
export class ImagePanelService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ImagePanelService.name);
  private readonly summaryCache = new Map<string, CacheEntry>();

  constructor(
    private readonly outbound: OutboundHttpService,
    private readonly prisma: PrismaService,
    private readonly modelConfigCache: LlmModelConfigCacheStore,
  ) {}

  onModuleInit(): void {
    boundImagePanelService = this;
  }

  onModuleDestroy(): void {
    if (boundImagePanelService === this) {
      boundImagePanelService = null;
    }
  }

  async buildPanel(input: {
    urls: string[];
    options?: ImagePanelBuildOptions;
  }): Promise<ImagePanelRenderResult> {
    return buildImagePanelFromUrls({
      urls: input.urls,
      outbound: this.outbound,
      options: input.options,
    });
  }

  /**
   * 拼图 + 多模态识别。无 URL 时返回空 cells，不调 vision。
   * ENABLE_IMAGE_PANEL_VISION=0 / sharp 缺失 / vision 失败 → visionError，由调用方 degrade/fail。
   */
  async recognizeFromUrls(input: {
    urls: string[];
    maxCells?: number;
    cellPx?: number;
    hint?: string;
    objective?: string;
    cacheTtlSec?: number;
  }): Promise<ImagePanelRecognizeResult> {
    const totalStarted = Date.now();
    const maxCells = input.maxCells ?? 6;
    const cacheTtlSec = input.cacheTtlSec ?? 86_400;

    const deduped = [...new Set(input.urls.map((u) => u.trim()).filter(Boolean))];
    const selected = deduped.slice(0, Math.max(1, maxCells));
    const omittedUrls = deduped.slice(selected.length);

    if (deduped.length === 0) {
      return {
        panelVersion: 1,
        layout: { rows: 1, cols: 1, cellPx: input.cellPx ?? 512, fit: 'contain' },
        cells: [],
        omittedCount: 0,
        omittedUrls: [],
        timing: { fetchMs: 0, renderMs: 0, visionMs: 0, totalMs: 0 },
      };
    }

    // 环境 catch：未开识图开关 / 无 sharp → 只回 URL 索引，不拉图不调 VL
    if (!isImagePanelVisionEnabled()) {
      this.logger.log(
        'image-panel vision skipped: ENABLE_IMAGE_PANEL_VISION is off',
      );
      return {
        panelVersion: 1,
        layout: {
          rows: 1,
          cols: Math.min(selected.length, 6),
          cellPx: input.cellPx ?? 512,
          fit: 'contain',
        },
        cells: selected.map((url, i) => ({
          index: i + 1,
          url,
          status: 'skipped' as const,
          cached: false,
        })),
        omittedCount: omittedUrls.length,
        omittedUrls,
        timing: {
          fetchMs: 0,
          renderMs: 0,
          visionMs: 0,
          totalMs: Date.now() - totalStarted,
        },
        visionError: 'IMAGE_PANEL_VISION_DISABLED',
      };
    }

    if (!tryLoadSharp()) {
      this.logger.warn('image-panel vision skipped: sharp unavailable');
      return {
        panelVersion: 1,
        layout: {
          rows: 1,
          cols: Math.min(selected.length, 6),
          cellPx: input.cellPx ?? 512,
          fit: 'contain',
        },
        cells: selected.map((url, i) => ({
          index: i + 1,
          url,
          status: 'skipped' as const,
          cached: false,
        })),
        omittedCount: omittedUrls.length,
        omittedUrls,
        timing: {
          fetchMs: 0,
          renderMs: 0,
          visionMs: 0,
          totalMs: Date.now() - totalStarted,
        },
        visionError: 'SHARP_UNAVAILABLE',
      };
    }

    // 缓存命中的格：跳过拉图，只对其余 URL 拼 panel（key 含 hint/objective）
    const cachedByUrl = new Map<string, CacheEntry>();
    const needFetch: string[] = [];
    for (const url of selected) {
      const cacheKey = buildSummaryCacheKey({
        url,
        hint: input.hint,
        objective: input.objective,
      });
      const hit = this.readCache(cacheKey);
      if (hit && cacheTtlSec > 0) {
        cachedByUrl.set(url, hit);
      } else {
        needFetch.push(url);
      }
    }

    let panel: ImagePanelRenderResult | null = null;
    if (needFetch.length > 0) {
      try {
        panel = await this.buildPanel({
          urls: needFetch,
          options: {
            maxCells: needFetch.length,
            cellPx: input.cellPx,
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(`image panel build failed: ${message}`);
        return {
          panelVersion: 1,
          layout: {
            rows: 1,
            cols: Math.min(selected.length, 6),
            cellPx: input.cellPx ?? 512,
            fit: 'contain',
          },
          // 保留已命中缓存；仅未拉到的格记失败，避免整盘作废
          cells: selected.map((url, i) => {
            const cached = cachedByUrl.get(url);
            if (cached) {
              return {
                index: i + 1,
                url,
                status: 'ok' as const,
                summary: cached.summary,
                legible: cached.legible,
                cached: true,
              };
            }
            return {
              index: i + 1,
              url,
              status: 'fetch_failed' as const,
              error: message,
              cached: false,
            };
          }),
          omittedCount: omittedUrls.length,
          omittedUrls,
          timing: {
            fetchMs: 0,
            renderMs: 0,
            visionMs: 0,
            totalMs: Date.now() - totalStarted,
          },
          visionError: `PANEL_BUILD_FAILED: ${message}`,
        };
      }
    }

    // 若全部缓存命中，无需 vision
    if (needFetch.length === 0) {
      return {
        panelVersion: 1,
        layout: {
          rows: 1,
          cols: selected.length,
          cellPx: input.cellPx ?? 512,
          fit: 'contain',
        },
        cells: selected.map((url, i) => {
          const hit = cachedByUrl.get(url)!;
          return {
            index: i + 1,
            url,
            status: 'ok' as const,
            summary: hit.summary,
            legible: hit.legible,
            cached: true,
          };
        }),
        omittedCount: omittedUrls.length,
        omittedUrls,
        timing: {
          fetchMs: 0,
          renderMs: 0,
          visionMs: 0,
          totalMs: Date.now() - totalStarted,
        },
      };
    }

    const built = panel!;
    const okTileCount = built.manifest.cells.filter(
      (cell) => cell.status === 'ok',
    ).length;
    // 全部拉图失败：不再送 VL（失败格占位），直接回传索引
    if (okTileCount === 0) {
      return {
        panelVersion: 1,
        layout: built.manifest.layout,
        cells: selected.map((url, i) => {
          const cached = cachedByUrl.get(url);
          if (cached) {
            return {
              index: i + 1,
              url,
              status: 'ok' as const,
              summary: cached.summary,
              legible: cached.legible,
              cached: true,
            };
          }
          const panelCell = built.manifest.cells.find((c) => c.url === url);
          return {
            index: i + 1,
            url,
            status: 'fetch_failed' as const,
            cached: false,
            error: panelCell?.error ?? 'fetch_failed',
            sourceSize: panelCell?.sourceSize,
          };
        }),
        omittedCount: omittedUrls.length,
        omittedUrls,
        timing: {
          fetchMs: built.timing.fetchMs,
          renderMs: built.timing.renderMs,
          visionMs: 0,
          totalMs: Date.now() - totalStarted,
        },
        visionError: 'ALL_FETCH_FAILED',
      };
    }

    const visionStarted = Date.now();
    let visionRawText = '';
    let visionError: string | undefined;
    let modelMeta:
      | { id: number; model: string; baseUrl: string; endpoint: string }
      | undefined;

    try {
      const sharp = requireSharp();
      const chatConfig = await this.resolveActiveChatConfig();
      const jpeg = await sharp(built.png).jpeg({ quality: 85 }).toBuffer();
      const visionDataUrl = `data:image/jpeg;base64,${jpeg.toString('base64')}`;
      const manifestForModel = {
        ...built.manifest,
        ...(input.hint?.trim() ? { hint: input.hint.trim() } : {}),
        ...(input.objective?.trim()
          ? { objective: input.objective.trim() }
          : {}),
      };
      const messages = buildImagePanelVisionMessages({
        panelDataUrl: visionDataUrl,
        manifestJson: JSON.stringify(manifestForModel, null, 2),
      });
      const endpoint = this.resolveChatCompletionsUrl(
        chatConfig.baseUrl,
        chatConfig.chatPath,
      );
      modelMeta = {
        id: chatConfig.id,
        model: chatConfig.model,
        baseUrl: chatConfig.baseUrl,
        endpoint,
      };
      this.logger.log(
        `image-panel vision endpoint=${endpoint} model=${chatConfig.model}`,
      );

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 120_000);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(chatConfig.apiKey?.trim()
              ? { Authorization: `Bearer ${chatConfig.apiKey.trim()}` }
              : {}),
          },
          body: JSON.stringify({
            model: chatConfig.model,
            messages,
            stream: false,
            max_tokens: chatConfig.maxTokens ?? 1500,
            temperature: chatConfig.temperature ?? 0.2,
          }),
          signal: controller.signal,
        });
        const bodyText = await response.text();
        if (!response.ok) {
          throw new Error(
            `vision llm failed: ${response.status} ${response.statusText} ${bodyText.slice(0, 400)}`,
          );
        }
        const parsedBody = JSON.parse(bodyText) as {
          choices?: Array<{ message?: { content?: unknown } }>;
          message?: { content?: unknown };
        };
        const content =
          parsedBody.choices?.[0]?.message?.content ??
          parsedBody.message?.content;
        visionRawText =
          typeof content === 'string'
            ? content
            : content == null
              ? ''
              : JSON.stringify(content);
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      visionError =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(`image-panel vision failed: ${visionError}`);
    }

    const visionMs = Date.now() - visionStarted;
    const parsed = tryParseVisionJson(visionRawText) as {
      cells?: Array<{ index?: number; summary?: string; legible?: boolean }>;
    } | null;

    const summaryByIndex = new Map<
      number,
      { summary: string; legible: boolean }
    >();
    if (parsed?.cells && Array.isArray(parsed.cells)) {
      for (const cell of parsed.cells) {
        if (typeof cell?.index !== 'number' || typeof cell.summary !== 'string') {
          continue;
        }
        summaryByIndex.set(cell.index, {
          summary: cell.summary,
          legible: cell.legible !== false,
        });
      }
    }

    // needFetch 的 panel index 从 1 起；映射回 selected 顺序
    const panelUrlToIndex = new Map(
      built.manifest.cells.map((c) => [c.url, c.index] as const),
    );

    const cells: ImagePanelCellSummary[] = selected.map((url, i) => {
      const index = i + 1;
      const cached = cachedByUrl.get(url);
      if (cached) {
        return {
          index,
          url,
          status: 'ok',
          summary: cached.summary,
          legible: cached.legible,
          cached: true,
        };
      }
      const panelCell = built.manifest.cells.find((c) => c.url === url);
      const panelIndex = panelUrlToIndex.get(url);
      const fromVision =
        panelIndex != null ? summaryByIndex.get(panelIndex) : undefined;
      if (
        panelCell?.status === 'ok' &&
        fromVision?.summary &&
        cacheTtlSec > 0
      ) {
        this.writeCache(
          buildSummaryCacheKey({
            url,
            hint: input.hint,
            objective: input.objective,
          }),
          fromVision.summary,
          fromVision.legible,
          cacheTtlSec,
        );
      }
      return {
        index,
        url,
        status: panelCell?.status ?? 'fetch_failed',
        summary: fromVision?.summary,
        legible: fromVision?.legible,
        cached: false,
        error: panelCell?.error,
        sourceSize: panelCell?.sourceSize,
      };
    });

    // Vision HTTP 成功但解析空/无有效摘要：标 visionError，供 onFailure=fail 触发
    if (!visionError) {
      const expectedVisionCells = needFetch.filter((url) => {
        const cell = built.manifest.cells.find((row) => row.url === url);
        return cell?.status === 'ok';
      });
      if (expectedVisionCells.length > 0) {
        const hasAnySummary = expectedVisionCells.some((url) => {
          const row = cells.find((cell) => cell.url === url);
          return typeof row?.summary === 'string' && row.summary.trim().length > 0;
        });
        if (!hasAnySummary) {
          visionError = visionRawText.trim()
            ? 'VISION_PARSE_EMPTY'
            : 'VISION_EMPTY_RESPONSE';
        }
      }
    }

    return {
      panelVersion: 1,
      layout: built.manifest.layout,
      cells,
      omittedCount: omittedUrls.length,
      omittedUrls,
      timing: {
        fetchMs: built.timing.fetchMs,
        renderMs: built.timing.renderMs,
        visionMs,
        totalMs: Date.now() - totalStarted,
      },
      visionError,
      model: modelMeta,
    };
  }

  private readCache(url: string): CacheEntry | null {
    const hit = this.summaryCache.get(url);
    if (!hit) {
      return null;
    }
    if (hit.expiresAt <= Date.now()) {
      this.summaryCache.delete(url);
      return null;
    }
    // Map 插入序：删再写把命中项移到末尾，近似 LRU，满载时优先驱赶最久未用。
    this.summaryCache.delete(url);
    this.summaryCache.set(url, hit);
    return hit;
  }

  private writeCache(
    url: string,
    summary: string,
    legible: boolean,
    ttlSec: number,
  ): void {
    if (ttlSec <= 0) {
      return;
    }
    this.purgeExpiredCacheEntries();
    const clipped =
      summary.length > SUMMARY_CACHE_MAX_SUMMARY_CHARS
        ? summary.slice(0, SUMMARY_CACHE_MAX_SUMMARY_CHARS)
        : summary;
    // 更新已有 key：先删再写，保持「最近写入」在 Map 末尾。
    if (this.summaryCache.has(url)) {
      this.summaryCache.delete(url);
    }
    this.evictCacheEntriesUntilRoom(1);
    this.summaryCache.set(url, {
      summary: clipped,
      legible,
      expiresAt: Date.now() + ttlSec * 1000,
    });
  }

  private purgeExpiredCacheEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.summaryCache) {
      if (entry.expiresAt <= now) {
        this.summaryCache.delete(key);
      }
    }
  }

  /** 为即将插入的 room 条腾出空位；驱逐 Map 迭代序最前（最久未读/写）。 */
  private evictCacheEntriesUntilRoom(room: number): void {
    const limit = Math.max(1, SUMMARY_CACHE_MAX_ENTRIES);
    while (this.summaryCache.size + room > limit) {
      const oldest = this.summaryCache.keys().next().value;
      if (oldest == null) {
        break;
      }
      this.summaryCache.delete(oldest);
    }
  }

  private async resolveActiveChatConfig() {
    const fromRedis = await this.modelConfigCache.getActive(LlmModelKind.chat);
    if (fromRedis?.enabled) {
      return fromRedis;
    }
    const fromDb = await this.prisma.llmModelConfig.findFirst({
      where: { enabled: true, kind: LlmModelKind.chat },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    if (!fromDb) {
      throw new Error('no enabled chat llm model config for vision');
    }
    return fromDb;
  }

  /** 对齐 LlmService / LangChain：最终 POST …/chat/completions */
  private resolveChatCompletionsUrl(baseUrl: string, chatPath: string): string {
    const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
    const normalizedPath = chatPath.trim();
    let apiPrefix = normalizedBase;
    if (normalizedPath) {
      const withoutChatCompletions = normalizedPath.replace(
        /\/chat\/completions\/?$/i,
        '',
      );
      if (withoutChatCompletions && withoutChatCompletions !== '/') {
        const prefix = withoutChatCompletions.startsWith('/')
          ? withoutChatCompletions
          : `/${withoutChatCompletions}`;
        apiPrefix = `${normalizedBase}${prefix}`.replace(/\/+$/, '');
      }
    }
    return `${apiPrefix}/chat/completions`;
  }
}
