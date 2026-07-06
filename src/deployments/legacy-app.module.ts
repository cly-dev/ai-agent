import { Module } from '@nestjs/common';
import { RuntimeAppModule } from './runtime-app.module';
import { WorkerAppModule } from './worker-app.module';

/**
 * Legacy 单体：Runtime HTTP + Worker 消费同进程（src/main.ts）。
 * 等价于 RuntimeAppModule + WorkerAppModule 的能力合集；保留全量模块以免本地 dev 行为变化。
 */
@Module({
  imports: [RuntimeAppModule, WorkerAppModule],
})
export class LegacyAppModule {}
