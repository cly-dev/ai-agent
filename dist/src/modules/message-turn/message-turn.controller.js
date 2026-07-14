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
exports.MessageTurnController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const query_message_turn_dto_1 = require("./dto/query-message-turn.dto");
const message_turn_service_1 = require("./message-turn.service");
let MessageTurnController = class MessageTurnController {
    constructor(service) {
        this.service = service;
    }
    findPage(query) {
        return this.service.findPage(query);
    }
    findPageBySessionId(sessionId, query) {
        return this.service.findPageBySessionId(sessionId, query);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
};
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '分页查询 MessageTurn 列表',
        description: '支持分页与字段筛选。每条记录返回 agentRuns（含 agent）、primaryAgent、session、user、appClient 关联。',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_message_turn_dto_1.QueryMessageTurnDto]),
    __metadata("design:returntype", void 0)
], MessageTurnController.prototype, "findPage", null);
__decorate([
    (0, common_1.Get)('by-session/:sessionId'),
    (0, swagger_1.ApiParam)({ name: 'sessionId', type: String }),
    (0, swagger_1.ApiOperation)({ summary: '按 Session ID 分页查询 MessageTurn 列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_message_turn_dto_1.QueryMessageTurnDto]),
    __metadata("design:returntype", void 0)
], MessageTurnController.prototype, "findPageBySessionId", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 查询 MessageTurn' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MessageTurnController.prototype, "findOne", null);
MessageTurnController = __decorate([
    (0, swagger_1.ApiTags)('message-turn'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('message-turn'),
    __metadata("design:paramtypes", [message_turn_service_1.MessageTurnService])
], MessageTurnController);
exports.MessageTurnController = MessageTurnController;
//# sourceMappingURL=message-turn.controller.js.map