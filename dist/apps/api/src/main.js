"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const protocol_1 = require("@omnix/protocol");
const app_module_1 = require("./app.module");
async function bootstrap() {
    var _a;
    const service = protocol_1.OMNIX_SERVICES.api;
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const port = Number((_a = process.env.PORT) !== null && _a !== void 0 ? _a : service.port);
    await app.listen(port);
    common_1.Logger.log(`${service.name} listening on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
//# sourceMappingURL=main.js.map