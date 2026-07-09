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
exports.UserModelConfigService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let UserModelConfigService = class UserModelConfigService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        var _a, _b, _c, _d, _e;
        const provider = (_a = data.provider) === null || _a === void 0 ? void 0 : _a.trim();
        const model = (_b = data.model) === null || _b === void 0 ? void 0 : _b.trim();
        const apiKey = (_c = data.apiKey) === null || _c === void 0 ? void 0 : _c.trim();
        const baseUrl = (_d = data.baseUrl) === null || _d === void 0 ? void 0 : _d.trim();
        if (!provider || !model || !apiKey) {
            throw new common_1.BadRequestException('provider, model and apiKey are required');
        }
        return this.prisma.userLlmModelConfig.create({
            data: {
                userId: data.userId,
                provider,
                model,
                apiKey,
                baseUrl,
                temperature: data.temperature,
                maxTokens: data.maxTokens,
                enabled: (_e = data.enabled) !== null && _e !== void 0 ? _e : true,
            },
        });
    }
    async findAll() {
        return this.prisma.userLlmModelConfig.findMany({
            orderBy: { id: 'asc' },
        });
    }
    async findByUser(userId) {
        return this.prisma.userLlmModelConfig.findMany({
            where: { userId },
            orderBy: { id: 'asc' },
        });
    }
    async findOne(id) {
        const record = await this.prisma.userLlmModelConfig.findUnique({
            where: { id },
        });
        if (!record) {
            throw new common_1.NotFoundException(`model config ${id} not found`);
        }
        return record;
    }
    async update(id, data) {
        var _a, _b, _c;
        const provider = (_a = data.provider) === null || _a === void 0 ? void 0 : _a.trim();
        const model = (_b = data.model) === null || _b === void 0 ? void 0 : _b.trim();
        const apiKey = (_c = data.apiKey) === null || _c === void 0 ? void 0 : _c.trim();
        const baseUrl = typeof data.baseUrl === 'string' ? data.baseUrl.trim() : data.baseUrl;
        if (provider !== undefined && !provider) {
            throw new common_1.BadRequestException('provider cannot be empty');
        }
        if (model !== undefined && !model) {
            throw new common_1.BadRequestException('model cannot be empty');
        }
        if (apiKey !== undefined && !apiKey) {
            throw new common_1.BadRequestException('apiKey cannot be empty');
        }
        if (baseUrl !== undefined && baseUrl !== null && !baseUrl) {
            throw new common_1.BadRequestException('baseUrl cannot be empty');
        }
        try {
            return await this.prisma.userLlmModelConfig.update({
                where: { id },
                data: {
                    provider,
                    model,
                    apiKey,
                    baseUrl,
                    temperature: data.temperature,
                    maxTokens: data.maxTokens,
                    enabled: data.enabled,
                },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`model config ${id} not found`);
            }
            throw error;
        }
    }
    async remove(id) {
        try {
            return await this.prisma.userLlmModelConfig.delete({
                where: { id },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`model config ${id} not found`);
            }
            throw error;
        }
    }
};
UserModelConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserModelConfigService);
exports.UserModelConfigService = UserModelConfigService;
//# sourceMappingURL=user-model-config.service.js.map