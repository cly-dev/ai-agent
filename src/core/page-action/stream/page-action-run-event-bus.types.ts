import type { Response } from 'express';
import type { PageActionSseSink } from './page-action-sse-sink.types';

/**
 * PageAction run 事件总线契约。
 * v1：进程内 Hub；拆微服务后可换 Redis/NATS 实现，执行器与 C 端 API 仅依赖此接口。
 */
export interface PageActionRunEventBus {
  /** invoke 时预建 session，避免客户端早于 executor 订阅时断流。 */
  prepareSession(runId: number): void;

  /** 为一次执行阶段打开可写 sink（缓冲 + fan-out，writer.end 为 no-op）。 */
  openWriter(runId: number): PageActionSseSink;

  /** C 端订阅：重放缓冲 + 挂接实时 fan-out；session 已 close 时重放后结束。 */
  attachSubscriber(runId: number, res: Response): void;

  /** 结束当前执行阶段的 fan-out（保留缓冲供晚加入重放）。 */
  closeSession(runId: number): void;

  hasActiveSession(runId: number): boolean;

  hasSession(runId: number): boolean;
}

export const PAGE_ACTION_RUN_EVENT_BUS = Symbol('PAGE_ACTION_RUN_EVENT_BUS');
