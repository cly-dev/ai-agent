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
exports.SessionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const session_service_1 = require("./session.service");
const create_session_dto_1 = require("./dto/create-session.dto");
const query_session_dto_1 = require("./dto/query-session.dto");
const update_session_dto_1 = require("./dto/update-session.dto");
let SessionController = class SessionController {
    constructor(service) {
        this.service = service;
    }
    create(appClientId, body) {
        return this.service.create(appClientId, body);
    }
    findPage(appClientId, query) {
        return this.service.findPage(appClientId, query);
    }
    update(appClientId, id, body) {
        return this.service.update(appClientId, id, body);
    }
    remove(appClientId, id) {
        return this.service.remove(appClientId, id);
    }
    findOne(id) {
        return this.service.findOneById(id);
    }
};
__decorate([
    (0, common_1.Post)('by-app-client/:appClientId'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number, description: 'AppClient ID' }),
    (0, swagger_1.ApiOperation)({ summary: '按 AppClient 创建 Session' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_session_dto_1.CreateSessionDto]),
    __metadata("design:returntype", void 0)
], SessionController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('by-app-client/:appClientId'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number, description: 'AppClient ID' }),
    (0, swagger_1.ApiOperation)({ summary: '按 AppClient 分页查询 Session 列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, query_session_dto_1.QuerySessionDto]),
    __metadata("design:returntype", void 0)
], SessionController.prototype, "findPage", null);
__decorate([
    (0, common_1.Patch)('by-app-client/:appClientId/:id'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number, description: 'AppClient ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Session ID' }),
    (0, swagger_1.ApiOperation)({ summary: '按 AppClient + Session ID 更新 Session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, update_session_dto_1.UpdateSessionDto]),
    __metadata("design:returntype", void 0)
], SessionController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('by-app-client/:appClientId/:id'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number, description: 'AppClient ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Session ID' }),
    (0, swagger_1.ApiOperation)({ summary: '按 AppClient + Session ID 删除 Session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], SessionController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Session ID' }),
    (0, swagger_1.ApiOperation)({ summary: '按 Session ID 查询详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SessionController.prototype, "findOne", null);
SessionController = __decorate([
    (0, swagger_1.ApiTags)('session'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('session'),
    __metadata("design:paramtypes", [session_service_1.SessionService])
], SessionController);
exports.SessionController = SessionController;
//# sourceMappingURL=session.controller.js.map