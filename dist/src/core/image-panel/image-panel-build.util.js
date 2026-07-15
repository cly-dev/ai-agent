"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildImagePanelFromUrls = void 0;
const outbound_http_types_1 = require("../outbound-http/outbound-http.types");
const outbound_url_guard_util_1 = require("../security/outbound-url-guard.util");
const image_panel_render_util_1 = require("./image-panel-render.util");
const sharp_loader_util_1 = require("./sharp-loader.util");
const DEFAULT_MAX_CELLS = 6;
const DEFAULT_FETCH_TIMEOUT_MS = 8000;
const DEFAULT_MAX_BYTES = 8 * 1024 * 1024;
const DEFAULT_FETCH_CONCURRENCY = 3;
const MAX_REDIRECT_HOPS = 5;
function dedupeUrls(urls) {
    const seen = new Set();
    const out = [];
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
async function mapPool(items, concurrency, worker) {
    const results = new Array(items.length);
    let next = 0;
    const runners = Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, async () => {
        while (next < items.length) {
            const current = next;
            next += 1;
            results[current] = await worker(items[current], current);
        }
    });
    await Promise.all(runners);
    return results;
}
async function readResponseBodyCapped(response, maxBytes) {
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
    const chunks = [];
    let total = 0;
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            if (!(value === null || value === void 0 ? void 0 : value.byteLength)) {
                continue;
            }
            total += value.byteLength;
            if (total > maxBytes) {
                await reader.cancel();
                throw new Error(`image exceeds ${maxBytes} bytes`);
            }
            chunks.push(Buffer.from(value));
        }
    }
    catch (error) {
        try {
            await reader.cancel();
        }
        catch (_a) {
        }
        throw error;
    }
    return chunks.length === 1 ? chunks[0] : Buffer.concat(chunks, total);
}
async function fetchImageTile(input) {
    var _a;
    const started = Date.now();
    try {
        let currentUrl = input.url;
        let response = null;
        for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop += 1) {
            (0, outbound_url_guard_util_1.assertOutboundUrlAllowed)(currentUrl);
            response = await input.outbound.fetchWithPolicy(currentUrl, { method: 'GET', redirect: 'manual' }, {
                timeoutMs: input.timeoutMs,
                label: 'image-panel-fetch',
            });
            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get('location');
                if (!(location === null || location === void 0 ? void 0 : location.trim())) {
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
        const contentType = (_a = response.headers.get('content-type')) !== null && _a !== void 0 ? _a : '';
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
        const sharp = (0, sharp_loader_util_1.requireSharp)();
        const meta = await sharp(buf).metadata();
        return {
            index: input.index,
            url: input.url,
            status: 'ok',
            bytes: buf,
            sourceSize: meta.width && meta.height
                ? { w: meta.width, h: meta.height }
                : undefined,
            fetchMs: Date.now() - started,
        };
    }
    catch (error) {
        const message = error instanceof outbound_http_types_1.OutboundHttpError
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
async function buildImagePanelFromUrls(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const totalStarted = Date.now();
    const maxCells = (_b = (_a = input.options) === null || _a === void 0 ? void 0 : _a.maxCells) !== null && _b !== void 0 ? _b : DEFAULT_MAX_CELLS;
    const cellPx = (_c = input.options) === null || _c === void 0 ? void 0 : _c.cellPx;
    const timeoutMs = (_e = (_d = input.options) === null || _d === void 0 ? void 0 : _d.fetchTimeoutMs) !== null && _e !== void 0 ? _e : DEFAULT_FETCH_TIMEOUT_MS;
    const maxBytes = (_g = (_f = input.options) === null || _f === void 0 ? void 0 : _f.maxBytesPerImage) !== null && _g !== void 0 ? _g : DEFAULT_MAX_BYTES;
    const concurrency = (_j = (_h = input.options) === null || _h === void 0 ? void 0 : _h.fetchConcurrency) !== null && _j !== void 0 ? _j : DEFAULT_FETCH_CONCURRENCY;
    const all = dedupeUrls(input.urls);
    const selected = all.slice(0, Math.max(1, maxCells));
    const omittedUrls = all.slice(selected.length);
    const fetchStarted = Date.now();
    const tiles = await mapPool(selected, concurrency, async (url, i) => fetchImageTile({
        url,
        index: i + 1,
        outbound: input.outbound,
        timeoutMs,
        maxBytes,
    }));
    const fetchMs = Date.now() - fetchStarted;
    const rendered = await (0, image_panel_render_util_1.renderImagePanelPng)({
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
exports.buildImagePanelFromUrls = buildImagePanelFromUrls;
//# sourceMappingURL=image-panel-build.util.js.map