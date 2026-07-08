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
exports.PrepareChatDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const page_context_fields_dto_1 = require("./page-context-fields.dto");
class PrepareChatDto extends page_context_fields_dto_1.PageContextMessageFieldsDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '与 pageContext 等价；若同时存在以 pageContext 为准',
        deprecated: true,
    }),
    __metadata("design:type", String)
], PrepareChatDto.prototype, "page", void 0);
exports.PrepareChatDto = PrepareChatDto;
//# sourceMappingURL=prepare-chat.dto.js.map