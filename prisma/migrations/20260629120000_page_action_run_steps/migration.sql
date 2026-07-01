-- PageActionRun: 运行步骤审计 + generation（C 端 SSE 去重）
ALTER TABLE "PageActionRun" ADD COLUMN "steps" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "PageActionRun" ADD COLUMN "generation" INTEGER NOT NULL DEFAULT 1;
