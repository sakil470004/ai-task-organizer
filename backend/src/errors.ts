/**
 * AppError carries status and machine-readable code for safe API responses.
 */
export class AppError extends Error {
  statusCode: number
  code: string

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
  }
}

/**
 * Type guard for robustly detecting AppError in middleware.
 */
export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof AppError ||
    (typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      'code' in error &&
      'message' in error)
  )
}
