import 'dotenv/config';
import { randomBytes, scryptSync } from 'crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AdminRole, PrismaClient } from '../../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg(new Pool({ connectionString }));
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function columnExists(tableName: string, columnName: string) {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = ${tableName}
        AND column_name = ${columnName}
    ) AS "exists";
  `;
  return rows[0]?.exists === true;
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
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@qq.com';
  const adminUsername = process.env.ADMIN_USERNAME ?? 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD ?? '12345789';

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      username: adminUsername,
      password: hashPassword(adminPassword),
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      email: adminEmail,
      username: adminUsername,
      password: hashPassword(adminPassword),
      role: AdminRole.SUPER_ADMIN,
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
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
