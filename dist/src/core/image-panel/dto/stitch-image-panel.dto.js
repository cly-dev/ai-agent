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
exports.RecognizeImagePanelDto = exports.StitchImagePanelDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class StitchImagePanelDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '图片 URL 列表（http/https）；服务端会去重并最多拼 maxCells 张',
        type: [String],
        example: [
            'https://picsum.photos/seed/panel1/800/600',
            'https://picsum.photos/seed/panel2/600/900',
            'https://picsum.photos/seed/panel3/1200/800',
        ],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsUrl)({ protocols: ['http', 'https'], require_protocol: true }, { each: true }),
    __metadata("design:type", Array)
], StitchImagePanelDto.prototype, "urls", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '正方形格边长 px', default: 512 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(128),
    (0, class_validator_1.Max)(1024),
    __metadata("design:type", Number)
], StitchImagePanelDto.prototype, "cellPx", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '最多拼入格数', default: 6 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(6),
    __metadata("design:type", Number)
], StitchImagePanelDto.prototype, "maxCells", void 0);
exports.StitchImagePanelDto = StitchImagePanelDto;
class RecognizeImagePanelDto extends StitchImagePanelDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '追加给模型的业务提示（可选）',
        maxLength: 2000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], RecognizeImagePanelDto.prototype, "hint", void 0);
exports.RecognizeImagePanelDto = RecognizeImagePanelDto;
//# sourceMappingURL=stitch-image-panel.dto.js.map