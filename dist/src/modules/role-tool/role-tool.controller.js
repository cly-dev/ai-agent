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
exports.RoleToolController = void 0;
const common_1 = require("@nestjs/common");
const role_tool_service_1 = require("./role-tool.service");
let RoleToolController = class RoleToolController {
    constructor(service) {
        this.service = service;
    }
};
RoleToolController = __decorate([
    (0, common_1.Controller)('role-tool'),
    __metadata("design:paramtypes", [role_tool_service_1.RoleToolService])
], RoleToolController);
exports.RoleToolController = RoleToolController;
//# sourceMappingURL=role-tool.controller.js.map