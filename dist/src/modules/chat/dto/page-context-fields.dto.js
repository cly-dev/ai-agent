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
exports.PageContextMessageFieldsDto = exports.AgentChatPageContextDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class AgentChatPageContextDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '业务页面标识，与 host_action.scope 对齐',
        example: 'entity-detail',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], AgentChatPageContextDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '当前路由路径' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], AgentChatPageContextDto.prototype, "routePath", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '路由动态参数，如 { entityId: "43689" }',
        example: { entityId: '43689' },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], AgentChatPageContextDto.prototype, "routeParams", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '流程 ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AgentChatPageContextDto.prototype, "flowId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '程序/站点名称' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], AgentChatPageContextDto.prototype, "programName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '页面主实体，如 { type: "order", id: "123" }',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], AgentChatPageContextDto.prototype, "entity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '额外小字段（Tab、筛选等）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], AgentChatPageContextDto.prototype, "metadata", void 0);
exports.AgentChatPageContextDto = AgentChatPageContextDto;
class PageContextMessageFieldsDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '嵌套页面上下文（推荐后端优先读取）',
        type: AgentChatPageContextDto,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AgentChatPageContextDto),
    __metadata("design:type", AgentChatPageContextDto)
], PageContextMessageFieldsDto.prototype, "pageContext", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '平铺：page，与 pageContext.page 相同' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], PageContextMessageFieldsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '平铺：routePath' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], PageContextMessageFieldsDto.prototype, "routePath", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '平铺：routeParams' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PageContextMessageFieldsDto.prototype, "routeParams", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '平铺：flowId' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], PageContextMessageFieldsDto.prototype, "flowId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '平铺：programName' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], PageContextMessageFieldsDto.prototype, "programName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '平铺：entity' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PageContextMessageFieldsDto.prototype, "entity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '平铺：metadata' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PageContextMessageFieldsDto.prototype, "metadata", void 0);
exports.PageContextMessageFieldsDto = PageContextMessageFieldsDto;
//# sourceMappingURL=page-context-fields.dto.js.map