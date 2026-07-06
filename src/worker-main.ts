import './core/env/load-env';
import { Logger } from '@nestjs/common';
import { readHttpServerEnabled } from './core/session-run/session-run-bullmq.connection.util';
import {
  createNestApp,
  initBackgroundOnly,
  listenRuntimeHttp,
} from './bootstrap/create-nest-app.util';
import { registerProcessErrorHandlers } from './bootstrap/register-process-error-handlers.util';
import { startWorkerHealthServer } from './bootstrap/worker-health-server.util';

function applyWorkerProcessDefaults(): void {
  if (process.env.SESSION_RUN_WORKER_ENABLED == null) {
    process.env.SESSION_RUN_WORKER_ENABLED = '1';
  }
  if (process.env.SESSION_RUN_HTTP_ENABLED == null) {
    process.env.SESSION_RUN_HTTP_ENABLED = '0';
  }
}

async function bootstrap(): Promise<void> {
  applyWorkerProcessDefaults();
  const app = await createNestApp();
  if (readHttpServerEnabled()) {
    const port = Number(process.env.PORT ?? 3030);
    await listenRuntimeHttp(app, port);
    return;
  }
  await initBackgroundOnly(app, 'HTTP disabled (SESSION_RUN_HTTP_ENABLED=0)');
  startWorkerHealthServer();
}

registerProcessErrorHandlers();
bootstrap().catch((error: unknown) => {
  if (error instanceof Error) {
    Logger.error('Worker bootstrap failed', error.stack ?? error.message);
  } else {
    Logger.error('Worker bootstrap failed', String(error));
  }
  process.exit(1);
});
