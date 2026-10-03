import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

/** Operator-only endpoints: `x-admin-token` must equal ADMIN_API_TOKEN. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('ADMIN_API_TOKEN');
    if (!expected) throw new UnauthorizedException('Admin API is not configured.');

    const provided = context.switchToHttp().getRequest<Request>().header('x-admin-token') ?? '';
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid admin token.');
    }
    return true;
  }
}
