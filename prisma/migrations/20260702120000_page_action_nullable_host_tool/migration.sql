-- PageAction.hostToolId: workflow-only 绑定时可为空，由 Workflow generate_and_push 节点推导
ALTER TABLE "PageAction" ALTER COLUMN "hostToolId" DROP NOT NULL;
