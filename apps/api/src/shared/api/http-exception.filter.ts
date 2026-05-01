import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiErrorResponse } from './api.types';

function codeForStatus(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'VALIDATION_ERROR';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHENTICATED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'RESOURCE_NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'RATE_LIMITED';
    default:
      return 'INTERNAL_ERROR';
  }
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const extractedMessage =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : typeof exceptionResponse === 'object' && exceptionResponse !== null
          ? ((exceptionResponse as any).message ?? (exception as any).message)
          : (exception as any)?.message;

    const message =
      typeof extractedMessage === 'string'
        ? extractedMessage
        : Array.isArray(extractedMessage)
          ? 'Validation error'
          : 'Internal server error';

    const details: Record<string, unknown> = {};
    if (status === HttpStatus.BAD_REQUEST && Array.isArray(extractedMessage)) {
      details.validationErrors = extractedMessage;
    }

    const payload: ApiErrorResponse = {
      success: false,
      error: {
        code: codeForStatus(status),
        message,
        ...(Object.keys(details).length > 0 ? { details } : {}),
      },
    };

    response.status(status).json(payload);
  }
}
