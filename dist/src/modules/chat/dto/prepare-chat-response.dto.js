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
exports.PrepareChatResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class PrepareChatResponseDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '会话 ID（32 位 hex）' }),
    __metadata("design:type", String)
], PrepareChatResponseDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否完成预热' }),
    __metadata("design:type", Boolean)
], PrepareChatResponseDto.prototype, "prepared", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Agent runtime 是否已加载' }),
    __metadata("design:type", Boolean)
], PrepareChatResponseDto.prototype, "agentReady", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限内可用工具数量' }),
    __metadata("design:type", Number)
], PrepareChatResponseDto.prototype, "toolsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Agent 关联且角色可见的 Skill 数量' }),
    __metadata("design:type", Number)
], PrepareChatResponseDto.prototype, "skillsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '当前页面预热的 HostTool 数量（无 page 时为 0）' }),
    __metadata("design:type", Number)
], PrepareChatResponseDto.prototype, "hostToolsCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '本次预热对应的 HostPage.scope',
        nullable: true,
    }),
    __metadata("design:type", String)
], PrepareChatResponseDto.prototype, "pageScope", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '会话历史 context 是否已写入 Redis' }),
    __metadata("design:type", Boolean)
], PrepareChatResponseDto.prototype, "sessionContextWarmed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '预热完成时间（ISO 8601）' }),
    __metadata("design:type", String)
], PrepareChatResponseDto.prototype, "warmedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '会话运行快照是否命中 Redis（revision 一致）' }),
    __metadata("design:type", Boolean)
], PrepareChatResponseDto.prototype, "fromCache", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '运行快照 revision（调试用）' }),
    __metadata("design:type", Object)
], PrepareChatResponseDto.prototype, "revision", void 0);
exports.PrepareChatResponseDto = PrepareChatResponseDto;
//# sourceMappingURL=prepare-chat-response.dto.js.map