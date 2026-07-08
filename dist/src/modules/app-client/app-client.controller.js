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
exports.AppClientController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const swagger_1 = require("@nestjs/swagger");
const app_client_dsn_guard_1 = require("../../auth/app-client-dsn.guard");
const app_client_dsn_constants_1 = require("../../auth/app-client-dsn.constants");
const auth_throttle_constants_1 = require("../../auth/auth-throttle.constants");
const app_client_service_1 = require("./app-client.service");
const create_app_client_dto_1 = require("./dto/create-app-client.dto");
const update_app_client_dto_1 = require("./dto/update-app-client.dto");
const test_app_client_auth_dto_1 = require("./dto/test-app-client-auth.dto");
let AppClientController = class AppClientController {
    constructor(service) {
        this.service = service;
    }
    appClientId(req) {
        var _a;
        const id = (_a = req.appClient) === null || _a === void 0 ? void 0 : _a.id;
        if (id === undefined) {
            throw new common_1.UnauthorizedException('missing app client context');
        }
        return id;
    }
    authenticate(req) {
        var _a, _b;
        const raw = req.headers['x-account-token'];
        let accountToken = '';
        if (typeof raw === 'string') {
            accountToken = raw.trim();
        }
        else if (Array.isArray(raw)) {
            accountToken = (_b = (_a = raw[0]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
        }
        return this.service.authenticate(this.appClientId(req), accountToken, req.appClient);
    }
    create(body) {
        return this.service.create(body);
    }
    findAll() {
        return this.service.findAll();
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    testAuth(id, body) {
        return this.service.testAuth(id, body.accountToken);
    }
    update(id, body) {
        return this.service.update(id, body);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
__decorate([
    (0, common_1.Post)('auth'),
    (0, throttler_1.Throttle)(auth_throttle_constants_1.AUTH_THROTTLE_LIMIT, auth_throttle_constants_1.AUTH_THROTTLE_TTL_SECONDS),
    (0, common_1.UseGuards)(app_client_dsn_guard_1.AppClientDsnGuard),
    (0, swagger_1.ApiOperation)({ summary: '前台 DSN 认证' }),
    (0, swagger_1.ApiSecurity)('app-dsn'),
    (0, swagger_1.ApiHeader)({
        name: app_client_dsn_constants_1.APP_CLIENT_DSN_HEADER,
        description: '业务方 DSN',
        required: true,
    }),
    (0, swagger_1.ApiHeader)({
        name: 'x-account-token',
        description: '业务系统账号 token（必填）；外部账号校验通过后自动建档 User，并在无 UserApp 时绑定当前 App（默认 operator 角色）',
        required: true,
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '认证成功，返回本系统 accessToken 与用户信息',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'token 无效或账号未激活',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppClientController.prototype, "authenticate", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '管理员创建业务 AppClient' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_app_client_dto_1.CreateAppClientDto]),
    __metadata("design:returntype", void 0)
], AppClientController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '管理员查询 AppClient 列表' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppClientController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '管理员按 ID 查询 AppClient' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AppClientController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/auth/test'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: '测试 AppClient 外部账号鉴权配置',
        description: '使用指定 accountToken 调用当前 App 的 authConfig（或环境变量回退），仅返回解析后的账号信息，不建档、不签发 JWT。',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, test_app_client_auth_dto_1.TestAppClientAuthDto]),
    __metadata("design:returntype", void 0)
], AppClientController.prototype, "testAuth", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '管理员按 ID 更新 AppClient' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_app_client_dto_1.UpdateAppClientDto]),
    __metadata("design:returntype", void 0)
], AppClientController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: '管理员按 ID 删除 AppClient',
        description: '若仍有关联（Agent、Tool、Integration、Skill、UserApp、Session 等）则返回 400，需先清理子资源',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '存在关联数据，无法删除' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AppClientController.prototype, "remove", null);
AppClientController = __decorate([
    (0, swagger_1.ApiTags)('admin-app-client'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('/app-client'),
    __metadata("design:paramtypes", [app_client_service_1.AppClientService])
], AppClientController);
exports.AppClientController = AppClientController;
//# sourceMappingURL=app-client.controller.js.map