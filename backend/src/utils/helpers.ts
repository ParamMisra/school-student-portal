import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  role: string;
  schoolId: string;
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret';

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '1d' });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
};

export const getPaginationParams = (query: any) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = 10; // Fixed pagination requirement: 10 rows at a time
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};