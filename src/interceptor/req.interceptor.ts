import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

type Response<T> = {
  data: T;
  status: number;
  message: string;
};

//响应拦截器
@Injectable()
export class ReqInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<any>> {
    if (this.shouldBypass(context)) {
      return next.handle();
    }
    return next.handle().pipe(
      map((data) => {
        return {
          data,
          status: 200,
          message: 'success',
        };
      }),
    );
  }

  /** SSE / 流式响应不能被包成 { data, status, message }，否则客户端收不到事件。 */
  private shouldBypass(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return false;
    }
    const req = context.switchToHttp().getRequest<{
      url?: string;
      headers?: { accept?: string | string[] };
    }>();
    const path = (req.url ?? '').split('?')[0];
    if (path.endsWith('/stream')) {
      return true;
    }
    const accept = req.headers?.accept;
    if (typeof accept === 'string' && accept.includes('text/event-stream')) {
      return true;
    }
    if (Array.isArray(accept) && accept.some((v) => v.includes('text/event-stream'))) {
      return true;
    }
    return false;
  }
}
