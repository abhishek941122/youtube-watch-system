/**
 * Simple Request Logging Middleware
 * Logs incoming HTTP method, URL, and timestamp
 */
export const loggerMiddleware = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[HTTP] ${req.method} ${req.originalUrl} - ${timestamp}`);
  next();
};
