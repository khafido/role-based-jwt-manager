/**
 * Base authentication response interface
 */
export interface BaseAuthResponse {
  accessToken: string;
}

/**
 * Authentication response with refresh token (when enabled)
 */
export interface AuthResponseWithRefresh extends BaseAuthResponse {
  refreshToken: string;
}

/**
 * Authentication response without refresh token (when disabled)
 */
export type AuthResponse = BaseAuthResponse;

/**
 * Token response interface
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Logout response interface
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  requiresRefresh?: boolean;
}
