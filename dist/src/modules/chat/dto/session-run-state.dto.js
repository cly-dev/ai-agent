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
exports.SessionRunStateResponseDto = exports.PendingWriteGatePublicStateDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const write_draft_public_dto_1 = require("../../../common/dto/write-draft-public.dto");
class PendingWriteGatePublicStateDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '挂起时的 Agent Run ID' }),
    __metadata("design:type", Number)
], PendingWriteGatePublicStateDto.prototype, "runId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '本轮对话 turn ID' }),
    __metadata("design:type", Number)
], PendingWriteGatePublicStateDto.prototype, "turnId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '已消耗的重试次数' }),
    __metadata("design:type", Number)
], PendingWriteGatePublicStateDto.prototype, "draftRetryCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '重试上限' }),
    __metadata("design:type", Number)
], PendingWriteGatePublicStateDto.prototype, "draftRetryMax", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否仍可发起 retry' }),
    __metadata("design:type", Boolean)
], PendingWriteGatePublicStateDto.prototype, "canRetry", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: write_draft_public_dto_1.WriteDraftPublicDto,
        description: '主写草稿（机器层真值，arguments 为执行依据）',
    }),
    __metadata("design:type", write_draft_public_dto_1.WriteDraftPublicDto)
], PendingWriteGatePublicStateDto.prototype, "writeDraft", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [write_draft_public_dto_1.WriteDraftPublicDto],
        description: '多写工具时全部草稿（含 writeDraft 本身）',
    }),
    __metadata("design:type", Array)
], PendingWriteGatePublicStateDto.prototype, "writeDrafts", void 0);
exports.PendingWriteGatePublicStateDto = PendingWriteGatePublicStateDto;
class SessionRunStateResponseDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '当前 session generation；前端应用作 sessionGeneration',
    }),
    __metadata("design:type", Number)
], SessionRunStateResponseDto.prototype, "generation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        nullable: true,
        description: '正在执行的 runId；本实例 active 优先，否则 Redis active 快照',
    }),
    __metadata("design:type", Number)
], SessionRunStateResponseDto.prototype, "activeRunId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        nullable: true,
        description: 'active run 对应 turnId',
    }),
    __metadata("design:type", Number)
], SessionRunStateResponseDto.prototype, "activeTurnId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '排队 job 数（本实例内存队列 + Redis 队列）',
    }),
    __metadata("design:type", Number)
], SessionRunStateResponseDto.prototype, "pendingJobCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'generation / 队列 / SSE 中继是否由 Redis 支撑（生产环境应为 true）',
    }),
    __metadata("design:type", Boolean)
], SessionRunStateResponseDto.prototype, "redisBacked", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        nullable: true,
        type: PendingWriteGatePublicStateDto,
        description: '挂起中的 Chat 写确认门（含 writeDraft）；无 gate 时为 null。页面刷新时可与 SSE 重放互补使用。',
    }),
    __metadata("design:type", PendingWriteGatePublicStateDto)
], SessionRunStateResponseDto.prototype, "pendingWriteGate", void 0);
exports.SessionRunStateResponseDto = SessionRunStateResponseDto;
//# sourceMappingURL=session-run-state.dto.js.map