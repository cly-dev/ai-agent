"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolEngineModule = void 0;
const common_1 = require("@nestjs/common");
const outbound_http_module_1 = require("../outbound-http/outbound-http.module");
const tool_engine_service_1 = require("./tool-engine.service");
let ToolEngineModule = class ToolEngineModule {
};
ToolEngineModule = __decorate([
    (0, common_1.Module)({
        imports: [outbound_http_module_1.OutboundHttpModule],
        providers: [tool_engine_service_1.ToolEngineService],
        exports: [tool_engine_service_1.ToolEngineService],
    })
], ToolEngineModule);
exports.ToolEngineModule = ToolEngineModule;
//# sourceMappingURL=tool-engine.module.js.map