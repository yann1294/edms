import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiSuccessResponse } from './api.types';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse<unknown>> {
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
        meta: {},
      })),
    );
  }
}

