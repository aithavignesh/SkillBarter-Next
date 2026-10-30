import { Response } from "express";
import { ApiResponse } from "@skillbarter/shared";

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: ApiResponse["meta"],
  statusCode = 200
): void {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
  res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
): void {
  const payload: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  res.status(statusCode).json(payload);
}
