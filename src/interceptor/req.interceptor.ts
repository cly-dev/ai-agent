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
}
