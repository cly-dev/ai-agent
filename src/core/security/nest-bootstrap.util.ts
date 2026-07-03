import { ConsoleLogger, type LogLevel } from '@nestjs/common';
import { isProductionRuntime } from './runtime-env.util';

const PRODUCTION_LOG_LEVELS: LogLevel[] = ['error', 'warn'];

/** 生产环境仅 error/warn，不输出 Nest 启动 banner 与 log 级噪音。 */
export function resolveNestBootstrapLogger():
  | ConsoleLogger
  | LogLevel[]
  | undefined {
  if (!isProductionRuntime()) {
    return undefined;
  }
  return new ConsoleLogger('AgentServer', {
    logLevels: PRODUCTION_LOG_LEVELS,
  });
}

export function logStartupInfo(message: string): void {
  if (isProductionRuntime()) {
    return;
  }
  new ConsoleLogger('Bootstrap').log(message);
}
