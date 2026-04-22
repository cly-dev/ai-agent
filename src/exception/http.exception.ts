import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
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

      res.status(200).send({
        status,
        data,
        message,
      });
    } catch {
      res.status(200).send({
        status: 500,
        data: null,
        message: 'system busy',
      });
    }
  }
}
