import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUBSCRIPTION_REQUIRED'
  | 'PLAN_LIMIT_REACHED'
  | 'INTERNAL_ERROR'

export function apiError(
  message: string,
  code: ErrorCode,
  status: number,
  details?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code,
      ...(details && { details }),
    },
    { status }
  )
}

export function validationError(error: ZodError): NextResponse {
  const fieldErrors: Record<string, string> = {}

  for (const issue of error.issues) {
    const field = issue.path.join('.')
    if (!fieldErrors[field]) {
      fieldErrors[field] = issue.message
    }
  }

  return apiError('Validation failed', 'VALIDATION_ERROR', 400, fieldErrors)
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public status: number
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleRouteError(error: unknown, context: string): NextResponse {
  if (error instanceof AppError) {
    return apiError(error.message, error.code, error.status)
  }

  console.error(`[${context}]`, error)

  return apiError(
    'An unexpected error occurred',
    'INTERNAL_ERROR',
    500
  )
}
