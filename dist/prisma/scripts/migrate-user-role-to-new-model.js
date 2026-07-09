"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../../src/core/env/load-env");
const crypto_1 = require("crypto");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const client_1 = require("../../generated/prisma/client");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is required');
}
const adapter = new adapter_pg_1.PrismaPg(new pg_1.Pool({ connectionString }));
const prisma = new client_1.PrismaClient({ adapter });
function hashPassword(password) {
    const salt = (0, crypto_1.randomBytes)(16).toString('hex');
    const hash = (0, crypto_1.scryptSync)(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}
async function columnExists(tableName, columnName) {
    var _a;
    const rows = await prisma.$queryRaw `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = ${tableName}
        AND column_name = ${columnName}
    ) AS "exists";
  `;
    return ((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.exists) === true;
}
async function migrateLegacyUserRoleData() {
    const hasLegacyRoleId = await columnExists('User', 'roleId');
    if (!hasLegacyRoleId) {
        return;
    }
    await prisma.$executeRawUnsafe(`
    UPDATE "User" u
    SET
      "userType" = CASE
        WHEN r.name IN ('admin', 'operator', 'viewer') THEN 'B_END'::"UserType"
        ELSE 'C_END'::"UserType"
      END,
      "userRole" = CASE
        WHEN r.name = 'admin' THEN 'OPERATOR'::"UserRole"
        WHEN r.name = 'operator' THEN 'OPERATOR'::"UserRole"
        WHEN r.name = 'viewer' THEN 'CUSTOMER_SERVICE'::"UserRole"
        ELSE 'C_END_USER'::"UserRole"
      END
    FROM "role" r
    WHERE u."roleId" = r.id;
  `);
    await prisma.$executeRawUnsafe(`
    UPDATE "User"
    SET
      "userType" = COALESCE("userType", 'C_END'::"UserType"),
      "userRole" = COALESCE("userRole", 'C_END_USER'::"UserRole");
  `);
}
async function seedDefaultAdminUser() {
    var _a, _b, _c;
    const adminEmail = (_a = process.env.ADMIN_EMAIL) !== null && _a !== void 0 ? _a : 'admin@qq.com';
    const adminUsername = (_b = process.env.ADMIN_USERNAME) !== null && _b !== void 0 ? _b : 'admin';
    const adminPassword = (_c = process.env.ADMIN_PASSWORD) !== null && _c !== void 0 ? _c : '12345789';
    await prisma.adminUser.upsert({
        where: { email: adminEmail },
        update: {
            username: adminUsername,
            password: hashPassword(adminPassword),
            role: client_1.AdminRole.SUPER_ADMIN,
            isActive: true,
            mustChangePassword: false,
        },
        create: {
            email: adminEmail,
            username: adminUsername,
            password: hashPassword(adminPassword),
            role: client_1.AdminRole.SUPER_ADMIN,
            isActive: true,
            mustChangePassword: false,
        },
    });
}
async function seedUserRoleToolFromLegacyRoleSkill() {
    await prisma.$executeRawUnsafe(`
    INSERT INTO "UserRoleTool" ("userRole", "toolId")
    SELECT DISTINCT
      CASE
        WHEN r.name = 'admin' THEN 'OPERATOR'::"UserRole"
        WHEN r.name = 'operator' THEN 'OPERATOR'::"UserRole"
        WHEN r.name = 'viewer' THEN 'CUSTOMER_SERVICE'::"UserRole"
        ELSE 'C_END_USER'::"UserRole"
      END AS "userRole",
      st."toolId"
    FROM "role" r
    JOIN "roleskill" rs ON rs."roleId" = r.id
    JOIN "SkillTool" st ON st."skillId" = rs."skillId"
    ON CONFLICT ("userRole", "toolId") DO NOTHING;
  `);
}
async function main() {
    await migrateLegacyUserRoleData();
    await seedDefaultAdminUser();
    await seedUserRoleToolFromLegacyRoleSkill();
}
main()
    .catch(async (error) => {
    await prisma.$disconnect();
    throw error;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=migrate-user-role-to-new-model.js.map