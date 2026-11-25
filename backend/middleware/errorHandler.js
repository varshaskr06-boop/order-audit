/**
 * ============================================================================
 * Centralized Error Handling Middleware
 * ============================================================================
 */

// 404 Route Not Found Middleware
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource not found: [${req.method}] ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  
  // Clean structured response
  const response = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    },
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
