import { z } from 'zod';
import { Role } from '@/models/user.model.js';

export const registerSchema = z.object({
  body: z.object({
    email: z.string({ message: 'Email is required' }).email('Not a valid email'),
    password: z.string({ message: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter (A-Z)')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter (a-z)')
      .regex(/\d/, 'Password must contain at least one number (0-9)')
      .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)'),
    role: z.enum([Role.USER, Role.MENTOR, Role.ADMIN], {
      message: 'Role must be USER, MENTOR, or ADMIN'
    }).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ message: 'Email is required' }).email('Not a valid email'),
    password: z.string({ message: 'Password is required' }).min(1, 'Password is required')
  })
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({ message: 'Refresh token is required' }).min(1, 'Refresh token is required')
  })
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional()
  })
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type LogoutInput = z.infer<typeof logoutSchema>['body'];
