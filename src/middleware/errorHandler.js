/**
 * Global error handling middleware
 *
 * Handles all errors from route handlers with consistent JSON responses.
 * Logs errors for debugging and sanitizes messages in production.
 *
 * @param {Error} err - The error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export function errorHandler(err, req, res, next) {
  // Log error for debugging (always log full details server-side)
  console.error("Error:", err);

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Sanitize error message in production for 500 errors
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err.message || "Internal Server Error";

  // Format JSON error response
  const errorResponse = {
    error: err.name || "Internal Server Error",
    message: message,
  };

  // Send JSON error response with appropriate status code
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.url} not found`,
  });
}
