import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

/**
 * Security configuration utilities
 */

/**
 * Enhanced helmet configuration with comprehensive security headers
 */
export const securityHeaders = helmet({
  // Skip for /docs route
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      sandbox: ['allow-forms', 'allow-scripts'],
    },
  },
  
  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  
  // DNS Prefetch Control
  dnsPrefetchControl: false,
  
  // HSTS
  hsts: true,
  
  // IE Compatibility
  ieNoOpen: true,
  
  // Origin Policy
  originAgentCluster: true,
  
  // Referrer Policy
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  
  // X-Content-Type-Options
  xContentTypeOptions: true,
  
  // X-Frame-Options
  xFrameOptions: { action: 'deny' },
  
  // X-XSS-Protection
  xXssProtection: true
});

// Wrapper to skip security headers for /docs
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/docs')) {
    return next();
  }
  return securityHeaders(req, res, next);
};

/**
 * Global rate limiting configuration
 */
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  skip: (req: Request) => req.path.startsWith('/docs'),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
      details: {
        limit: 1000,
        windowMs: 15 * 60 * 1000,
        remaining: 0
      }
    });
  }
});

/**
 * Strict rate limiting for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
      details: {
        limit: 20,
        windowMs: 15 * 60 * 1000,
        remaining: 0,
        endpoint: _req.path
      }
    });
  }
});

/**
 * Very strict rate limiting for sensitive operations (password reset, etc.)
 */
export const sensitiveRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 sensitive requests per hour
  message: {
    success: false,
    message: 'Too many sensitive operations, please try again later.',
    code: 'SENSITIVE_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many sensitive operations, please try again later.',
      code: 'SENSITIVE_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 hour',
      details: {
        limit: 5,
        windowMs: 60 * 60 * 1000,
        remaining: 0,
        endpoint: _req.path
      }
    });
  }
});

/**
 * Rate limiting for API endpoints (moderate)
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 API requests per windowMs
  message: {
    success: false,
    message: 'Too many API requests, please try again later.',
    code: 'API_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many API requests, please try again later.',
      code: 'API_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
      details: {
        limit: 500,
        windowMs: 15 * 60 * 1000,
        remaining: 0
      }
    });
  }
});

/**
 * Rate limiting for documentation endpoints (lenient)
 */
export const docsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 documentation requests per windowMs
  message: {
    success: false,
    message: 'Too many documentation requests, please try again later.',
    code: 'DOCS_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many documentation requests, please try again later.',
      code: 'DOCS_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
      details: {
        limit: 200,
        windowMs: 15 * 60 * 1000,
        remaining: 0
      }
    });
  }
});

/**
 * Create custom rate limit with specific configuration
 */
export const createRateLimit = (
  windowMs: number,
  max: number,
  message: string,
  code: string
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      code,
      retryAfter: `${Math.ceil(windowMs / 60000)} minutes`
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message,
        code,
        retryAfter: `${Math.ceil(windowMs / 60000)} minutes`,
        details: {
          limit: max,
          windowMs,
          remaining: 0,
          endpoint: _req.path
        }
      });
    }
  });
};

/**
 * Rate limiting middleware that applies different limits based on endpoint
 */
export const adaptiveRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  
  // Apply different rate limits based on endpoint patterns
  if (path.includes('/auth/login') || path.includes('/auth/register')) {
    return authRateLimit(req, res, next);
  } else if (path.includes('/auth/refresh') || path.includes('/auth/logout')) {
    return createRateLimit(15 * 60 * 1000, 30, 'Too many token operations', 'TOKEN_RATE_LIMIT_EXCEEDED')(req, res, next);
  } else if (path.startsWith('/api/protected')) {
    return apiRateLimit(req, res, next);
  } else if (path.startsWith('/docs')) {
    return docsRateLimit(req, res, next);
  } else {
    return globalRateLimit(req, res, next);
  }
};
