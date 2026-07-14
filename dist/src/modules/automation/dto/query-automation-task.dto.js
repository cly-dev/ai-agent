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
exports.QueryAutomationTaskDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const automation_types_1 = require("../automation.types");
class QueryAutomationTaskDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: automation_types_1.AUTOMATION_TASK_STATUSES,
        default: 'active',
        description: 'active=running+awaiting_approval；all=全部终态与进行中',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([...automation_types_1.AUTOMATION_TASK_STATUSES]),
    __metadata("design:type", String)
], QueryAutomationTaskDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: automation_types_1.AUTOMATION_TRIGGER_SOURCES,
        default: 'all',
        description: 'v1：webhook 返回空列表',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([...automation_types_1.AUTOMATION_TRIGGER_SOURCES]),
    __metadata("design:type", String)
], QueryAutomationTaskDto.prototype, "triggerSource", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '仅过滤 page_action 的 actionKey' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAutomationTaskDto.prototype, "actionKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '按 workflowKey 过滤' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAutomationTaskDto.prototype, "workflowKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryAutomationTaskDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], QueryAutomationTaskDto.prototype, "offset", void 0);
exports.QueryAutomationTaskDto = QueryAutomationTaskDto;
//# sourceMappingURL=query-automation-task.dto.js.map