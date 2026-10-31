import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod Validation Error
  if (error instanceof ZodError) {
    const details = error.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details,
      },
    });
    return;
  }

  // AppError
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  // Mongoose duplicate key error (code 11000)
  const anyError = error as { code?: number; keyPattern?: Record<string, number> };
  if (anyError?.code === 11000) {
    const fields = anyError.keyPattern ? Object.keys(anyError.keyPattern).join(", ") : "resource";
    res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_ENTRY",
        message: `A duplicate entry already exists for: ${fields}`,
      },
    });
    return;
  }

  // Unhandled error
  const message =
    env.NODE_ENV === "production"
      ? "An unexpected internal server error occurred"
      : error instanceof Error
      ? error.message
      : "Internal server error";

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message,
    },
  });
}
