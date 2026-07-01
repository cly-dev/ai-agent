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
exports.SessionRunStateResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
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
exports.SessionRunStateResponseDto = SessionRunStateResponseDto;
//# sourceMappingURL=session-run-state.dto.js.map