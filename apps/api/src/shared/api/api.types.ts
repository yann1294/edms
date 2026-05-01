export type ApiSuccessResponse<TData> = {
  success: true;
  data: TData;
  meta: Record<string, unknown>;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

