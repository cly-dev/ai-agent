import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  applyClientPublicCors,
  shouldApplyClientPublicCors,
} from '../middleware/client-public-cors.util';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    try {
      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'system busy';
      let data: unknown = null;

      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        data = exceptionResponse;

        if (typeof exceptionResponse === 'string') {
          message = exceptionResponse;
        } else if (typeof exceptionResponse === 'object' && exceptionResponse) {
          const rawMessage = (
            exceptionResponse as { message?: string | string[] }
          ).message;
          if (Array.isArray(rawMessage) && rawMessage.length > 0) {
            message = rawMessage[0];
          } else if (typeof rawMessage === 'string') {
            message = rawMessage;
          }
        }
      }

      this.logException(exception, req, status, message);

      if (shouldApplyClientPublicCors(req)) {
        applyClientPublicCors(req, res);
      }

      res.status(200).send({
        status,
        data,
        message,
      });
    } catch (filterError) {
      this.logger.error(
        `Exception filter failed: ${req.method} ${req.originalUrl ?? req.url}`,
        filterError instanceof Error ? filterError.stack : String(filterError),
      );
      if (shouldApplyClientPublicCors(req)) {
        applyClientPublicCors(req, res);
      }
      res.status(200).send({
        status: 500,
        data: null,
        message: 'system busy',
      });
    }
  }

  private logException(
    exception: unknown,
    req: Request,
    status: number,
    message: string,
  ): void {
    const method = req.method;
    const path = req.originalUrl ?? req.url;
    const prefix = `${method} ${path} -> ${status} ${message}`;

    if (exception instanceof HttpException && status < 500) {
      this.logger.warn(prefix);
      return;
    }

    if (exception instanceof Error) {
      this.logger.error(prefix, exception.stack);
      return;
    }

    this.logger.error(prefix, String(exception));
  }
}
