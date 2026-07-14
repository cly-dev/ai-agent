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
exports.DeleteChatResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class DeleteChatResponseDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '已删除的会话 ID（32 位 hex）' }),
    __metadata("design:type", String)
], DeleteChatResponseDto.prototype, "sessionId", void 0);
exports.DeleteChatResponseDto = DeleteChatResponseDto;
//# sourceMappingURL=delete-chat-response.dto.js.map