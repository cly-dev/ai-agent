"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initBackgroundOnly = exports.listenRuntimeHttp = exports.createNestApp = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const path_1 = require("path");
const app_module_1 = require("../app.module");
const req_interceptor_1 = require("../interceptor/req.interceptor");
const http_exception_1 = require("../exception/http.exception");
const prisma_service_1 = require("../prisma/prisma.service");
const runtime_env_util_1 = require("../core/security/runtime-env.util");
const nest_bootstrap_util_1 = require("../core/security/nest-bootstrap.util");
const client_public_api_paths_1 = require("../middleware/client-public-api-paths");
const client_public_cors_util_1 = require("../middleware/client-public-cors.util");
async function createNestApp() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: (0, nest_bootstrap_util_1.resolveNestBootstrapLogger)(),
        bufferLogs: true,
    });
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
        (0, nest_bootstrap_util_1.logStartupInfo)('Dev static assets enabled at /index.html (www/)');
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
        (0, nest_bootstrap_util_1.logStartupInfo)('Swagger docs available at http://localhost:3030/docs');
    }
    return app;
}
exports.createNestApp = createNestApp;
async function listenRuntimeHttp(app, port = 3030) {
    await app.listen(port);
    (0, nest_bootstrap_util_1.logStartupInfo)(`HTTP server listening on http://localhost:${port}`);
}
exports.listenRuntimeHttp = listenRuntimeHttp;
async function initBackgroundOnly(app, label) {
    await app.init();
    (0, nest_bootstrap_util_1.logStartupInfo)(`${label}; BullMQ worker / background only`);
}
exports.initBackgroundOnly = initBackgroundOnly;
//# sourceMappingURL=create-nest-app.util.js.map