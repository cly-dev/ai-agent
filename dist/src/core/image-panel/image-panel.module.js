"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagePanelModule = void 0;
const common_1 = require("@nestjs/common");
const llm_module_1 = require("../llm/llm.module");
const image_panel_demo_controller_1 = require("./image-panel-demo.controller");
const image_panel_demo_service_1 = require("./image-panel-demo.service");
const image_panel_service_1 = require("./image-panel.service");
let ImagePanelModule = class ImagePanelModule {
};
ImagePanelModule = __decorate([
    (0, common_1.Module)({
        imports: [llm_module_1.LlmModule],
        controllers: [image_panel_demo_controller_1.ImagePanelDemoController],
        providers: [image_panel_service_1.ImagePanelService, image_panel_demo_service_1.ImagePanelDemoService],
        exports: [image_panel_service_1.ImagePanelService],
    })
], ImagePanelModule);
exports.ImagePanelModule = ImagePanelModule;
//# sourceMappingURL=image-panel.module.js.map