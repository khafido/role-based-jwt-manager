# Refresh Token Configuration

This document explains how to configure and use the refresh token mechanism in your JWT-based authentication system.

## Environment Variables

### Refresh Token Control

```bash
# Enable/disable refresh tokens (default: false)
REFRESH_TOKENS_ENABLED=true
```

When set to `true`, the system will:
- Issue refresh tokens alongside access tokens during login/registration
- Include `/refresh` and `/logout` endpoints
- Return `requiresRefresh: true` in access token expiration errors
- Store refresh tokens in the database

When set to `false` or not set, the system will:
- Only issue access tokens
- Not include refresh token endpoints
- Not include `requiresRefresh` flag in error responses
- Function as a simple JWT system without token rotation

### Token Expiration Settings

```bash
# Access token expiration (default: 1d)
JWT_EXPIRES_IN=1d

# Refresh token expiration (default: 7d)
JWT_REFRESH_EXPIRES_IN=7d
```

## API Behavior

### When Refresh Tokens are Enabled (`REFRESH_TOKENS_ENABLED=true`)

#### Login/Register Response
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

#### Access Token Expiration Error
```json
{
  "success": false,
  "message": "Access token expired",
  "code": "TOKEN_EXPIRED",
  "requiresRefresh": true
}
```

#### Available Endpoints
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Invalidate refresh token

### When Refresh Tokens are Disabled (`REFRESH_TOKENS_ENABLED=false`)

#### Login/Register Response
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

#### Access Token Expiration Error
```json
{
  "success": false,
  "message": "Access token expired",
  "code": "TOKEN_EXPIRED"
}
```

#### Disabled Endpoints
- `POST /api/auth/refresh` - Returns 503 "Refresh tokens are disabled"
- `POST /api/auth/logout` - Returns 503 "Refresh tokens are disabled"

## Usage Examples

### Enable Refresh Tokens
```bash
# .env file
REFRESH_TOKENS_ENABLED=true
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Disable Refresh Tokens
```bash
# .env file
REFRESH_TOKENS_ENABLED=false
JWT_EXPIRES_IN=1d
```

### Client-Side Implementation (When Enabled)

```javascript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
const { accessToken, refreshToken } = await loginResponse.json();

// Store tokens securely
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// API call with token refresh
async function apiCall(url, options = {}) {
  let token = localStorage.getItem('accessToken');
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) return response;
    
    const error = await response.json();
    
    // Handle token expiration
    if (error.code === 'TOKEN_EXPIRED' && error.requiresRefresh) {
      const newTokens = await refreshTokens();
      localStorage.setItem('accessToken', newTokens.accessToken);
      localStorage.setItem('refreshToken', newTokens.refreshToken);
      
      // Retry the original request
      return apiCall(url, options);
    }
    
    throw error;
  } catch (error) {
    // Handle other errors
    throw error;
  }
}

async function refreshTokens() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  if (!response.ok) {
    // Refresh token expired, redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  
  return await response.json();
}
```

## Security Considerations

1. **Token Storage**: Store refresh tokens securely (httpOnly cookies recommended)
2. **Token Rotation**: The system implements token rotation for enhanced security
3. **Logout**: Always call the logout endpoint to invalidate refresh tokens
4. **HTTPS**: Always use HTTPS in production to prevent token interception

## Migration Guide

To migrate from a simple JWT system to refresh tokens:

1. Set `REFRESH_TOKENS_ENABLED=true` in your environment
2. Update client-side code to handle refresh tokens
3. Implement token refresh logic as shown above
4. Test the complete flow

To disable refresh tokens:

1. Set `REFRESH_TOKENS_ENABLED=false` or remove the variable
2. Update client-side code to handle simple JWT flow
3. Remove refresh token storage and refresh logic
