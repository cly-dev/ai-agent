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
exports.AgentRunController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const agent_run_service_1 = require("./agent-run.service");
const create_agent_run_dto_1 = require("./dto/create-agent-run.dto");
const query_agent_run_dto_1 = require("./dto/query-agent-run.dto");
const update_agent_run_dto_1 = require("./dto/update-agent-run.dto");
let AgentRunController = class AgentRunController {
    constructor(service) {
        this.service = service;
    }
    create(appClientId, body) {
        return this.service.create(appClientId, body);
    }
    findPage(appClientId, query) {
        return this.service.findPage(appClientId, query);
    }
    getOpsMetrics(appClientId, days) {
        const parsedDays = days == null || days.trim() === '' ? 7 : Math.max(1, Number(days));
        return this.service.getOpsMetrics(appClientId, parsedDays);
    }
    findOne(appClientId, id) {
        return this.service.findOne(appClientId, id);
    }
    update(appClientId, id, body) {
        return this.service.update(appClientId, id, body);
    }
    remove(appClientId, id) {
        return this.service.remove(appClientId, id);
    }
};
__decorate([
    (0, common_1.Post)('by-app-client/:appClientId'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number, description: 'AppClient ID' }),
    (0, swagger_1.ApiOperation)({ summary: '按 AppClient 创建 AgentRun' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_agent_run_dto_1.CreateAgentRunDto]),
    __metadata("design:returntype", void 0)
], AgentRunController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('by-app-client/:appClientId'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number, description: 'AppClient ID' }),
    (0, swagger_1.ApiOperation)({ summary: '按 AppClient 分页查询 AgentRun 列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, query_agent_run_dto_1.QueryAgentRunDto]),
    __metadata("design:returntype", void 0)
], AgentRunController.prototype, "findPage", null);
__decorate([
    (0, common_1.Get)('by-app-client/:appClientId/ops-metrics'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number, description: 'AppClient ID' }),
    (0, swagger_1.ApiOperation)({ summary: '运维看板核心指标（近 N 天）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], AgentRunController.prototype, "getOpsMetrics", null);
__decorate([
    (0, common_1.Get)('by-app-client/:appClientId/:id'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number, description: 'AppClient ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number, description: 'AgentRun ID' }),
    (0, swagger_1.ApiOperation)({ summary: '按 AppClient + ID 查询 AgentRun 详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], AgentRunController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('by-app-client/:appClientId/:id'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number, description: 'AppClient ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number, description: 'AgentRun ID' }),
    (0, swagger_1.ApiOperation)({ summary: '按 AppClient + ID 更新 AgentRun' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, update_agent_run_dto_1.UpdateAgentRunDto]),
    __metadata("design:returntype", void 0)
], AgentRunController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('by-app-client/:appClientId/:id'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number, description: 'AppClient ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number, description: 'AgentRun ID' }),
    (0, swagger_1.ApiOperation)({ summary: '按 AppClient + ID 删除 AgentRun' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], AgentRunController.prototype, "remove", null);
AgentRunController = __decorate([
    (0, swagger_1.ApiTags)('agent-run'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('agent-run'),
    __metadata("design:paramtypes", [agent_run_service_1.AgentRunService])
], AgentRunController);
exports.AgentRunController = AgentRunController;
//# sourceMappingURL=agent-run.controller.js.map