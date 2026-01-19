export enum ErrorCode {
  NETWORK_ERROR = "NETWORK_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  CONFLICT = "CONFLICT",
  RATE_LIMITED = "RATE_LIMITED",
  SERVER_ERROR = "SERVER_ERROR",
  PERSISTENCE_ERROR = "PERSISTENCE_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  NOT_IMPLEMENTED = "NOT_IMPLEMENTED",
}

export interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  cause?: Error;
  context?: Record<string, unknown>;
  recoverable?: boolean;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly context?: Record<string, unknown>;
  public readonly recoverable: boolean;
  public readonly timestamp: string;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = "AppError";
    this.code = options.code;
    this.context = options.context;
    this.recoverable = options.recoverable ?? true;
    this.timestamp = new Date().toISOString();

    if (options.cause) {
      this.cause = options.cause;
    }

    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  static network(message: string, cause?: Error): AppError {
    return new AppError({
      code: ErrorCode.NETWORK_ERROR,
      message,
      cause,
      recoverable: true,
    });
  }

  static validation(message: string, context?: Record<string, unknown>): AppError {
    return new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message,
      context,
      recoverable: true,
    });
  }

  static notFound(resource: string): AppError {
    return new AppError({
      code: ErrorCode.NOT_FOUND,
      message: `${resource} not found`,
      context: { resource },
      recoverable: false,
    });
  }

  static unauthorized(message = "Authentication required"): AppError {
    return new AppError({
      code: ErrorCode.UNAUTHORIZED,
      message,
      recoverable: true,
    });
  }

  static forbidden(message = "Access denied"): AppError {
    return new AppError({
      code: ErrorCode.FORBIDDEN,
      message,
      recoverable: false,
    });
  }

  static persistence(operation: string, key: string, cause?: Error): AppError {
    return new AppError({
      code: ErrorCode.PERSISTENCE_ERROR,
      message: `Failed to ${operation} data`,
      context: { operation, key },
      cause,
      recoverable: true,
    });
  }

  static server(message = "Server error occurred"): AppError {
    return new AppError({
      code: ErrorCode.SERVER_ERROR,
      message,
      recoverable: true,
    });
  }

  static fromUnknown(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError({
        code: ErrorCode.UNKNOWN_ERROR,
        message: error.message,
        cause: error,
      });
    }

    return new AppError({
      code: ErrorCode.UNKNOWN_ERROR,
      message: String(error),
    });
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function logError(error: unknown, context?: Record<string, unknown>): void {
  const appError = error instanceof AppError ? error : AppError.fromUnknown(error);
  
  console.error("[AppError]", {
    ...appError.toJSON(),
    additionalContext: context,
  });
}
