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
exports.ImagePanelDemoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const stitch_image_panel_dto_1 = require("./dto/stitch-image-panel.dto");
const image_panel_demo_service_1 = require("./image-panel-demo.service");
let ImagePanelDemoController = class ImagePanelDemoController {
    constructor(service) {
        this.service = service;
    }
    stitch(dto) {
        return this.service.stitch(dto);
    }
    recognize(dto) {
        return this.service.recognize(dto);
    }
};
__decorate([
    (0, common_1.Post)('stitch'),
    (0, swagger_1.ApiOperation)({
        summary: 'IMAGE_PANEL/v1 拼图 demo（返回 PNG data URL + 分阶段耗时）',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stitch_image_panel_dto_1.StitchImagePanelDto]),
    __metadata("design:returntype", void 0)
], ImagePanelDemoController.prototype, "stitch", null);
__decorate([
    (0, common_1.Post)('recognize'),
    (0, swagger_1.ApiOperation)({
        summary: '拼图后用当前启用的 chat 模型做多模态识别（需模型支持 image_url）',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stitch_image_panel_dto_1.RecognizeImagePanelDto]),
    __metadata("design:returntype", void 0)
], ImagePanelDemoController.prototype, "recognize", null);
ImagePanelDemoController = __decorate([
    (0, swagger_1.ApiTags)('dev-image-panel'),
    (0, common_1.Controller)('dev/image-panel'),
    __metadata("design:paramtypes", [image_panel_demo_service_1.ImagePanelDemoService])
], ImagePanelDemoController);
exports.ImagePanelDemoController = ImagePanelDemoController;
//# sourceMappingURL=image-panel-demo.controller.js.map