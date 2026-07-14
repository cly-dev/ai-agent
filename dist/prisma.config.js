"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const dotenv_1 = require("dotenv");
const config_1 = require("prisma/config");
const root = process.cwd();
function bootstrapPrismaEnv() {
    var _a, _b, _c;
    if ((_a = process.env.DATABASE_URL) === null || _a === void 0 ? void 0 : _a.trim()) {
        return;
    }
    const nodeEnv = (_b = process.env.NODE_ENV) === null || _b === void 0 ? void 0 : _b.trim().toLowerCase();
    const envFile = nodeEnv === 'test'
        ? '.env.test'
        : nodeEnv === 'prod' || nodeEnv === 'production'
            ? '.env.prod'
            : null;
    for (const name of [envFile, '.env']) {
        if (!name) {
            continue;
        }
        const envPath = (0, node_path_1.join)(root, name);
        if ((0, node_fs_1.existsSync)(envPath)) {
            (0, dotenv_1.config)({ path: envPath });
            if ((_c = process.env.DATABASE_URL) === null || _c === void 0 ? void 0 : _c.trim()) {
                return;
            }
        }
    }
}
bootstrapPrismaEnv();
exports.default = (0, config_1.defineConfig)({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        url: process.env.DATABASE_URL,
    },
});
//# sourceMappingURL=prisma.config.js.map