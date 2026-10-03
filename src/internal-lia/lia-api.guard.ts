import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

/**
 * Authenticates LIA Core -> LeveLab Backend calls.
 * LIA sends `Authorization: Bearer <LEVELAB_API_TOKEN>`; the backend holds the
 * same secret as LIA_API_TOKEN. Kept separate from ATENDIMENTO_SERVICE_TOKEN so
 * each caller can be rotated and audited independently.
 */
@Injectable()
export class LiaApiGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('LIA_API_TOKEN');
    if (!expected) {
      throw new UnauthorizedException('LIA API authentication is not configured.');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.header('authorization') ?? '';
    const provided = header.startsWith('Bearer ') ? header.slice(7) : '';

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid service token.');
    }

    return true;
  }
}
