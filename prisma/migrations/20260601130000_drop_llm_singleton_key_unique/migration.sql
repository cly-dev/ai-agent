-- 允许多条配置共存（按 kind 唯一）；embedding 行不再占用 singletonKey=1
ALTER TABLE "LlmModelConfig" DROP CONSTRAINT IF EXISTS "LlmModelConfig_singletonKey_key";
