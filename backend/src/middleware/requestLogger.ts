import { Request, Response, NextFunction } from "express";

const SENSITIVE_KEYS = new Set([
  "password",
  "currentpassword",
  "newpassword",
  "token",
  "refreshtoken",
  "accesstoken",
  "authorization",
  "cookie",
  "secret",
]);

export function redactSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = redactSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Structured log
    const logInfo = {
      timestamp: new Date().toISOString(),
      method,
      url: originalUrl,
      status,
      durationMs: duration,
      clientIp: ip,
    };

    if (process.env.NODE_ENV !== "test") {
      // In non-test environments output structured log
      console.log(JSON.stringify(logInfo));
    }
  });

  next();
}
