"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateToolDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_tool_dto_1 = require("./create-tool.dto");
class UpdateToolDto extends (0, swagger_1.PartialType)(create_tool_dto_1.CreateToolDto) {
}
exports.UpdateToolDto = UpdateToolDto;
//# sourceMappingURL=update-tool.dto.js.map