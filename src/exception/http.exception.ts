import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    try {
      const status = exception.getStatus();
      if (status !== 200) {
        const exceptionResponse = exception.getResponse();
        let message = 'request failed';

        if (typeof exceptionResponse === 'string') {
          message = exceptionResponse;
        } else if (
          typeof exceptionResponse === 'object' &&
          exceptionResponse !== null
        ) {
          const rawMessage = (
            exceptionResponse as { message?: string | string[] }
          ).message;
          if (Array.isArray(rawMessage) && rawMessage.length > 0) {
            message = rawMessage[0];
          } else if (typeof rawMessage === 'string') {
            message = rawMessage;
          }
        }

        res.status(200).send({
          status,
          data: exception.stack,
          message,
        });
      }
    } catch {
      res.status(500).send({
        status: 500,
        message: 'system busy',
      });
    }
  }
}
