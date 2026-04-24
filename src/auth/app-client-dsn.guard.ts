import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { APP_CLIENT_DSN_HEADER } from './app-client-dsn.constants';
import type { RequestAppClient } from './request-app-client';

/**
 * 要求请求头携带 {@link APP_CLIENT_DSN_HEADER}，校验后写入 `req.appClient`。
 */
@Injectable()
export class AppClientDsnGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const raw = req.headers[APP_CLIENT_DSN_HEADER];
    const dsn =
      typeof raw === 'string'
        ? raw.trim()
        : Array.isArray(raw)
          ? raw[0]?.trim() ?? ''
          : '';
    if (!dsn) {
      throw new UnauthorizedException(
        `missing or empty header ${APP_CLIENT_DSN_HEADER}`,
      );
    }

    const row = await this.prisma.appClient.findUnique({
      where: { dsn },
      select: { id: true, dsn: true, name: true, isActive: true },
    });
    if (!row || !row.isActive) {
      throw new UnauthorizedException('unknown or inactive app client dsn');
    }

    const appClient: RequestAppClient = {
      id: row.id,
      dsn: row.dsn,
      name: row.name,
    };
    req.appClient = appClient;
    return true;
  }
}
