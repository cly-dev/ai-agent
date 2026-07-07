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
exports.UserLlmModelConfigController = void 0;
const common_1 = require("@nestjs/common");
const user_llm_model_config_service_1 = require("./user-llm-model-config.service");
let UserLlmModelConfigController = class UserLlmModelConfigController {
    constructor(service) {
        this.service = service;
    }
};
UserLlmModelConfigController = __decorate([
    (0, common_1.Controller)('user-llm-model-config'),
    __metadata("design:paramtypes", [user_llm_model_config_service_1.UserLlmModelConfigService])
], UserLlmModelConfigController);
exports.UserLlmModelConfigController = UserLlmModelConfigController;
//# sourceMappingURL=user-llm-model-config.controller.js.map