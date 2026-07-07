/** PageAction run SSE 写入抽象；进程内 Hub / 未来 Redis 订阅端均实现此接口。 */
export type PageActionSseSink = {
  readonly writableEnded: boolean;
  emit(event: string, data: unknown): void;
  end(): void;
};

export type BufferedPageActionSseEvent = {
  event: string;
  data: unknown;
};
