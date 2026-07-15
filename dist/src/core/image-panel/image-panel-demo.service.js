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
var ImagePanelDemoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagePanelDemoService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const llm_model_config_cache_store_1 = require("../llm/llm-model-config-cache.store");
const outbound_http_service_1 = require("../outbound-http/outbound-http.service");
const runtime_env_util_1 = require("../security/runtime-env.util");
const prisma_service_1 = require("../../prisma/prisma.service");
const image_panel_build_util_1 = require("./image-panel-build.util");
const image_panel_vision_demo_util_1 = require("./image-panel-vision-demo.util");
const sharp_loader_util_1 = require("./sharp-loader.util");
let ImagePanelDemoService = ImagePanelDemoService_1 = class ImagePanelDemoService {
    constructor(outbound, prisma, modelConfigCache) {
        this.outbound = outbound;
        this.prisma = prisma;
        this.modelConfigCache = modelConfigCache;
        this.logger = new common_1.Logger(ImagePanelDemoService_1.name);
    }
    assertDemoEnabled() {
        if (!(0, runtime_env_util_1.isDevStaticAssetsEnabled)()) {
            throw new common_1.ServiceUnavailableException('image-panel demo is disabled (enable with ENABLE_DEV_STATIC=1 outside production)');
        }
    }
    async stitch(input) {
        this.assertDemoEnabled();
        const built = await this.buildPanel(input);
        return this.toStitchResponse(built);
    }
    async recognize(input) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        this.assertDemoEnabled();
        const stitchStarted = Date.now();
        const built = await this.buildPanel(input);
        const stitchMs = Date.now() - stitchStarted;
        const stitch = this.toStitchResponse(built);
        const chatConfig = await this.resolveActiveChatConfig();
        const sharp = (0, sharp_loader_util_1.requireSharp)();
        const jpeg = await sharp(built.png).jpeg({ quality: 85 }).toBuffer();
        const visionDataUrl = `data:image/jpeg;base64,${jpeg.toString('base64')}`;
        const manifestForModel = Object.assign(Object.assign({}, built.manifest), (((_a = input.hint) === null || _a === void 0 ? void 0 : _a.trim()) ? { hint: input.hint.trim() } : {}));
        const messages = (0, image_panel_vision_demo_util_1.buildImagePanelVisionMessages)({
            panelDataUrl: visionDataUrl,
            manifestJson: JSON.stringify(manifestForModel, null, 2),
        });
        const endpoint = this.resolveChatCompletionsUrl(chatConfig.baseUrl, chatConfig.chatPath);
        this.logger.log(`vision demo endpoint=${endpoint} model=${chatConfig.model} configId=${chatConfig.id}`);
        const payload = {
            model: chatConfig.model,
            messages,
            stream: false,
            max_tokens: (_b = chatConfig.maxTokens) !== null && _b !== void 0 ? _b : 1500,
            temperature: (_c = chatConfig.temperature) !== null && _c !== void 0 ? _c : 0.2,
        };
        const visionStarted = Date.now();
        let visionRawText = '';
        const visionController = new AbortController();
        const visionTimer = setTimeout(() => visionController.abort(), 120000);
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: Object.assign({ 'Content-Type': 'application/json' }, (((_d = chatConfig.apiKey) === null || _d === void 0 ? void 0 : _d.trim())
                    ? { Authorization: `Bearer ${chatConfig.apiKey.trim()}` }
                    : {})),
                body: JSON.stringify(payload),
                signal: visionController.signal,
            });
            const bodyText = await response.text();
            if (!response.ok) {
                throw new common_1.BadRequestException(`vision llm failed: ${response.status} ${response.statusText} ${bodyText.slice(0, 800)}`);
            }
            let parsedBody;
            try {
                parsedBody = JSON.parse(bodyText);
            }
            catch (_k) {
                throw new common_1.BadRequestException(`vision llm returned non-JSON: ${bodyText.slice(0, 400)}`);
            }
            const content = (_h = (_g = (_f = (_e = parsedBody.choices) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.message) === null || _g === void 0 ? void 0 : _g.content) !== null && _h !== void 0 ? _h : (_j = parsedBody.message) === null || _j === void 0 ? void 0 : _j.content;
            visionRawText =
                typeof content === 'string'
                    ? content
                    : content == null
                        ? ''
                        : JSON.stringify(content);
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            const aborted = error instanceof Error && error.name === 'AbortError';
            const message = aborted
                ? 'vision llm timed out after 120000ms'
                : error instanceof Error
                    ? error.message
                    : String(error);
            this.logger.warn(`vision demo call failed model=${chatConfig.model}: ${message}`);
            throw new common_1.BadRequestException(`vision llm request error: ${message}`);
        }
        finally {
            clearTimeout(visionTimer);
        }
        const visionMs = Date.now() - visionStarted;
        return Object.assign(Object.assign({}, stitch), { model: {
                id: chatConfig.id,
                provider: chatConfig.provider,
                model: chatConfig.model,
                baseUrl: chatConfig.baseUrl,
                endpoint,
            }, timing: Object.assign(Object.assign({}, stitch.timing), { stitchMs,
                visionMs, totalMs: stitchMs + visionMs }), visionImageBytes: jpeg.length, visionRawText, visionParsed: (0, image_panel_vision_demo_util_1.tryParseVisionJson)(visionRawText) });
    }
    async buildPanel(input) {
        var _a;
        const urls = ((_a = input.urls) !== null && _a !== void 0 ? _a : [])
            .map((u) => (typeof u === 'string' ? u.trim() : ''))
            .filter(Boolean);
        if (urls.length === 0) {
            throw new common_1.BadRequestException('urls must contain at least one image URL');
        }
        if (urls.length > 20) {
            throw new common_1.BadRequestException('urls length must be <= 20');
        }
        const options = {
            cellPx: input.cellPx,
            maxCells: input.maxCells,
        };
        return (0, image_panel_build_util_1.buildImagePanelFromUrls)({
            urls,
            outbound: this.outbound,
            options,
        });
    }
    toStitchResponse(result) {
        return {
            panelVersion: result.manifest.panelVersion,
            width: result.width,
            height: result.height,
            bytes: result.png.length,
            timing: {
                fetchMs: result.timing.fetchMs,
                renderMs: result.timing.renderMs,
                totalMs: result.timing.totalMs,
                clientRoundTripHint: 'browser total ≈ network RTT + server totalMs; compare fetchMs vs renderMs',
            },
            manifest: result.manifest,
            panelDataUrl: `data:image/png;base64,${result.png.toString('base64')}`,
        };
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
            throw new common_1.ServiceUnavailableException('no enabled chat llm model config; configure a vision-capable model first');
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
ImagePanelDemoService = ImagePanelDemoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [outbound_http_service_1.OutboundHttpService,
        prisma_service_1.PrismaService,
        llm_model_config_cache_store_1.LlmModelConfigCacheStore])
], ImagePanelDemoService);
exports.ImagePanelDemoService = ImagePanelDemoService;
//# sourceMappingURL=image-panel-demo.service.js.map