// Authentication service
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from './env';
import { SessionPayload } from '@/types/auth';

const JWT_SECRET = env.jwt.secret || 'development-secret-key';
const TOKEN_EXPIRY = '24h';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user session
 */
export function generateToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
    return decoded;
  } catch (error) {
    console.error('[AUTH ERROR] Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[AUTH ERROR] JWT_SECRET exists:', !!JWT_SECRET);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  console.log('[AUTH] Raw auth header:', authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[AUTH] Invalid auth header format');
    return null;
  }
  const token = authHeader.substring(7);
  console.log('[AUTH] Extracted token:', token ? `${token.substring(0, 20)}...` : 'EMPTY');
  return token;
}
