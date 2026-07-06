/** Monorepo 部署单元与默认端口（本地开发）。 */
export const OMNIX_SERVICES = {
  /** B 端 Admin + 配置中心：Agent/Tool/Skill/Workflow/User/Role/Approval/LLM 配置 */
  api: { name: 'omnix-api', port: 3020 },
  /** C 端运行面：Chat / Session / SSE / AgentRun 发起 */
  runtime: { name: 'omnix-runtime', port: 3030 },
  /** 异步执行器：BullMQ + LangGraph / Workflow */
  worker: { name: 'omnix-worker', port: 3031 },
  /** 页面侧：PageAction / PageAgent LLM Proxy */
  page: { name: 'omnix-page', port: 3040 },
  /** 迁移期单体；业务代码暂留仓库根目录 src/ */
  agentServerLegacy: { name: '@omnix/agent-server', port: 3030 },
} as const;

export type OmnixServiceKey = keyof typeof OMNIX_SERVICES;

/** 当前建议的独立部署单元（legacy 迁移完成后为 api + runtime + worker + page）。 */
export const OMNIX_DEPLOYMENT_UNITS = [
  'api',
  'runtime',
  'worker',
  'page',
] as const;

export type OmnixDeploymentUnit = (typeof OMNIX_DEPLOYMENT_UNITS)[number];
