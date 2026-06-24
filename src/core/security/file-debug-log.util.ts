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
 * 生产环境（`NODE_ENV=prod|production`）默认关闭，除非 `AGENT_ENGINE_DEBUG=1`。
 */
export function isAgentEngineDebugEnabled(): boolean {
  const explicit = readTriStateEnv('AGENT_ENGINE_DEBUG');
  if (explicit !== undefined) {
    return explicit;
  }
  return !isProductionRuntime();
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
