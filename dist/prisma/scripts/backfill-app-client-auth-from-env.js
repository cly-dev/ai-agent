"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../../src/core/env/load-env");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const client_1 = require("../../generated/prisma/client");
const app_client_auth_config_util_1 = require("../../src/modules/app-client/auth/app-client-auth.config.util");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is required');
}
const adapter = new adapter_pg_1.PrismaPg(new pg_1.Pool({ connectionString }));
const prisma = new client_1.PrismaClient({ adapter });
function parseAppClientId() {
    var _a, _b, _c;
    const raw = (_b = (_a = process.argv[2]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : (_c = process.env.APP_CLIENT_BACKFILL_ID) === null || _c === void 0 ? void 0 : _c.trim();
    if (!raw) {
        throw new Error('usage: ts-node prisma/scripts/backfill-app-client-auth-from-env.ts <appClientId>');
    }
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error('appClientId must be a positive integer');
    }
    return id;
}
async function main() {
    const appClientId = parseAppClientId();
    const authConfig = (0, app_client_auth_config_util_1.buildAuthConfigFromEnv)();
    if (!authConfig) {
        throw new Error('APP_CLIENT_HOST is not set; cannot build authConfig from env');
    }
    const existing = await prisma.appClient.findUnique({
        where: { id: appClientId },
        select: { id: true, name: true, authConfig: true },
    });
    if (!existing) {
        throw new Error(`appClient ${appClientId} not found`);
    }
    if (existing.authConfig !== null) {
        console.log(`skip appClient ${appClientId} (${existing.name}): authConfig already set`);
        return;
    }
    const updated = await prisma.appClient.update({
        where: { id: appClientId },
        data: { authConfig },
        select: { id: true, name: true, authConfig: true },
    });
    console.log(`updated appClient ${updated.id} (${updated.name}) authConfig from env`);
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
//# sourceMappingURL=backfill-app-client-auth-from-env.js.map