"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ImagePanelService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagePanelService = exports.getImagePanelService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const llm_model_config_cache_store_1 = require("../llm/llm-model-config-cache.store");
const outbound_http_service_1 = require("../outbound-http/outbound-http.service");
const image_panel_build_util_1 = require("./image-panel-build.util");
const image_panel_vision_demo_util_1 = require("./image-panel-vision-demo.util");
const image_panel_env_util_1 = require("./image-panel-env.util");
const sharp_loader_util_1 = require("./sharp-loader.util");
function buildSummaryCacheKey(input) {
    var _a, _b, _c, _d;
    const hint = (_b = (_a = input.hint) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
    const objective = (_d = (_c = input.objective) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : '';
    if (!hint && !objective) {
        return input.url;
    }
    return `${input.url}\0${hint}\0${objective}`;
}
const SUMMARY_CACHE_MAX_ENTRIES = (() => {
    var _a;
    const raw = (_a = process.env.IMAGE_PANEL_SUMMARY_CACHE_MAX) === null || _a === void 0 ? void 0 : _a.trim();
    const n = raw ? Number(raw) : 256;
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 16) {
        return 256;
    }
    return Math.min(n, 2048);
})();
const SUMMARY_CACHE_MAX_SUMMARY_CHARS = 2000;
let boundImagePanelService = null;
function getImagePanelService() {
    return boundImagePanelService;
}
exports.getImagePanelService = getImagePanelService;
let ImagePanelService = ImagePanelService_1 = class ImagePanelService {
    constructor(outbound, prisma, modelConfigCache) {
        this.outbound = outbound;
        this.prisma = prisma;
        this.modelConfigCache = modelConfigCache;
        this.logger = new common_1.Logger(ImagePanelService_1.name);
        this.summaryCache = new Map();
    }
    onModuleInit() {
        boundImagePanelService = this;
    }
    onModuleDestroy() {
        if (boundImagePanelService === this) {
            boundImagePanelService = null;
        }
    }
    async buildPanel(input) {
        return (0, image_panel_build_util_1.buildImagePanelFromUrls)({
            urls: input.urls,
            outbound: this.outbound,
            options: input.options,
        });
    }
    async recognizeFromUrls(input) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
        const totalStarted = Date.now();
        const maxCells = (_a = input.maxCells) !== null && _a !== void 0 ? _a : 6;
        const cacheTtlSec = (_b = input.cacheTtlSec) !== null && _b !== void 0 ? _b : 86400;
        const deduped = [...new Set(input.urls.map((u) => u.trim()).filter(Boolean))];
        const selected = deduped.slice(0, Math.max(1, maxCells));
        const omittedUrls = deduped.slice(selected.length);
        if (deduped.length === 0) {
            return {
                panelVersion: 1,
                layout: { rows: 1, cols: 1, cellPx: (_c = input.cellPx) !== null && _c !== void 0 ? _c : 512, fit: 'contain' },
                cells: [],
                omittedCount: 0,
                omittedUrls: [],
                timing: { fetchMs: 0, renderMs: 0, visionMs: 0, totalMs: 0 },
            };
        }
        if (!(0, image_panel_env_util_1.isImagePanelVisionEnabled)()) {
            this.logger.log('image-panel vision skipped: ENABLE_IMAGE_PANEL_VISION is off');
            return {
                panelVersion: 1,
                layout: {
                    rows: 1,
                    cols: Math.min(selected.length, 6),
                    cellPx: (_d = input.cellPx) !== null && _d !== void 0 ? _d : 512,
                    fit: 'contain',
                },
                cells: selected.map((url, i) => ({
                    index: i + 1,
                    url,
                    status: 'skipped',
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
        if (!(0, sharp_loader_util_1.tryLoadSharp)()) {
            this.logger.warn('image-panel vision skipped: sharp unavailable');
            return {
                panelVersion: 1,
                layout: {
                    rows: 1,
                    cols: Math.min(selected.length, 6),
                    cellPx: (_e = input.cellPx) !== null && _e !== void 0 ? _e : 512,
                    fit: 'contain',
                },
                cells: selected.map((url, i) => ({
                    index: i + 1,
                    url,
                    status: 'skipped',
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
        const cachedByUrl = new Map();
        const needFetch = [];
        for (const url of selected) {
            const cacheKey = buildSummaryCacheKey({
                url,
                hint: input.hint,
                objective: input.objective,
            });
            const hit = this.readCache(cacheKey);
            if (hit && cacheTtlSec > 0) {
                cachedByUrl.set(url, hit);
            }
            else {
                needFetch.push(url);
            }
        }
        let panel = null;
        if (needFetch.length > 0) {
            try {
                panel = await this.buildPanel({
                    urls: needFetch,
                    options: {
                        maxCells: needFetch.length,
                        cellPx: input.cellPx,
                    },
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.logger.warn(`image panel build failed: ${message}`);
                return {
                    panelVersion: 1,
                    layout: {
                        rows: 1,
                        cols: Math.min(selected.length, 6),
                        cellPx: (_f = input.cellPx) !== null && _f !== void 0 ? _f : 512,
                        fit: 'contain',
                    },
                    cells: selected.map((url, i) => {
                        const cached = cachedByUrl.get(url);
                        if (cached) {
                            return {
                                index: i + 1,
                                url,
                                status: 'ok',
                                summary: cached.summary,
                                legible: cached.legible,
                                cached: true,
                            };
                        }
                        return {
                            index: i + 1,
                            url,
                            status: 'fetch_failed',
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
        if (needFetch.length === 0) {
            return {
                panelVersion: 1,
                layout: {
                    rows: 1,
                    cols: selected.length,
                    cellPx: (_g = input.cellPx) !== null && _g !== void 0 ? _g : 512,
                    fit: 'contain',
                },
                cells: selected.map((url, i) => {
                    const hit = cachedByUrl.get(url);
                    return {
                        index: i + 1,
                        url,
                        status: 'ok',
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
        const built = panel;
        const okTileCount = built.manifest.cells.filter((cell) => cell.status === 'ok').length;
        if (okTileCount === 0) {
            return {
                panelVersion: 1,
                layout: built.manifest.layout,
                cells: selected.map((url, i) => {
                    var _a;
                    const cached = cachedByUrl.get(url);
                    if (cached) {
                        return {
                            index: i + 1,
                            url,
                            status: 'ok',
                            summary: cached.summary,
                            legible: cached.legible,
                            cached: true,
                        };
                    }
                    const panelCell = built.manifest.cells.find((c) => c.url === url);
                    return {
                        index: i + 1,
                        url,
                        status: 'fetch_failed',
                        cached: false,
                        error: (_a = panelCell === null || panelCell === void 0 ? void 0 : panelCell.error) !== null && _a !== void 0 ? _a : 'fetch_failed',
                        sourceSize: panelCell === null || panelCell === void 0 ? void 0 : panelCell.sourceSize,
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
        let visionError;
        let modelMeta;
        try {
            const sharp = (0, sharp_loader_util_1.requireSharp)();
            const chatConfig = await this.resolveActiveChatConfig();
            const jpeg = await sharp(built.png).jpeg({ quality: 85 }).toBuffer();
            const visionDataUrl = `data:image/jpeg;base64,${jpeg.toString('base64')}`;
            const manifestForModel = Object.assign(Object.assign(Object.assign({}, built.manifest), (((_h = input.hint) === null || _h === void 0 ? void 0 : _h.trim()) ? { hint: input.hint.trim() } : {})), (((_j = input.objective) === null || _j === void 0 ? void 0 : _j.trim())
                ? { objective: input.objective.trim() }
                : {}));
            const messages = (0, image_panel_vision_demo_util_1.buildImagePanelVisionMessages)({
                panelDataUrl: visionDataUrl,
                manifestJson: JSON.stringify(manifestForModel, null, 2),
            });
            const endpoint = this.resolveChatCompletionsUrl(chatConfig.baseUrl, chatConfig.chatPath);
            modelMeta = {
                id: chatConfig.id,
                model: chatConfig.model,
                baseUrl: chatConfig.baseUrl,
                endpoint,
            };
            this.logger.log(`image-panel vision endpoint=${endpoint} model=${chatConfig.model}`);
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 120000);
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: Object.assign({ 'Content-Type': 'application/json' }, (((_k = chatConfig.apiKey) === null || _k === void 0 ? void 0 : _k.trim())
                        ? { Authorization: `Bearer ${chatConfig.apiKey.trim()}` }
                        : {})),
                    body: JSON.stringify({
                        model: chatConfig.model,
                        messages,
                        stream: false,
                        max_tokens: (_l = chatConfig.maxTokens) !== null && _l !== void 0 ? _l : 1500,
                        temperature: (_m = chatConfig.temperature) !== null && _m !== void 0 ? _m : 0.2,
                    }),
                    signal: controller.signal,
                });
                const bodyText = await response.text();
                if (!response.ok) {
                    throw new Error(`vision llm failed: ${response.status} ${response.statusText} ${bodyText.slice(0, 400)}`);
                }
                const parsedBody = JSON.parse(bodyText);
                const content = (_r = (_q = (_p = (_o = parsedBody.choices) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.message) === null || _q === void 0 ? void 0 : _q.content) !== null && _r !== void 0 ? _r : (_s = parsedBody.message) === null || _s === void 0 ? void 0 : _s.content;
                visionRawText =
                    typeof content === 'string'
                        ? content
                        : content == null
                            ? ''
                            : JSON.stringify(content);
            }
            finally {
                clearTimeout(timer);
            }
        }
        catch (error) {
            visionError =
                error instanceof Error ? error.message : String(error);
            this.logger.warn(`image-panel vision failed: ${visionError}`);
        }
        const visionMs = Date.now() - visionStarted;
        const parsed = (0, image_panel_vision_demo_util_1.tryParseVisionJson)(visionRawText);
        const summaryByIndex = new Map();
        if ((parsed === null || parsed === void 0 ? void 0 : parsed.cells) && Array.isArray(parsed.cells)) {
            for (const cell of parsed.cells) {
                if (typeof (cell === null || cell === void 0 ? void 0 : cell.index) !== 'number' || typeof cell.summary !== 'string') {
                    continue;
                }
                summaryByIndex.set(cell.index, {
                    summary: cell.summary,
                    legible: cell.legible !== false,
                });
            }
        }
        const panelUrlToIndex = new Map(built.manifest.cells.map((c) => [c.url, c.index]));
        const cells = selected.map((url, i) => {
            var _a;
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
            const fromVision = panelIndex != null ? summaryByIndex.get(panelIndex) : undefined;
            if ((panelCell === null || panelCell === void 0 ? void 0 : panelCell.status) === 'ok' &&
                (fromVision === null || fromVision === void 0 ? void 0 : fromVision.summary) &&
                cacheTtlSec > 0) {
                this.writeCache(buildSummaryCacheKey({
                    url,
                    hint: input.hint,
                    objective: input.objective,
                }), fromVision.summary, fromVision.legible, cacheTtlSec);
            }
            return {
                index,
                url,
                status: (_a = panelCell === null || panelCell === void 0 ? void 0 : panelCell.status) !== null && _a !== void 0 ? _a : 'fetch_failed',
                summary: fromVision === null || fromVision === void 0 ? void 0 : fromVision.summary,
                legible: fromVision === null || fromVision === void 0 ? void 0 : fromVision.legible,
                cached: false,
                error: panelCell === null || panelCell === void 0 ? void 0 : panelCell.error,
                sourceSize: panelCell === null || panelCell === void 0 ? void 0 : panelCell.sourceSize,
            };
        });
        if (!visionError) {
            const expectedVisionCells = needFetch.filter((url) => {
                const cell = built.manifest.cells.find((row) => row.url === url);
                return (cell === null || cell === void 0 ? void 0 : cell.status) === 'ok';
            });
            if (expectedVisionCells.length > 0) {
                const hasAnySummary = expectedVisionCells.some((url) => {
                    const row = cells.find((cell) => cell.url === url);
                    return typeof (row === null || row === void 0 ? void 0 : row.summary) === 'string' && row.summary.trim().length > 0;
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
    readCache(url) {
        const hit = this.summaryCache.get(url);
        if (!hit) {
            return null;
        }
        if (hit.expiresAt <= Date.now()) {
            this.summaryCache.delete(url);
            return null;
        }
        this.summaryCache.delete(url);
        this.summaryCache.set(url, hit);
        return hit;
    }
    writeCache(url, summary, legible, ttlSec) {
        if (ttlSec <= 0) {
            return;
        }
        this.purgeExpiredCacheEntries();
        const clipped = summary.length > SUMMARY_CACHE_MAX_SUMMARY_CHARS
            ? summary.slice(0, SUMMARY_CACHE_MAX_SUMMARY_CHARS)
            : summary;
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
    purgeExpiredCacheEntries() {
        const now = Date.now();
        for (const [key, entry] of this.summaryCache) {
            if (entry.expiresAt <= now) {
                this.summaryCache.delete(key);
            }
        }
    }
    evictCacheEntriesUntilRoom(room) {
        const limit = Math.max(1, SUMMARY_CACHE_MAX_ENTRIES);
        while (this.summaryCache.size + room > limit) {
            const oldest = this.summaryCache.keys().next().value;
            if (oldest == null) {
                break;
            }
            this.summaryCache.delete(oldest);
        }
    }
    async resolveActiveChatConfig() {
        const fromRedis = await this.modelConfigCache.getActive(client_1.LlmModelKind.chat);
        if (fromRedis === null || fromRedis === void 0 ? void 0 : fromRedis.enabled) {
            return fromRedis;
        }
        const fromDb = await this.prisma.llmModelConfig.findFirst({
            where: { enabled: true, kind: client_1.LlmModelKind.chat },
            orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        });
        if (!fromDb) {
            throw new Error('no enabled chat llm model config for vision');
        }
        return fromDb;
    }
    resolveChatCompletionsUrl(baseUrl, chatPath) {
        const normalizedBase = baseUrl.trim().replace(/\/+$/, '');
        const normalizedPath = chatPath.trim();
        let apiPrefix = normalizedBase;
        if (normalizedPath) {
            const withoutChatCompletions = normalizedPath.replace(/\/chat\/completions\/?$/i, '');
            if (withoutChatCompletions && withoutChatCompletions !== '/') {
                const prefix = withoutChatCompletions.startsWith('/')
                    ? withoutChatCompletions
                    : `/${withoutChatCompletions}`;
                apiPrefix = `${normalizedBase}${prefix}`.replace(/\/+$/, '');
            }
        }
        return `${apiPrefix}/chat/completions`;
    }
};
ImagePanelService = ImagePanelService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [outbound_http_service_1.OutboundHttpService,
        prisma_service_1.PrismaService,
        llm_model_config_cache_store_1.LlmModelConfigCacheStore])
], ImagePanelService);
exports.ImagePanelService = ImagePanelService;
//# sourceMappingURL=image-panel.service.js.map