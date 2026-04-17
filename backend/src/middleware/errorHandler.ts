import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import type { ApiErrorBody } from '../types.js'

/**
 * Handles unknown server errors and returns a stable JSON shape for frontend rendering.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response<ApiErrorBody>,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.issues.map((issue) => issue.message).join(', '),
      },
    })
    return
  }

  if (error instanceof Error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    })
    return
  }

  res.status(500).json({
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
    },
  })
}
