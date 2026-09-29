import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class InternalLiaGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('ATENDIMENTO_SERVICE_TOKEN');
    if (!expected) {
      throw new UnauthorizedException('Internal service authentication is not configured.');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header('x-levelab-service-token');

    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Invalid service token.');
    }

    return true;
  }
}
