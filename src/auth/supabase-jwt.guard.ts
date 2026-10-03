import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export type AuthUser = { id: string; email?: string };
export type AuthedRequest = Request & { authUser: AuthUser };

/**
 * Verifies a Supabase Auth access token (Authorization: Bearer <jwt>) against
 * the project's public JWKS (asymmetric ES256 keys) — no shared secret.
 */
@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  private readonly issuer: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL')?.replace(/\/$/, '');
    if (!url) throw new Error('SUPABASE_URL is required for member authentication.');
    this.issuer = `${url}/auth/v1`;
    this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const header = request.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new UnauthorizedException('Missing access token.');

    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: 'authenticated',
      });
      if (!payload.sub) throw new Error('Token without subject');
      request.authUser = {
        id: payload.sub,
        email: typeof payload.email === 'string' ? payload.email.toLowerCase() : undefined,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }
}
