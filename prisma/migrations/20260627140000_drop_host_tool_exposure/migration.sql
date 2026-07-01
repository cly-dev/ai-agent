-- Drop HostTool.exposure: availability is governed by Agent/Skill bindings and isActive.
ALTER TABLE "HostTool" DROP COLUMN "exposure";

DROP TYPE "HostToolExposure";
