import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * C 端 chat / message 对外接口跨域。
 * SSE（EventSource）可能携带 Last-Event-ID；浏览器预检需暴露常用头。
 */
@Injectable()
export class ChatPublicCorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const origin = req.headers.origin;
    if (typeof origin === 'string' && origin.length > 0) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader(
      'Access-Control-Allow-Headers',
      [
        'Content-Type',
        'Authorization',
        'X-App-Dsn',
        'X-Account-Token',
        'Accept',
        'Accept-Language',
        'Cache-Control',
        'Last-Event-ID',
      ].join(', '),
    );
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  }
}
