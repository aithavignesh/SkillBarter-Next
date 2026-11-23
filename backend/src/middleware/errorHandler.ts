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
  // Zod Validation Error (support both local and cross-package Zod instances)
  const isZod =
    error instanceof ZodError ||
    (error &&
      typeof error === "object" &&
      (error as any).name === "ZodError" &&
      Array.isArray((error as any).issues));

  if (isZod) {
    const zodErr = error as ZodError;
    const details = zodErr.issues.map((e) => ({
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

  // AppError (support both local and cross-package instances)
  const isAppError =
    error instanceof AppError ||
    (error && typeof error === "object" && (error as any).name === "AppError");

  if (isAppError) {
    const appErr = error as AppError;
    res.status(appErr.statusCode || 400).json({
      success: false,
      error: {
        code: appErr.code,
        message: appErr.message,
        details: appErr.details,
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
