/**
 * Standardized error codes for the SpecCraft system
 */
export enum ErrorCode {
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Standardized error response format
 */
export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
  };
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * Create standardized error responses
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: any
): ErrorResponse {
  return {
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Map error codes to HTTP status codes
 */
export function getStatusCodeForError(code: ErrorCode): number {
  const statusMap: Record<ErrorCode, number> = {
    [ErrorCode.AUTH_REQUIRED]: 401,
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.VALIDATION_ERROR]: 400,
    [ErrorCode.QUOTA_EXCEEDED]: 429,
    [ErrorCode.RATE_LIMIT]: 429,
    [ErrorCode.INTERNAL_ERROR]: 500,
  };
  return statusMap[code] || 500;
}

/**
 * Handle errors in API routes
 */
export function handleApiError(error: unknown): {
  response: ErrorResponse;
  status: number;
} {
  if (error instanceof AppError) {
    return {
      response: error.toJSON(),
      status: error.statusCode,
    };
  }

  // Log unexpected errors
  console.error('Unexpected error:', error);

  return {
    response: createErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred'
    ),
    status: 500,
  };
}
