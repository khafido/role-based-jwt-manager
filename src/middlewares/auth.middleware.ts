import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '@/utils/jwt';
import { areRefreshTokensEnabled } from '@/utils/config.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const isAuth = (req: Request, res: Response, next: NextFunction): void => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ 
      success: false, 
      message: 'Access token is required',
      code: 'TOKEN_REQUIRED'
    });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      const errorResponse: any = { 
        success: false, 
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      };
      
      // Only include refresh token information if refresh tokens are enabled
      if (areRefreshTokensEnabled()) {
        errorResponse.requiresRefresh = true;
      }
      
      res.status(401).json(errorResponse);
      return;
    }
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid access token',
        code: 'INVALID_TOKEN'
      });
      return;
    }
    if (error instanceof Error) {
      // Log unexpected JWT errors for debugging
      console.error('Unexpected JWT verification error:', error);
      res.status(401).json({ 
        success: false, 
        message: 'Token verification failed',
        code: 'TOKEN_VERIFICATION_ERROR'
      });
      return;
    }
    res.status(401).json({ 
      success: false, 
      message: 'Not authorized',
      code: 'AUTHORIZATION_FAILED'
    });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: `User role ${req.user?.role || 'unknown'} is not authorized to access this route` });
      return;
    }
    next();
  };
};
