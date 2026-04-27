import { Router } from 'express';
import { registerUser, loginUser, refreshToken, logout } from '@/controllers/auth.controller.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema, logoutSchema } from '@/validations/user.validation.js';
import { areRefreshTokensEnabled } from '@/utils/config.js';

const router = Router();
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [USER, MENTOR, ADMIN]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 */
router.post('/register', validate(registerSchema), registerUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login an existing user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(loginSchema), loginUser);

// Dynamic route registration for refresh token endpoints
router.post('/refresh', validate(refreshTokenSchema), (req, res, next) => {
  if (!areRefreshTokensEnabled()) {
    return res.status(503).json({ 
      success: false,
      message: 'Refresh tokens are disabled',
      code: 'REFRESH_TOKENS_DISABLED'
    });
  }
  return refreshToken(req, res, next);
});

router.post('/logout', validate(logoutSchema), (req, res, next) => {
  if (!areRefreshTokensEnabled()) {
    return res.status(503).json({ 
      success: false,
      message: 'Refresh tokens are disabled',
      code: 'REFRESH_TOKENS_DISABLED'
    });
  }
  return logout(req, res, next);
});

export default router;
