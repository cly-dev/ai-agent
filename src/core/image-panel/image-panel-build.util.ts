import { OutboundHttpService } from '../outbound-http/outbound-http.service';
import { OutboundHttpError } from '../outbound-http/outbound-http.types';
import { assertOutboundUrlAllowed } from '../security/outbound-url-guard.util';
import {
  renderImagePanelPng,
  type PanelTileInput,
} from './image-panel-render.util';
import type {
  ImagePanelBuildOptions,
  ImagePanelRenderResult,
} from './image-panel.types';
import { requireSharp } from './sharp-loader.util';

const DEFAULT_MAX_CELLS = 6;
const DEFAULT_FETCH_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_BYTES = 8 * 1024 * 1024;
const DEFAULT_FETCH_CONCURRENCY = 3;
/** 防止恶意 Location 链；每一跳都再做 SSRF 校验。 */
const MAX_REDIRECT_HOPS = 5;

function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const url = typeof raw === 'string' ? raw.trim() : '';
    if (!url || seen.has(url)) {
      continue;
    }
    seen.add(url);
    out.push(url);
  }
  return out;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const runners = Array.from(
    { length: Math.min(concurrency, Math.max(items.length, 1)) },
    async () => {
      while (next < items.length) {
        const current = next;
        next += 1;
        results[current] = await worker(items[current]!, current);
      }
    },
  );
  await Promise.all(runners);
  return results;
}

/**
 * 有界读 body：Content-Length 预检 + 流式累计，超 maxBytes 立即 cancel，避免整包进内存后才拒。
 */
async function readResponseBodyCapped(
  response: Response,
  maxBytes: number,
): Promise<Buffer> {
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const declared = Number(contentLength);
    if (Number.isFinite(declared) && declared > maxBytes) {
      throw new Error(`image exceeds ${maxBytes} bytes (content-length)`);
    }
  }

  if (!response.body) {
    const buf = Buffer.from(await response.arrayBuffer());
    if (buf.length > maxBytes) {
      throw new Error(`image exceeds ${maxBytes} bytes`);
    }
    return buf;
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (!value?.byteLength) {
        continue;
      }
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error(`image exceeds ${maxBytes} bytes`);
      }
      chunks.push(Buffer.from(value));
    }
  } catch (error) {
    try {
      await reader.cancel();
    } catch {
      // ignore cancel errors
    }
    throw error;
  }
  return chunks.length === 1 ? chunks[0]! : Buffer.concat(chunks, total);
}

async function fetchImageTile(input: {
  url: string;
  index: number;
  outbound: OutboundHttpService;
  timeoutMs: number;
  maxBytes: number;
}): Promise<PanelTileInput> {
  const started = Date.now();
  try {
    let currentUrl = input.url;
    let response: Response | null = null;

    // manual redirect + 每跳 SSRF，避免 follow 到内网
    for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop += 1) {
      assertOutboundUrlAllowed(currentUrl);
      response = await input.outbound.fetchWithPolicy(
        currentUrl,
        { method: 'GET', redirect: 'manual' },
        {
          timeoutMs: input.timeoutMs,
          label: 'image-panel-fetch',
        },
      );
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location?.trim()) {
          return {
            index: input.index,
            url: input.url,
            status: 'fetch_failed',
            fetchMs: Date.now() - started,
            error: `redirect ${response.status} without location`,
          };
        }
        if (hop === MAX_REDIRECT_HOPS) {
          return {
            index: input.index,
            url: input.url,
            status: 'fetch_failed',
            fetchMs: Date.now() - started,
            error: `too many redirects (>${MAX_REDIRECT_HOPS})`,
          };
        }
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }
      break;
    }

    if (!response) {
      return {
        index: input.index,
        url: input.url,
        status: 'fetch_failed',
        fetchMs: Date.now() - started,
        error: 'empty fetch response',
      };
    }

    if (!response.ok) {
      return {
        index: input.index,
        url: input.url,
        status: 'fetch_failed',
        fetchMs: Date.now() - started,
        error: `http ${response.status}`,
      };
    }
    const contentType = response.headers.get('content-type') ?? '';
    const normalizedCt = contentType.toLowerCase();
    if (normalizedCt.includes('image/svg')) {
      return {
        index: input.index,
        url: input.url,
        status: 'fetch_failed',
        fetchMs: Date.now() - started,
        error: 'svg images are not allowed',
      };
    }
    if (contentType && !normalizedCt.startsWith('image/')) {
      return {
        index: input.index,
        url: input.url,
        status: 'fetch_failed',
        fetchMs: Date.now() - started,
        error: `unexpected content-type: ${contentType}`,
      };
    }
    const buf = await readResponseBodyCapped(response, input.maxBytes);
    if (buf.length === 0) {
      return {
        index: input.index,
        url: input.url,
        status: 'fetch_failed',
        fetchMs: Date.now() - started,
        error: 'empty body',
      };
    }
    const sharp = requireSharp();
    const meta = await sharp(buf).metadata();
    return {
      index: input.index,
      url: input.url,
      status: 'ok',
      bytes: buf,
      sourceSize:
        meta.width && meta.height
          ? { w: meta.width, h: meta.height }
          : undefined,
      fetchMs: Date.now() - started,
    };
  } catch (error) {
    const message =
      error instanceof OutboundHttpError
        ? `${error.kind}: ${error.message}`
        : error instanceof Error
          ? error.message
          : String(error);
    return {
      index: input.index,
      url: input.url,
      status: 'fetch_failed',
      fetchMs: Date.now() - started,
      error: message,
    };
  }
}

/** 拉图（含 SSRF 护栏）→ 拼 IMAGE_PANEL/v1，并返回分阶段耗时。 */
export async function buildImagePanelFromUrls(input: {
  urls: string[];
  outbound: OutboundHttpService;
  options?: ImagePanelBuildOptions;
}): Promise<ImagePanelRenderResult> {
  const totalStarted = Date.now();
  const maxCells = input.options?.maxCells ?? DEFAULT_MAX_CELLS;
  const cellPx = input.options?.cellPx;
  const timeoutMs = input.options?.fetchTimeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const maxBytes = input.options?.maxBytesPerImage ?? DEFAULT_MAX_BYTES;
  const concurrency =
    input.options?.fetchConcurrency ?? DEFAULT_FETCH_CONCURRENCY;

  const all = dedupeUrls(input.urls);
  const selected = all.slice(0, Math.max(1, maxCells));
  const omittedUrls = all.slice(selected.length);

  const fetchStarted = Date.now();
  const tiles = await mapPool(selected, concurrency, async (url, i) =>
    fetchImageTile({
      url,
      index: i + 1,
      outbound: input.outbound,
      timeoutMs,
      maxBytes,
    }),
  );
  const fetchMs = Date.now() - fetchStarted;

  const rendered = await renderImagePanelPng({
    tiles,
    cellPx,
    omittedUrls,
  });

  return {
    png: rendered.png,
    width: rendered.width,
    height: rendered.height,
    manifest: rendered.manifest,
    timing: {
      fetchMs,
      renderMs: rendered.renderMs,
      totalMs: Date.now() - totalStarted,
    },
  };
}
