import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { JwtPayload } from '../middleware/auth';

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const calculateKdRatio = (kills: number, deaths: number): number => {
  if (deaths === 0) return kills;
  return Math.round((kills / deaths) * 100) / 100;
};

export const calculateWinRate = (wins: number, matches: number): number => {
  if (matches === 0) return 0;
  return Math.round((wins / matches) * 10000) / 100;
};

export const paginate = (page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  const take = limit;
  return { skip, take, page, limit };
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};
