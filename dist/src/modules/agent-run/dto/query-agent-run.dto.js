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
exports.AGENT_RUN_ORDER_BY_FIELDS = exports.QueryAgentRunDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("../../../../generated/prisma/client");
const pagination_1 = require("../../../common/pagination");
const AGENT_RUN_ORDER_BY_FIELDS = [
    'id',
    'sequence',
    'createdAt',
    'updatedAt',
    'startedAt',
    'finishedAt',
    'durationMs',
    'totalTokens',
];
exports.AGENT_RUN_ORDER_BY_FIELDS = AGENT_RUN_ORDER_BY_FIELDS;
class QueryAgentRunDto extends pagination_1.PaginationQueryDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'AgentRun ID（精确）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryAgentRunDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'MessageTurn ID（精确）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryAgentRunDto.prototype, "turnId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Agent ID（精确）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryAgentRunDto.prototype, "agentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Session ID（精确）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAgentRunDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User ID（精确）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryAgentRunDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '运行角色', enum: client_1.AgentRunRole }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.AgentRunRole),
    __metadata("design:type", String)
], QueryAgentRunDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '运行状态', enum: client_1.AgentRunStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.AgentRunStatus),
    __metadata("design:type", String)
], QueryAgentRunDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '输入内容（模糊，忽略大小写）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAgentRunDto.prototype, "input", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '关键词：匹配 input / output / error' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAgentRunDto.prototype, "keyword", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '工具 low 质量最小次数（基于 toolsUsed.qualityCounts.low）',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], QueryAgentRunDto.prototype, "minLowQualityCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '排序字段',
        enum: AGENT_RUN_ORDER_BY_FIELDS,
        default: 'id',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(AGENT_RUN_ORDER_BY_FIELDS),
    __metadata("design:type", String)
], QueryAgentRunDto.prototype, "orderBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '排序方向',
        enum: ['asc', 'desc'],
        default: 'desc',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['asc', 'desc']),
    __metadata("design:type", String)
], QueryAgentRunDto.prototype, "order", void 0);
exports.QueryAgentRunDto = QueryAgentRunDto;
//# sourceMappingURL=query-agent-run.dto.js.map