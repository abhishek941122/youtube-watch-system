/**
 * Simple clean logging utility functions
 */

export const logInfo = (message) => {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
};

export const logError = (message, err = null) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, err || '');
};
