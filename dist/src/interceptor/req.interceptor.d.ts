import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
type Response<T> = {
    data: T;
    status: number;
    message: string;
};
export declare class ReqInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<any>>;
    private shouldBypass;
}
export {};
