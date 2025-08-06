import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err.stack);

  // Validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors
    });
  }

  // Default error
  res.status(500).json({
    message: "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}