"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../core/env/load-env");
const fs = require("fs");
const path = require("path");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const client_1 = require("../../generated/prisma/client");
const swagger_tool_import_core_1 = require("./swagger-tool-import.core");
const tool_path_filter_util_1 = require("./tool-path-filter.util");
function parseArgs(argv) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
    const getArgValue = (flag) => {
        const index = argv.indexOf(flag);
        if (index >= 0 && index < argv.length - 1) {
            return argv[index + 1];
        }
        return undefined;
    };
    const parseCsv = (value) => {
        if (!value) {
            return new Set();
        }
        return new Set(value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean));
    };
    const integrationIdValue = (_a = getArgValue('--integration-id')) !== null && _a !== void 0 ? _a : process.env.GEN_TOOL_INTEGRATION_ID;
    const envAutoIntegration = (_b = process.env.GEN_TOOL_AUTO_INTEGRATION) !== null && _b !== void 0 ? _b : '';
    const autoIntegration = argv.includes('--no-auto-integration')
        ? false
        : /^false$/i.test(envAutoIntegration)
            ? false
            : argv.includes('--auto-integration') ||
                envAutoIntegration === '' ||
                envAutoIntegration === '1' ||
                /^true$/i.test(envAutoIntegration);
    let integrationId = null;
    if (integrationIdValue) {
        const parsed = Number(integrationIdValue);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new Error('integration id must be a positive integer');
        }
        integrationId = parsed;
    }
    const appClientIdValue = (_c = getArgValue('--app-client-id')) !== null && _c !== void 0 ? _c : process.env.GEN_TOOL_APP_CLIENT_ID;
    let appClientId = null;
    if (appClientIdValue) {
        const parsed = Number(appClientIdValue);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new Error('app-client-id must be a positive integer');
        }
        appClientId = parsed;
    }
    if (!autoIntegration && integrationId === null) {
        throw new Error('integration id is required. use --integration-id <number> or enable --auto-integration');
    }
    const agentIdValue = (_d = getArgValue('--agent-id')) !== null && _d !== void 0 ? _d : process.env.GEN_TOOL_AGENT_ID;
    let agentId = null;
    if (agentIdValue) {
        const parsed = Number(agentIdValue);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new Error('agent-id must be a positive integer');
        }
        agentId = parsed;
    }
    const dryRun = argv.includes('--dry-run');
    const apply = argv.includes('--apply');
    if (!dryRun && !apply) {
        throw new Error('choose one mode: --dry-run or --apply');
    }
    if (dryRun && apply) {
        throw new Error('cannot use --dry-run and --apply together');
    }
    const insecure = argv.includes('--insecure') ||
        process.env.GEN_TOOL_INSECURE === '1' ||
        /^true$/i.test((_e = process.env.GEN_TOOL_INSECURE) !== null && _e !== void 0 ? _e : '');
    return {
        specPath: (_f = getArgValue('--spec-path')) !== null && _f !== void 0 ? _f : process.env.GEN_TOOL_SPEC_PATH,
        specUrl: (_h = (_g = getArgValue('--spec-url')) !== null && _g !== void 0 ? _g : process.env.GEN_TOOL_SPEC_URL) !== null && _h !== void 0 ? _h : swagger_tool_import_core_1.DEFAULT_SWAGGER_SPEC_URL,
        outputPath: (_k = (_j = getArgValue('--output')) !== null && _j !== void 0 ? _j : process.env.GEN_TOOL_OUTPUT) !== null && _k !== void 0 ? _k : 'tmp/generated-tools.json',
        integrationId,
        appClientId,
        agentId,
        autoIntegration,
        integrationName: (_l = getArgValue('--integration-name')) !== null && _l !== void 0 ? _l : process.env.GEN_TOOL_INTEGRATION_NAME,
        integrationBaseUrl: (_m = getArgValue('--integration-base-url')) !== null && _m !== void 0 ? _m : process.env.GEN_TOOL_INTEGRATION_BASE_URL,
        integrationApiKey: (_p = (_o = getArgValue('--integration-api-key')) !== null && _o !== void 0 ? _o : process.env.GEN_TOOL_INTEGRATION_API_KEY) !== null && _p !== void 0 ? _p : '',
        integrationAuthMode: (0, swagger_tool_import_core_1.resolveIntegrationAuthMode)((_q = getArgValue('--integration-auth-mode')) !== null && _q !== void 0 ? _q : process.env.GEN_TOOL_INTEGRATION_AUTH_MODE),
        dryRun,
        apply,
        insecure,
        tags: parseCsv((_r = getArgValue('--tags')) !== null && _r !== void 0 ? _r : process.env.GEN_TOOL_TAGS),
        ops: parseCsv((_s = getArgValue('--ops')) !== null && _s !== void 0 ? _s : process.env.GEN_TOOL_OPS),
        pathInclude: parseCsv((_t = getArgValue('--path-include')) !== null && _t !== void 0 ? _t : process.env.GEN_TOOL_PATH_INCLUDE),
        pathExclude: parseCsv((_u = getArgValue('--path-exclude')) !== null && _u !== void 0 ? _u : process.env.GEN_TOOL_PATH_EXCLUDE),
        noDefaultPathExclude: argv.includes('--no-default-path-exclude') ||
            process.env.GEN_TOOL_NO_DEFAULT_PATH_EXCLUDE === '1' ||
            /^true$/i.test((_v = process.env.GEN_TOOL_NO_DEFAULT_PATH_EXCLUDE) !== null && _v !== void 0 ? _v : ''),
    };
}
async function run() {
    const parsed = parseArgs(process.argv.slice(2));
    const { outputPath } = parsed, options = __rest(parsed, ["outputPath"]);
    if (!options.specPath && process.stdin.isTTY && process.stdout.isTTY) {
        options.specUrl = await (0, swagger_tool_import_core_1.promptSwaggerSpecUrl)(options.specUrl);
    }
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL is required');
    }
    const adapter = new adapter_pg_1.PrismaPg(new pg_1.Pool({ connectionString }));
    const prisma = new client_1.PrismaClient({ adapter });
    try {
        const spec = await (0, swagger_tool_import_core_1.loadOpenApiSpec)(options);
        const resolvedIntegrationId = await (0, swagger_tool_import_core_1.resolveIntegrationId)(prisma, options, spec);
        const integration = await prisma.integration.findUnique({
            where: { id: resolvedIntegrationId },
            select: { appClientId: true },
        });
        if (!integration) {
            throw new Error(`integration ${resolvedIntegrationId} not found`);
        }
        const targetAgentId = await (0, swagger_tool_import_core_1.resolveTargetAgentId)(prisma, options, integration.appClientId, 'interactive');
        const pathFilter = (0, tool_path_filter_util_1.buildPathFilter)({
            include: options.pathInclude,
            exclude: options.pathExclude,
            useDefaultExclude: !options.noDefaultPathExclude,
        });
        const operations = (0, swagger_tool_import_core_1.listOperations)(spec, pathFilter);
        const selectedKeys = await (0, swagger_tool_import_core_1.resolveSelectedOperationKeys)(options, operations, 'interactive');
        const drafts = (0, swagger_tool_import_core_1.buildToolDrafts)(spec, pathFilter, selectedKeys, resolvedIntegrationId);
        if (drafts.length === 0) {
            throw new Error('no operations matched filters');
        }
        const outputFullPath = path.resolve(process.cwd(), outputPath);
        fs.mkdirSync(path.dirname(outputFullPath), { recursive: true });
        fs.writeFileSync(outputFullPath, JSON.stringify(drafts, null, 2), 'utf-8');
        if (options.apply) {
            await (0, swagger_tool_import_core_1.applyTools)(prisma, drafts, targetAgentId);
        }
        console.log(`path filter: include=[${pathFilter.include.join(', ') || '*'}] exclude=[${pathFilter.exclude.join(', ')}]`);
        console.log(`integration id: ${resolvedIntegrationId}`);
        if (targetAgentId !== null) {
            console.log(`bound tools to agent id: ${targetAgentId}`);
        }
        console.log(`generated ${drafts.length} tools -> ${outputFullPath}`);
        console.log(options.apply ? 'database upsert completed' : 'dry-run only');
    }
    finally {
        await prisma.$disconnect();
    }
}
run().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=swagger-tool-cli.js.map