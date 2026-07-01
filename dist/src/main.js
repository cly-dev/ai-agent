"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./core/env/load-env");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const path_1 = require("path");
const app_module_1 = require("./app.module");
const req_interceptor_1 = require("./interceptor/req.interceptor");
const http_exception_1 = require("./exception/http.exception");
const prisma_service_1 = require("./prisma/prisma.service");
const runtime_env_util_1 = require("./core/security/runtime-env.util");
const client_public_api_paths_1 = require("./middleware/client-public-api-paths");
const client_public_cors_util_1 = require("./middleware/client-public-cors.util");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((req, res, next) => {
        (0, client_public_cors_util_1.applyHttpCors)(req, res);
        if ((0, client_public_cors_util_1.handleHttpCorsPreflight)(req, res)) {
            return;
        }
        next();
    });
    const prisma = app.get(prisma_service_1.PrismaService);
    try {
        await prisma.$connect();
    }
    catch (error) {
        common_1.Logger.error('Database connection failed. Please check DATABASE_URL.', error);
        throw error;
    }
    if ((0, runtime_env_util_1.isDevStaticAssetsEnabled)()) {
        app.useStaticAssets((0, path_1.join)(process.cwd(), 'www'));
        common_1.Logger.log('Dev static assets enabled at /index.html (www/)');
    }
    app.useGlobalInterceptors(new req_interceptor_1.ReqInterceptor());
    app.useGlobalFilters(new http_exception_1.HttpExceptionFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.setGlobalPrefix('admin', {
        exclude: client_public_api_paths_1.CLIENT_PUBLIC_API_EXCLUDES,
    });
    if ((0, runtime_env_util_1.isSwaggerEnabled)()) {
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle('Agent Server API')
            .setDescription('API docs for Agent Server')
            .setVersion('1.0.0')
            .addBearerAuth()
            .addApiKey({
            type: 'apiKey',
            in: 'header',
            name: 'X-App-Dsn',
            description: 'AppClient DSN，用于解析接入方（须与库中 AppClient.dsn 一致）',
        }, 'app-dsn')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup('docs', app, document);
        common_1.Logger.log('Swagger docs available at http://localhost:3030/docs');
    }
    await app.listen(3030);
}
function registerProcessErrorHandlers() {
    process.on('uncaughtException', (error) => {
        var _a;
        common_1.Logger.error('Uncaught exception', (_a = error.stack) !== null && _a !== void 0 ? _a : error.message);
    });
    process.on('unhandledRejection', (reason) => {
        var _a;
        if (reason instanceof Error) {
            common_1.Logger.error('Unhandled promise rejection', (_a = reason.stack) !== null && _a !== void 0 ? _a : reason.message);
            return;
        }
        common_1.Logger.error('Unhandled promise rejection', String(reason));
    });
}
registerProcessErrorHandlers();
bootstrap().catch((error) => {
    var _a;
    if (error instanceof Error) {
        common_1.Logger.error('Application bootstrap failed', (_a = error.stack) !== null && _a !== void 0 ? _a : error.message);
    }
    else {
        common_1.Logger.error('Application bootstrap failed', String(error));
    }
    process.exit(1);
});
//# sourceMappingURL=main.js.map