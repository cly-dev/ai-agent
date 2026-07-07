import { Global, Module } from '@nestjs/common';
import { PAGE_ACTION_RUN_EVENT_BUS } from './page-action-run-event-bus.types';
import { PageActionRunStreamHub } from './page-action-run-stream.hub';

/** 进程内 run SSE 总线；拆微服务时替换 Provider 绑定即可。 */
@Global()
@Module({
  providers: [
    PageActionRunStreamHub,
    {
      provide: PAGE_ACTION_RUN_EVENT_BUS,
      useExisting: PageActionRunStreamHub,
    },
  ],
  exports: [PageActionRunStreamHub, PAGE_ACTION_RUN_EVENT_BUS],
})
export class PageActionStreamModule {}
