import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { LlmModelKind } from '../../../generated/prisma/client';
import { LlmModelConfigCacheStore } from '../llm/llm-model-config-cache.store';
import { OutboundHttpService } from '../outbound-http/outbound-http.service';
import { isDevStaticAssetsEnabled } from '../security/runtime-env.util';
import { PrismaService } from '../../prisma/prisma.service';
import { buildImagePanelFromUrls } from './image-panel-build.util';
import type {
  ImagePanelBuildOptions,
  ImagePanelManifest,
} from './image-panel.types';
import {
  buildImagePanelVisionMessages,
  tryParseVisionJson,
} from './image-panel-vision-demo.util';
import { requireSharp } from './sharp-loader.util';

export type ImagePanelDemoStitchResponse = {
  panelVersion: number;
  width: number;
  height: number;
  bytes: number;
  timing: {
    fetchMs: number;
    renderMs: number;
    totalMs: number;
    clientRoundTripHint: string;
  };
  manifest: ImagePanelManifest;
  /** data URL，便于 HTML demo 直接预览 */
  panelDataUrl: string;
};

export type ImagePanelDemoRecognizeResponse = ImagePanelDemoStitchResponse & {
  model: {
    id: number;
    provider: string;
    model: string;
    baseUrl: string;
    endpoint?: string;
  };
  timing: ImagePanelDemoStitchResponse['timing'] & {
    visionMs: number;
    stitchMs: number;
  };
  /** 送给视觉模型的图（jpeg，体积更小） */
  visionImageBytes: number;
  visionRawText: string;
  visionParsed: unknown | null;
};

@Injectable()
export class ImagePanelDemoService {
  private readonly logger = new Logger(ImagePanelDemoService.name);

  constructor(
    private readonly outbound: OutboundHttpService,
    private readonly prisma: PrismaService,
    private readonly modelConfigCache: LlmModelConfigCacheStore,
  ) {}

  assertDemoEnabled(): void {
    if (!isDevStaticAssetsEnabled()) {
      throw new ServiceUnavailableException(
        'image-panel demo is disabled (enable with ENABLE_DEV_STATIC=1 outside production)',
      );
    }
  }

  async stitch(input: {
    urls: string[];
    cellPx?: number;
    maxCells?: number;
  }): Promise<ImagePanelDemoStitchResponse> {
    this.assertDemoEnabled();
    const built = await this.buildPanel(input);
    return this.toStitchResponse(built);
  }

  /**
   * 拼图后调用当前启用的 chat 模型做多模态识别（demo）。
   * 要求该模型支持 image_url；若只是纯文本 chat，会直接看到上游报错。
   */
  async recognize(input: {
    urls: string[];
    cellPx?: number;
    maxCells?: number;
    hint?: string;
  }): Promise<ImagePanelDemoRecognizeResponse> {
    this.assertDemoEnabled();
    const stitchStarted = Date.now();
    const built = await this.buildPanel(input);
    const stitchMs = Date.now() - stitchStarted;
    const stitch = this.toStitchResponse(built);

    const chatConfig = await this.resolveActiveChatConfig();
    // jpeg 通常比 png 更省多模态 token / 带宽
    const sharp = requireSharp();
    const jpeg = await sharp(built.png).jpeg({ quality: 85 }).toBuffer();
    const visionDataUrl = `data:image/jpeg;base64,${jpeg.toString('base64')}`;

    const manifestForModel = {
      ...built.manifest,
      ...(input.hint?.trim() ? { hint: input.hint.trim() } : {}),
    };
    const messages = buildImagePanelVisionMessages({
      panelDataUrl: visionDataUrl,
      manifestJson: JSON.stringify(manifestForModel, null, 2),
    });

    // 与后台「测试连接」一致：LangChain 会把 chatPath 收成 baseURL，再追加 /chat/completions。
    // 这里直接拼 baseUrl+chatPath 在部分配置下会变成错误路径 → 404。
    const endpoint = this.resolveChatCompletionsUrl(
      chatConfig.baseUrl,
      chatConfig.chatPath,
    );
    this.logger.log(
      `vision demo endpoint=${endpoint} model=${chatConfig.model} configId=${chatConfig.id}`,
    );
    // 只发 OpenAI 兼容字段；勿把 DB 的 parameters JSON 原样塞顶层（易干扰网关）
    const payload = {
      model: chatConfig.model,
      messages,
      stream: false,
      max_tokens: chatConfig.maxTokens ?? 1500,
      temperature: chatConfig.temperature ?? 0.2,
    };

    const visionStarted = Date.now();
    let visionRawText = '';
    // 与 OpenAiCompatibleAdapter 一致：LLM 地址来自管理员配置，不用用户 URL 的 SSRF 策略
    // （本地/内网网关常见），超时用 AbortSignal。
    const visionController = new AbortController();
    const visionTimer = setTimeout(() => visionController.abort(), 120_000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(chatConfig.apiKey?.trim()
            ? { Authorization: `Bearer ${chatConfig.apiKey.trim()}` }
            : {}),
        },
        body: JSON.stringify(payload),
        signal: visionController.signal,
      });
      const bodyText = await response.text();
      if (!response.ok) {
        throw new BadRequestException(
          `vision llm failed: ${response.status} ${response.statusText} ${bodyText.slice(0, 800)}`,
        );
      }
      let parsedBody: {
        choices?: Array<{ message?: { content?: unknown } }>;
        message?: { content?: unknown };
      };
      try {
        parsedBody = JSON.parse(bodyText) as typeof parsedBody;
      } catch {
        throw new BadRequestException(
          `vision llm returned non-JSON: ${bodyText.slice(0, 400)}`,
        );
      }
      const content =
        parsedBody.choices?.[0]?.message?.content ??
        parsedBody.message?.content;
      visionRawText =
        typeof content === 'string'
          ? content
          : content == null
            ? ''
            : JSON.stringify(content);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const aborted =
        error instanceof Error && error.name === 'AbortError';
      const message = aborted
        ? 'vision llm timed out after 120000ms'
        : error instanceof Error
          ? error.message
          : String(error);
      this.logger.warn(
        `vision demo call failed model=${chatConfig.model}: ${message}`,
      );
      throw new BadRequestException(`vision llm request error: ${message}`);
    } finally {
      clearTimeout(visionTimer);
    }
    const visionMs = Date.now() - visionStarted;

    return {
      ...stitch,
      model: {
        id: chatConfig.id,
        provider: chatConfig.provider,
        model: chatConfig.model,
        baseUrl: chatConfig.baseUrl,
        endpoint,
      },
      timing: {
        ...stitch.timing,
        stitchMs,
        visionMs,
        totalMs: stitchMs + visionMs,
      },
      visionImageBytes: jpeg.length,
      visionRawText,
      visionParsed: tryParseVisionJson(visionRawText),
    };
  }

  private async buildPanel(input: {
    urls: string[];
    cellPx?: number;
    maxCells?: number;
  }) {
    const urls = (input.urls ?? [])
      .map((u) => (typeof u === 'string' ? u.trim() : ''))
      .filter(Boolean);
    if (urls.length === 0) {
      throw new BadRequestException('urls must contain at least one image URL');
    }
    if (urls.length > 20) {
      throw new BadRequestException('urls length must be <= 20');
    }

    const options: ImagePanelBuildOptions = {
      cellPx: input.cellPx,
      maxCells: input.maxCells,
    };
    return buildImagePanelFromUrls({
      urls,
      outbound: this.outbound,
      options,
    });
  }

  private toStitchResponse(
    result: Awaited<ReturnType<typeof buildImagePanelFromUrls>>,
  ): ImagePanelDemoStitchResponse {
    return {
      panelVersion: result.manifest.panelVersion,
      width: result.width,
      height: result.height,
      bytes: result.png.length,
      timing: {
        fetchMs: result.timing.fetchMs,
        renderMs: result.timing.renderMs,
        totalMs: result.timing.totalMs,
        clientRoundTripHint:
          'browser total ≈ network RTT + server totalMs; compare fetchMs vs renderMs',
      },
      manifest: result.manifest,
      panelDataUrl: `data:image/png;base64,${result.png.toString('base64')}`,
    };
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
      throw new ServiceUnavailableException(
        'no enabled chat llm model config; configure a vision-capable model first',
      );
    }
    return fromDb;
  }

  /**
   * 对齐 LlmService.resolveLangChainBaseUrl + ChatOpenAI 行为：
   * baseURL 去掉末尾 /chat/completions 前缀段，最终 POST …/chat/completions。
   */
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
