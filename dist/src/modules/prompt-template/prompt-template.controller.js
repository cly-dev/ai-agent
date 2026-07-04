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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptTemplateController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const create_prompt_template_version_dto_1 = require("./dto/create-prompt-template-version.dto");
const query_prompt_template_dto_1 = require("./dto/query-prompt-template.dto");
const update_prompt_template_dto_1 = require("./dto/update-prompt-template.dto");
const prompt_template_service_1 = require("./prompt-template.service");
let PromptTemplateController = class PromptTemplateController {
    constructor(service) {
        this.service = service;
    }
    listCreatableKeys() {
        return this.service.listCreatableKeys();
    }
    findPage(query) {
        return this.service.findPage(query);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    createVersion(body) {
        return this.service.createVersion(body);
    }
    update(id, body) {
        return this.service.update(id, body);
    }
    publish(id) {
        return this.service.publish(id);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
__decorate([
    (0, common_1.Get)('keys'),
    (0, swagger_1.ApiOperation)({ summary: '可新建版本的系统 key 列表（不可自定义 key）' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PromptTemplateController.prototype, "listCreatableKeys", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '分页查询提示词模板（含历史版本）' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_prompt_template_dto_1.QueryPromptTemplateDto]),
    __metadata("design:returntype", void 0)
], PromptTemplateController.prototype, "findPage", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 查询提示词模板' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PromptTemplateController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '新建提示词版本（可选 publish 立即发布）' }),
    (0, swagger_1.ApiResponse)({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_prompt_template_version_dto_1.CreatePromptTemplateVersionDto]),
    __metadata("design:returntype", void 0)
], PromptTemplateController.prototype, "createVersion", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '编辑提示词版本',
        description: '可改 content / title / description / category；不可改 key、作用域与版本。已启用版本保存后立即同步 Redis',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_prompt_template_dto_1.UpdatePromptTemplateDto]),
    __metadata("design:returntype", void 0)
], PromptTemplateController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    (0, swagger_1.ApiOperation)({ summary: '发布指定版本（同 key/作用域 仅一条 active）' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PromptTemplateController.prototype, "publish", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '删除提示词版本',
        description: '仅可删除未启用（isActive=false）的历史版本；同一 key+作用域至少保留一条版本',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PromptTemplateController.prototype, "remove", null);
PromptTemplateController = __decorate([
    (0, swagger_1.ApiTags)('prompt-template'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('prompt-template'),
    __metadata("design:paramtypes", [prompt_template_service_1.PromptTemplateService])
], PromptTemplateController);
exports.PromptTemplateController = PromptTemplateController;
//# sourceMappingURL=prompt-template.controller.js.map