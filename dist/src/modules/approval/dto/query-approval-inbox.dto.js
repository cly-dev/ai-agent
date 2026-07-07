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
exports.QueryApprovalInboxDto = exports.APPROVAL_INBOX_STATUS_FILTERS = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const approval_inbox_status_util_1 = require("../../../core/approval/approval-inbox-status.util");
Object.defineProperty(exports, "APPROVAL_INBOX_STATUS_FILTERS", { enumerable: true, get: function () { return approval_inbox_status_util_1.APPROVAL_INBOX_STATUS_FILTERS; } });
class QueryApprovalInboxDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: approval_inbox_status_util_1.APPROVAL_INBOX_STATUS_FILTERS,
        default: 'pending',
        description: 'pending=待审批（默认）；approved/rejected=已决策；decided=全部已处理；all=全部状态',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([...approval_inbox_status_util_1.APPROVAL_INBOX_STATUS_FILTERS]),
    __metadata("design:type", String)
], QueryApprovalInboxDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryApprovalInboxDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], QueryApprovalInboxDto.prototype, "offset", void 0);
exports.QueryApprovalInboxDto = QueryApprovalInboxDto;
//# sourceMappingURL=query-approval-inbox.dto.js.map