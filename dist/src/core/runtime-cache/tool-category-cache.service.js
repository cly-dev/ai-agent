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
exports.ToolCategoryCacheService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const runtime_cache_constants_1 = require("./runtime-cache.constants");
let ToolCategoryCacheService = class ToolCategoryCacheService {
    constructor(prisma) {
        this.prisma = prisma;
        this.cache = new Map();
    }
    async fetchByIds(toolCategoryIds) {
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
            expiresAt: Date.now() + (0, runtime_cache_constants_1.getRunScopeCacheTtlMs)(),
        });
        this.prune();
        return rows;
    }
    clearAll() {
        this.cache.clear();
    }
    prune() {
        const now = Date.now();
        for (const [key, entry] of this.cache) {
            if (entry.expiresAt <= now) {
                this.cache.delete(key);
            }
        }
        while (this.cache.size > runtime_cache_constants_1.MAX_RUN_SCOPE_CACHE_ENTRIES) {
            const first = this.cache.keys().next().value;
            if (first === undefined) {
                break;
            }
            this.cache.delete(first);
        }
    }
};
ToolCategoryCacheService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ToolCategoryCacheService);
exports.ToolCategoryCacheService = ToolCategoryCacheService;
//# sourceMappingURL=tool-category-cache.service.js.map