import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { IUser } from '@/models/user.model';

export interface TokenPayload extends jwt.JwtPayload {
  id: string;
  email: string;
  role: string;
}

export const generateAccessToken = (user: IUser): string => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role
  };

  const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH || 'keys/private.pem';
  const privateKey = fs.readFileSync(path.resolve(process.cwd(), privateKeyPath), 'utf8');

  const options: jwt.SignOptions = {
    algorithm: 'RS256',
    expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any
  };

  return jwt.sign(payload, privateKey, options);
};

export const verifyToken = (token: string): TokenPayload => {
  const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH || 'keys/public.pem';
  const publicKey = fs.readFileSync(path.resolve(process.cwd(), publicKeyPath), 'utf8');

  return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as TokenPayload;
};

export const generateRefreshToken = (user: IUser): string => {
  const payload = {
    id: user._id,
    email: user.email,
    type: 'refresh'
  };

  const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH || 'keys/private.pem';
  const privateKey = fs.readFileSync(path.resolve(process.cwd(), privateKeyPath), 'utf8');

  const options: jwt.SignOptions = {
    algorithm: 'RS256',
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any
  };

  return jwt.sign(payload, privateKey, options);
};

export const verifyRefreshToken = (token: string): TokenPayload & { type: string } => {
  const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH || 'keys/public.pem';
  const publicKey = fs.readFileSync(path.resolve(process.cwd(), publicKeyPath), 'utf8');

  const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as TokenPayload & { type: string };
  
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  
  return decoded;
};
