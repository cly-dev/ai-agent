import './core/env/load-env';
import { Logger } from '@nestjs/common';
import { readHttpServerEnabled } from './core/session-run/session-run-bullmq.connection.util';
import {
  createNestApp,
  initBackgroundOnly,
  listenRuntimeHttp,
} from './bootstrap/create-nest-app.util';
import { registerProcessErrorHandlers } from './bootstrap/register-process-error-handlers.util';

/** Legacy 单体入口：本地默认 HTTP + Worker 同进程；生产请用 runtime-main / worker-main。 */
async function bootstrap(): Promise<void> {
  const app = await createNestApp();
  if (readHttpServerEnabled()) {
    await listenRuntimeHttp(app, Number(process.env.PORT ?? 3030));
    return;
  }
  await initBackgroundOnly(
    app,
    'HTTP disabled (SESSION_RUN_HTTP_ENABLED=0); BullMQ worker / background only',
  );
}

registerProcessErrorHandlers();
bootstrap().catch((error: unknown) => {
  if (error instanceof Error) {
    Logger.error('Application bootstrap failed', error.stack ?? error.message);
  } else {
    Logger.error('Application bootstrap failed', String(error));
  }
  process.exit(1);
});
