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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationService = void 0;
const common_1 = require("@nestjs/common");
const runtime_cache_invalidator_service_1 = require("../../core/runtime-cache/runtime-cache-invalidator.service");
const client_1 = require("../../../generated/prisma/client");
const pagination_1 = require("../../common/pagination");
const prisma_service_1 = require("../../prisma/prisma.service");
const outbound_http_service_1 = require("../../core/outbound-http/outbound-http.service");
const outbound_http_policy_util_1 = require("../../core/outbound-http/outbound-http.policy.util");
const outbound_http_types_1 = require("../../core/outbound-http/outbound-http.types");
const outbound_url_guard_util_1 = require("../../core/security/outbound-url-guard.util");
const integration_mapper_1 = require("./integration.mapper");
const integration_types_1 = require("./integration.types");
const CONNECTION_PROBE_TIMEOUT_MS = (0, outbound_http_policy_util_1.readIntegrationProbeTimeoutMs)();
let IntegrationService = class IntegrationService {
    constructor(prisma, runtimeCacheInvalidator, outboundHttp) {
        this.prisma = prisma;
        this.runtimeCacheInvalidator = runtimeCacheInvalidator;
        this.outboundHttp = outboundHttp;
    }
    async create(dto) {
        var _a;
        await this.assertAppClientExists(dto.appClientId);
        const name = dto.name.trim();
        const baseUrl = dto.baseUrl.trim();
        if (!name) {
            throw new common_1.BadRequestException('name is required');
        }
        if (!baseUrl) {
            throw new common_1.BadRequestException('baseUrl is required');
        }
        const row = await this.prisma.integration.create({
            data: {
                appClientId: dto.appClientId,
                name,
                baseUrl,
                apiKey: this.normalizeOptionalSecret(dto.apiKey),
                description: this.normalizeOptionalText(dto.description),
                authMode: (_a = dto.authMode) !== null && _a !== void 0 ? _a : client_1.IntegrationAuthMode.USER_PREFERRED,
            },
            include: integration_types_1.INTEGRATION_DETAIL_INCLUDE,
        });
        return (0, integration_mapper_1.toIntegrationResponse)(row);
    }
    async findPageByAppClientId(appClientId, query) {
        await this.assertAppClientExists(appClientId);
        return this.findPage(Object.assign(Object.assign({}, query), { appClientId }));
    }
    async findPage(query) {
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = this.buildWhere(query);
        const orderBy = this.buildOrderBy(query.orderBy, query.order);
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.integration.findMany({
                where,
                orderBy,
                skip,
                take,
                include: integration_types_1.INTEGRATION_DETAIL_INCLUDE,
            }),
            this.prisma.integration.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)((0, integration_mapper_1.toIntegrationResponseList)(rows), total, page, pageSize);
    }
    async findOne(id) {
        const row = await this.prisma.integration.findUnique({
            where: { id },
            include: integration_types_1.INTEGRATION_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`integration ${id} not found`);
        }
        return (0, integration_mapper_1.toIntegrationResponse)(row);
    }
    async update(id, dto) {
        var _a, _b, _c;
        const existing = await this.findOne(id);
        const appClientId = (_a = dto.appClientId) !== null && _a !== void 0 ? _a : existing.appClientId;
        if (dto.appClientId != null) {
            await this.assertAppClientExists(appClientId);
        }
        try {
            const row = await this.prisma.integration.update({
                where: { id },
                data: {
                    appClientId: dto.appClientId,
                    name: (_b = dto.name) === null || _b === void 0 ? void 0 : _b.trim(),
                    baseUrl: (_c = dto.baseUrl) === null || _c === void 0 ? void 0 : _c.trim(),
                    apiKey: dto.apiKey === undefined
                        ? undefined
                        : this.normalizeOptionalSecret(dto.apiKey),
                    description: dto.description === undefined
                        ? undefined
                        : this.normalizeOptionalText(dto.description),
                    authMode: dto.authMode,
                },
                include: integration_types_1.INTEGRATION_DETAIL_INCLUDE,
            });
            await this.runtimeCacheInvalidator.invalidateForIntegration(id);
            return (0, integration_mapper_1.toIntegrationResponse)(row);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`integration ${id} not found`);
            }
            throw error;
        }
    }
    async testConnection(options) {
        var _a;
        let baseUrl = (_a = options.baseUrl) === null || _a === void 0 ? void 0 : _a.trim();
        let apiKey = options.apiKey === undefined
            ? undefined
            : this.normalizeOptionalSecret(options.apiKey);
        if (options.id != null) {
            const row = await this.prisma.integration.findUnique({
                where: { id: options.id },
                select: { baseUrl: true, apiKey: true },
            });
            if (!row) {
                throw new common_1.NotFoundException(`integration ${options.id} not found`);
            }
            baseUrl = baseUrl || row.baseUrl.trim();
            if (options.apiKey === undefined) {
                apiKey = row.apiKey;
            }
        }
        if (!baseUrl) {
            throw new common_1.BadRequestException('baseUrl is required');
        }
        return this.probeBaseUrl(baseUrl, apiKey !== null && apiKey !== void 0 ? apiKey : null);
    }
    async remove(id) {
        await this.findOne(id);
        const relatedToolCount = await this.prisma.tool.count({
            where: { integrationId: id },
        });
        if (relatedToolCount > 0) {
            throw new common_1.BadRequestException(`integration ${id} 仍关联 ${relatedToolCount} 个 tool，请先取消关联 tool 后再删除`);
        }
        try {
            const row = await this.prisma.integration.delete({
                where: { id },
                include: integration_types_1.INTEGRATION_DETAIL_INCLUDE,
            });
            return (0, integration_mapper_1.toIntegrationResponse)(row);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2003') {
                throw new common_1.BadRequestException(`integration ${id} 仍有关联 tool，请先取消关联 tool 后再删除`);
            }
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`integration ${id} not found`);
            }
            throw error;
        }
    }
    buildWhere(query) {
        var _a, _b, _c;
        const where = {};
        if (query.id != null) {
            where.id = query.id;
        }
        if (query.appClientId != null) {
            where.appClientId = query.appClientId;
        }
        if ((_a = query.name) === null || _a === void 0 ? void 0 : _a.trim()) {
            where.name = { contains: query.name.trim(), mode: 'insensitive' };
        }
        if ((_b = query.baseUrl) === null || _b === void 0 ? void 0 : _b.trim()) {
            where.baseUrl = { contains: query.baseUrl.trim(), mode: 'insensitive' };
        }
        if (query.authMode != null) {
            where.authMode = query.authMode;
        }
        if ((_c = query.keyword) === null || _c === void 0 ? void 0 : _c.trim()) {
            const keyword = query.keyword.trim();
            where.OR = [
                { name: { contains: keyword, mode: 'insensitive' } },
                { baseUrl: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } },
            ];
        }
        return where;
    }
    buildOrderBy(orderBy, order) {
        const direction = (0, pagination_1.resolveSortOrder)(order);
        switch (orderBy !== null && orderBy !== void 0 ? orderBy : 'id') {
            case 'name':
                return { name: direction };
            case 'createdAt':
                return { createdAt: direction };
            case 'updatedAt':
                return { updatedAt: direction };
            case 'baseUrl':
                return { baseUrl: direction };
            case 'id':
            default:
                return { id: direction };
        }
    }
    async assertAppClientExists(appClientId) {
        const row = await this.prisma.appClient.findUnique({
            where: { id: appClientId },
            select: { id: true },
        });
        if (!row) {
            throw new common_1.BadRequestException(`appClient ${appClientId} not found`);
        }
    }
    normalizeOptionalSecret(value) {
        if (value == null) {
            return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    normalizeOptionalText(value) {
        if (value == null) {
            return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    async probeBaseUrl(baseUrl, apiKey) {
        const url = (0, outbound_url_guard_util_1.assertOutboundUrlAllowed)(baseUrl);
        const headers = {
            Accept: 'application/json, text/plain, */*',
            'User-Agent': 'agent-server-integration-probe/1.0',
        };
        if (apiKey) {
            headers.Authorization = apiKey.includes(' ')
                ? apiKey
                : `Bearer ${apiKey}`;
        }
        const startedAt = Date.now();
        const headResult = await this.fetchProbe(url.toString(), 'HEAD', headers);
        if (headResult.reachable) {
            return Object.assign(Object.assign({}, headResult), { durationMs: Date.now() - startedAt });
        }
        if (headResult.statusCode === 405 || headResult.statusCode === 501) {
            const getResult = await this.fetchProbe(url.toString(), 'GET', headers);
            return Object.assign(Object.assign({}, getResult), { durationMs: Date.now() - startedAt });
        }
        return Object.assign(Object.assign({}, headResult), { durationMs: Date.now() - startedAt });
    }
    async fetchProbe(url, method, headers) {
        try {
            const response = await this.outboundHttp.fetchWithPolicy(url, {
                method,
                headers,
                redirect: 'follow',
            }, {
                timeoutMs: CONNECTION_PROBE_TIMEOUT_MS,
                label: 'integration_probe',
            });
            return {
                reachable: true,
                url,
                method,
                statusCode: response.status,
                statusText: response.statusText,
            };
        }
        catch (error) {
            const message = error instanceof outbound_http_types_1.OutboundHttpError
                ? error.message
                : this.formatFetchError(error);
            return {
                reachable: false,
                url,
                method,
                error: message,
            };
        }
    }
    formatFetchError(error) {
        if (!(error instanceof Error)) {
            return String(error);
        }
        const cause = error.cause;
        if (cause instanceof Error) {
            const code = 'code' in cause && typeof cause.code === 'string' ? cause.code : '';
            return code ? `${cause.message} (${code})` : cause.message;
        }
        return error.message;
    }
};
IntegrationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        runtime_cache_invalidator_service_1.RuntimeCacheInvalidator,
        outbound_http_service_1.OutboundHttpService])
], IntegrationService);
exports.IntegrationService = IntegrationService;
//# sourceMappingURL=integration.service.js.map