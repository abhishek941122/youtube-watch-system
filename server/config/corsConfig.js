/**
 * CORS configuration for Express app and Socket.IO
 */
export const getCorsOptions = () => {
  const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

  return {
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  };
};