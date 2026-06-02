-- 用户身份/权限由 UserApp.roleId → Role 表达；移除 User.userType。

DROP INDEX IF EXISTS "User_userType_idx";
ALTER TABLE "User" DROP COLUMN IF EXISTS "userType";
DROP TYPE IF EXISTS "UserType";
