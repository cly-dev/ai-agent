"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillToolModule = void 0;
const common_1 = require("@nestjs/common");
const skill_tool_service_1 = require("./skill-tool.service");
const skill_tool_controller_1 = require("./skill-tool.controller");
let SkillToolModule = class SkillToolModule {
};
SkillToolModule = __decorate([
    (0, common_1.Module)({
        providers: [skill_tool_service_1.SkillToolService],
        controllers: [skill_tool_controller_1.SkillToolController],
        exports: [skill_tool_service_1.SkillToolService],
    })
], SkillToolModule);
exports.SkillToolModule = SkillToolModule;
//# sourceMappingURL=skill-tool.module.js.map