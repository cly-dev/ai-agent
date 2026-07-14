import { isFalsyEnv, isProductionRuntime, isTruthyEnv } from './runtime-env.util';

function readTriStateEnv(name: string): boolean | undefined {
  const value = process.env[name]?.trim().toLowerCase();
  if (isFalsyEnv(value)) {
    return false;
  }
  if (isTruthyEnv(value)) {
    return true;
  }
  return undefined;
}

/**
 * Agent 引擎调试（控制台 + 非生产默认可开）。
 * 生产环境（`NODE_ENV=prod|production`）一律关闭。
 */
export function isAgentEngineDebugEnabled(): boolean {
  if (isProductionRuntime()) {
    return false;
  }
  const explicit = readTriStateEnv('AGENT_ENGINE_DEBUG');
  if (explicit !== undefined) {
    return explicit;
  }
  return true;
}

/**
 * 是否允许向 `logs/` 目录写入调试文件。
 * 生产环境一律关闭（即使 `AGENT_ENGINE_DEBUG=1`）。
 */
export function isFileDebugLogEnabled(): boolean {
  if (isProductionRuntime()) {
    return false;
  }
  return isAgentEngineDebugEnabled();
}

/** Tool Engine HTTP 调试文件；生产一律关闭。 */
export function isToolEngineFileDebugEnabled(): boolean {
  if (isProductionRuntime()) {
    return false;
  }
  const explicit = readTriStateEnv('TOOL_ENGINE_DEBUG');
  if (explicit !== undefined) {
    return explicit;
  }
  return isAgentEngineDebugEnabled();
}

/** Workflow / LangGraph V2 追溯；生产一律关闭。 */
export function isWorkflowDebugEnabled(): boolean {
  if (isProductionRuntime()) {
    return false;
  }
  const explicit = readTriStateEnv('WORKFLOW_DEBUG');
  if (explicit !== undefined) {
    return explicit;
  }
  return isAgentEngineDebugEnabled();
}

/** 是否写入 `logs/workflow/`；生产一律关闭。 */
export function isWorkflowFileDebugEnabled(): boolean {
  if (isProductionRuntime()) {
    return false;
  }
  return isWorkflowDebugEnabled();
}

/**
 * PageAction 运行调试（控制台 + 文件）。
 * 生产一律关闭；非生产默认开，可用 `PAGE_ACTION_DEBUG=0` 关掉。
 */
export function isPageActionRunDebugEnabled(): boolean {
  if (isProductionRuntime()) {
    return false;
  }
  const explicit = readTriStateEnv('PAGE_ACTION_DEBUG');
  if (explicit !== undefined) {
    return explicit;
  }
  // 与 fill 调试同默认：非生产开；也可被 PAGE_ACTION_FILL_DEBUG=0 连带关掉
  const fillExplicit = readTriStateEnv('PAGE_ACTION_FILL_DEBUG');
  if (fillExplicit === false) {
    return false;
  }
  return true;
}

/** 是否写入 `logs/page-action/`；生产一律关闭。 */
export function isPageActionRunFileDebugEnabled(): boolean {
  if (isProductionRuntime()) {
    return false;
  }
  return isPageActionRunDebugEnabled();
}
