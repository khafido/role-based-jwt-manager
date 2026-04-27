/**
 * Configuration utilities for the application
 */

/**
 * Check if refresh tokens are enabled
 * @returns {boolean} True if refresh tokens are enabled
 */
export const areRefreshTokensEnabled = (): boolean => {
  return process.env.REFRESH_TOKENS_ENABLED === 'true';
};
