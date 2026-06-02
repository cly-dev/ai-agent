-- 业务权限改由 UserApp.roleId → Role；移除 User.userRole 枚举列。

DROP INDEX IF EXISTS "User_userRole_idx";
ALTER TABLE "User" DROP COLUMN IF EXISTS "userRole";
DROP TYPE IF EXISTS "UserRole";
