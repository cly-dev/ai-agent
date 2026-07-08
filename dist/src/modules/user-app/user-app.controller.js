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
exports.UserAppController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_app_service_1 = require("./user-app.service");
const add_user_to_app_dto_1 = require("./dto/add-user-to-app.dto");
const create_user_app_dto_1 = require("./dto/create-user-app.dto");
const update_user_app_dto_1 = require("./dto/update-user-app.dto");
let UserAppController = class UserAppController {
    constructor(service) {
        this.service = service;
    }
    create(body) {
        return this.service.create(body);
    }
    addUser(appId, body) {
        return this.service.addUser(appId, body);
    }
    findAll() {
        return this.service.findAll();
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, body) {
        return this.service.update(id, body);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建用户应用关系' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_app_dto_1.CreateUserAppDto]),
    __metadata("design:returntype", void 0)
], UserAppController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('app/:appId/users'),
    (0, swagger_1.ApiOperation)({ summary: '向应用添加用户' }),
    (0, swagger_1.ApiParam)({ name: 'appId', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '添加成功' }),
    __param(0, (0, common_1.Param)('appId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, add_user_to_app_dto_1.AddUserToAppDto]),
    __metadata("design:returntype", void 0)
], UserAppController.prototype, "addUser", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '查询用户应用关系列表' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UserAppController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 查询用户应用关系' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], UserAppController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 更新用户应用关系' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_user_app_dto_1.UpdateUserAppDto]),
    __metadata("design:returntype", void 0)
], UserAppController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 删除用户应用关系' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], UserAppController.prototype, "remove", null);
UserAppController = __decorate([
    (0, swagger_1.ApiTags)('user-app'),
    (0, common_1.Controller)('user-app'),
    __metadata("design:paramtypes", [user_app_service_1.UserAppService])
], UserAppController);
exports.UserAppController = UserAppController;
//# sourceMappingURL=user-app.controller.js.map