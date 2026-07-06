import { createServer, type Server } from 'node:http';
import { Logger } from '@nestjs/common';

/** Worker 进程轻量 /health（不启动完整 Nest HTTP / admin 路由）。 */
export function startWorkerHealthServer(input?: {
  port?: number;
  serviceName?: string;
}): Server {
  const port = input?.port ?? Number(process.env.WORKER_HEALTH_PORT ?? 3031);
  const serviceName = input?.serviceName ?? 'omnix-worker';
  const server = createServer((req, res) => {
    if (req.url === '/health' || req.url === '/health/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: true,
          service: serviceName,
          port,
          role: 'bullmq_langgraph_executor',
        }),
      );
      return;
    }
    res.writeHead(404);
    res.end();
  });
  server.listen(port, () => {
    Logger.log(
      `${serviceName} health listening on http://localhost:${port}/health`,
      'Bootstrap',
    );
  });
  return server;
}
