"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../../src/core/env/load-env");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const client_1 = require("../../generated/prisma/client");
const app_client_auth_config_util_1 = require("../../src/modules/app-client/auth/app-client-auth.config.util");
const DEFAULT_APP_CLIENT_ID = 2;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is required');
}
const adapter = new adapter_pg_1.PrismaPg(new pg_1.Pool({ connectionString }));
const prisma = new client_1.PrismaClient({ adapter });
function parseCliArgs() {
    var _a, _b, _c, _d;
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const positional = args.filter((arg) => !arg.startsWith('-'));
    const raw = (_d = (_b = (_a = positional[0]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : (_c = process.env.APP_CLIENT_ADMIN_AUTH_ID) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : String(DEFAULT_APP_CLIENT_ID);
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error('appClientId must be a positive integer (usage: npm run db:configure-app-client-2-auth -- [--force] | npm run db:configure-app-client-2-auth -- <id> [--force])');
    }
    return { appClientId: id, force };
}
async function main() {
    const { appClientId, force } = parseCliArgs();
    const authConfig = (0, app_client_auth_config_util_1.buildAppClient2AdminAuthConfig)();
    const publicUrl = (0, app_client_auth_config_util_1.resolveAgentServerPublicUrl)();
    const existing = await prisma.appClient.findUnique({
        where: { id: appClientId },
        select: { id: true, name: true, dsn: true, authConfig: true },
    });
    if (!existing) {
        throw new Error(`appClient ${appClientId} not found`);
    }
    if (existing.authConfig !== null && !force) {
        console.log(`skip appClient ${appClientId} (${existing.name}): authConfig already set; pass --force to overwrite`);
        return;
    }
    const updated = await prisma.appClient.update({
        where: { id: appClientId },
        data: { authConfig },
        select: { id: true, name: true, dsn: true, authConfig: true },
    });
    console.log(`updated appClient ${updated.id} (${updated.name}) authConfig for admin B-end`);
    console.log(`publicUrl=${publicUrl}`);
    console.log(`profile=${publicUrl}/admin/admin-user/me`);
    console.log(`dsn=${updated.dsn}`);
    console.log(JSON.stringify(updated.authConfig, null, 2));
}
main()
    .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=configure-app-client-2-admin-auth.js.map