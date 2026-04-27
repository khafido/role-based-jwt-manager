import { Request, Response, NextFunction } from 'express';
import User from '@/models/user.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/jwt.js';
import { areRefreshTokensEnabled } from '@/utils/config.js';
import { AuthResponse, AuthResponseWithRefresh, LogoutResponse, TokenResponse } from '@/types/auth.types.js';
import { validatePassword } from '@/utils/password.validator.js';

export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({ 
        success: false, 
        message: 'Password does not meet security requirements',
        code: 'WEAK_PASSWORD',
        details: {
          errors: passwordValidation.errors,
          requirements: passwordValidation.requirements
        }
      });
      return;
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ success: false, message: 'User already exists' });
      return;
    }

    const user = await User.create({ email, password, role });

    const accessToken = generateAccessToken(user);
    let response: AuthResponse | AuthResponseWithRefresh = {
      accessToken
    };

    // Only generate and store refresh token if enabled
    if (areRefreshTokensEnabled()) {
      const refreshToken = generateRefreshToken(user);
      
      // Store refresh token in database
      const refreshTokenExpiresAt = new Date();
      refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7); // 7 days from now
      
      await User.findByIdAndUpdate(user._id, {
        refreshToken,
        refreshTokenExpiresAt
      });

      response = { ...response, refreshToken };
    }

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check for user explicitly requesting password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const accessToken = generateAccessToken(user);
    let response: AuthResponse | AuthResponseWithRefresh = {
      accessToken
    };
    
    // Only generate and store refresh token if enabled
    if (areRefreshTokensEnabled()) {
      const refreshToken = generateRefreshToken(user);
      
      // Store refresh token in database
      const refreshTokenExpiresAt = new Date();
      refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7); // 7 days from now
      
      await User.findByIdAndUpdate(user._id, {
        refreshToken,
        refreshTokenExpiresAt
      });

      response = { ...response, refreshToken };
    }

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Check if refresh tokens are enabled
  if (!areRefreshTokensEnabled()) {
    res.status(503).json({ 
      success: false,
      message: 'Refresh tokens are disabled',
      code: 'REFRESH_TOKENS_DISABLED'
    });
    return;
  }

  try {
    const { refreshToken: providedRefreshToken } = req.body;

    if (!providedRefreshToken) {
      res.status(401).json({ success: false, message: 'Refresh token is required' });
      return;
    }

    // Verify the refresh token
    const decoded = verifyRefreshToken(providedRefreshToken);

    // Find user with the matching refresh token
    const user = await User.findOne({ 
      _id: decoded.id,
      refreshToken: providedRefreshToken,
      refreshTokenExpiresAt: { $gt: new Date() }
    }).select('+refreshToken +refreshTokenExpiresAt');

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
      return;
    }

    // Generate new access token and refresh token (token rotation)
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    // Update refresh token in database
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7); // 7 days from now
    
    await User.findByIdAndUpdate(user._id, {
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt
    });

    const response: TokenResponse = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
      return;
    }
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: 'Refresh token expired' });
      return;
    }
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Check if refresh tokens are enabled
  if (!areRefreshTokensEnabled()) {
    res.status(503).json({ 
      success: false, 
      message: 'Refresh tokens are disabled',
      code: 'REFRESH_TOKENS_DISABLED'
    });
    return;
  }

  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove refresh token from database
      await User.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: 1, refreshTokenExpiresAt: 1 } }
      );
    }

    const response: LogoutResponse = {
      success: true,
      message: 'Logged out successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

