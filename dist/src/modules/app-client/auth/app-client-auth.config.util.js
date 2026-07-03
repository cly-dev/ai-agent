"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAppClientAuthConfig = exports.buildAppClient2AdminAuthConfig = exports.buildAgentServerAdminAuthConfig = exports.resolveAgentServerPublicUrl = exports.buildAuthConfigFromEnv = exports.parseAppClientAuthConfig = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const tokenPlacementSchema = zod_1.z.enum([
    'authorization_bearer',
    'header_x_account_token',
    'query_token',
]);
const profileFieldMappingSchema = zod_1.z
    .object({
    employeeId: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().min(1).optional(),
    username: zod_1.z.string().min(1).optional(),
    nickName: zod_1.z.string().min(1).optional(),
    cnName: zod_1.z.string().min(1).optional(),
    active: zod_1.z.string().min(1).optional(),
})
    .strict();
const httpAuthConfigSchema = zod_1.z
    .object({
    baseUrl: zod_1.z.string().url(),
    profilePath: zod_1.z.string().min(1),
    method: zod_1.z.enum(['GET', 'POST']).optional(),
    tokenPlacement: tokenPlacementSchema.optional(),
    responseRoot: zod_1.z.string().min(1).optional(),
    mapping: profileFieldMappingSchema.optional(),
    extraHeaders: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
})
    .strict();
const jwtAuthConfigSchema = zod_1.z
    .object({
    sharedSecret: zod_1.z.string().min(1),
    issuer: zod_1.z.string().min(1).optional(),
    audience: zod_1.z.string().min(1).optional(),
})
    .strict();
const authConfigSchema = zod_1.z
    .object({
    provider: zod_1.z.enum(['http_profile', 'jwt_shared_secret']),
    http: httpAuthConfigSchema.optional(),
    jwt: jwtAuthConfigSchema.optional(),
    autoBindRoleName: zod_1.z.string().min(1).optional(),
    propagateTokenToIntegrations: zod_1.z.boolean().optional(),
})
    .strict()
    .superRefine((value, ctx) => {
    if (value.provider === 'http_profile' && !value.http) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'http is required when provider is http_profile',
            path: ['http'],
        });
    }
    if (value.provider === 'jwt_shared_secret' && !value.jwt) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'jwt is required when provider is jwt_shared_secret',
            path: ['jwt'],
        });
    }
});
function formatZodIssues(error) {
    return error.issues
        .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
        return `${path}${issue.message}`;
    })
        .join('; ');
}
function parseAppClientAuthConfig(raw) {
    if (raw === null || raw === undefined) {
        return null;
    }
    const parsed = authConfigSchema.safeParse(raw);
    if (!parsed.success) {
        throw new common_1.BadRequestException(`invalid authConfig: ${formatZodIssues(parsed.error)}`);
    }
    return parsed.data;
}
exports.parseAppClientAuthConfig = parseAppClientAuthConfig;
function buildAuthConfigFromEnv() {
    var _a, _b, _c;
    const host = (_a = process.env.APP_CLIENT_HOST) === null || _a === void 0 ? void 0 : _a.trim();
    if (!host) {
        return null;
    }
    return {
        provider: 'http_profile',
        http: {
            baseUrl: host.endsWith('/') ? host.slice(0, -1) : host,
            profilePath: ((_b = process.env.APP_CLIENT_AUTH_PROFILE_PATH) === null || _b === void 0 ? void 0 : _b.trim()) ||
                '/account/seller/account/current',
            method: 'GET',
            tokenPlacement: 'authorization_bearer',
            mapping: {
                employeeId: 'employeeId',
                email: 'email',
                username: 'nickName',
                nickName: 'nickName',
                cnName: 'cnName',
                active: 'active',
            },
        },
        autoBindRoleName: ((_c = process.env.APP_CLIENT_AUTO_BIND_ROLE) === null || _c === void 0 ? void 0 : _c.trim().toLowerCase()) ||
            'operator',
        propagateTokenToIntegrations: true,
    };
}
exports.buildAuthConfigFromEnv = buildAuthConfigFromEnv;
function resolveAgentServerPublicUrl() {
    var _a, _b;
    const raw = ((_a = process.env.AGENT_SERVER_PUBLIC_URL) === null || _a === void 0 ? void 0 : _a.trim()) ||
        ((_b = process.env.APP_CLIENT_AGENT_SERVER_URL) === null || _b === void 0 ? void 0 : _b.trim()) ||
        'http://localhost:3030';
    return raw.replace(/\/+$/, '');
}
exports.resolveAgentServerPublicUrl = resolveAgentServerPublicUrl;
function buildAgentServerAdminAuthConfig(input) {
    var _a, _b, _c;
    const base = ((_a = input === null || input === void 0 ? void 0 : input.publicBaseUrl) !== null && _a !== void 0 ? _a : resolveAgentServerPublicUrl()).replace(/\/+$/, '');
    return {
        provider: 'http_profile',
        http: {
            baseUrl: `${base}/admin`,
            profilePath: '/admin-user/me',
            method: 'GET',
            tokenPlacement: 'authorization_bearer',
            mapping: {
                employeeId: 'data.employeeId',
                email: 'data.email',
                username: 'data.username',
                nickName: 'data.nickName',
                active: 'data.active',
            },
        },
        autoBindRoleName: ((_b = input === null || input === void 0 ? void 0 : input.autoBindRoleName) === null || _b === void 0 ? void 0 : _b.trim().toLowerCase()) || 'operator',
        propagateTokenToIntegrations: (_c = input === null || input === void 0 ? void 0 : input.propagateTokenToIntegrations) !== null && _c !== void 0 ? _c : false,
    };
}
exports.buildAgentServerAdminAuthConfig = buildAgentServerAdminAuthConfig;
function buildAppClient2AdminAuthConfig() {
    return buildAgentServerAdminAuthConfig();
}
exports.buildAppClient2AdminAuthConfig = buildAppClient2AdminAuthConfig;
function envFallbackAuthConfig() {
    return buildAuthConfigFromEnv();
}
function resolveAppClientAuthConfig(authConfig) {
    const parsed = parseAppClientAuthConfig(authConfig);
    if (parsed) {
        return Object.assign(Object.assign({}, withAuthDefaults(parsed)), { source: 'db' });
    }
    const fallback = envFallbackAuthConfig();
    if (!fallback) {
        throw new common_1.BadRequestException('AppClient authConfig is not configured and APP_CLIENT_HOST is unset');
    }
    return Object.assign(Object.assign({}, withAuthDefaults(fallback)), { source: 'env_fallback' });
}
exports.resolveAppClientAuthConfig = resolveAppClientAuthConfig;
function withAuthDefaults(config) {
    var _a, _b, _c, _d;
    return Object.assign(Object.assign({}, config), { autoBindRoleName: ((_a = config.autoBindRoleName) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) || 'operator', propagateTokenToIntegrations: (_b = config.propagateTokenToIntegrations) !== null && _b !== void 0 ? _b : true, http: config.provider === 'http_profile' && config.http
            ? Object.assign(Object.assign({}, config.http), { method: (_c = config.http.method) !== null && _c !== void 0 ? _c : 'GET', tokenPlacement: (_d = config.http.tokenPlacement) !== null && _d !== void 0 ? _d : 'authorization_bearer' }) : config.http });
}
//# sourceMappingURL=app-client-auth.config.util.js.map