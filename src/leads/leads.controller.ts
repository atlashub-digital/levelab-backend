import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  HttpCode,
  Injectable,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { Equals, IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../database/prisma.service';
import { MembersService } from '../access/members.service';

/** Only the LeveLab website (server side) may submit leads: x-web-forms-token. */
@Injectable()
export class WebFormsGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('WEB_FORMS_TOKEN');
    if (!expected) throw new UnauthorizedException('Web forms are not configured.');
    const provided = context.switchToHttp().getRequest<Request>().header('x-web-forms-token') ?? '';
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException();
    return true;
  }
}

class NewsletterDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsBoolean()
  @Equals(true)
  consent!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  locale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  source?: string;
}

const NEWSLETTER_CONSENT = { type: 'marketing.newsletter', version: '2026-10' };

@Controller('leads')
@UseGuards(WebFormsGuard)
export class LeadsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly members: MembersService,
  ) {}

  /** Newsletter opt-in: member as LEAD + explicit marketing consent (idempotent). */
  @Post('newsletter')
  @HttpCode(200)
  async newsletter(@Body() body: NewsletterDto) {
    const member = await this.members.forEmail(body.email);
    const active = await this.prisma.consent.findFirst({
      where: { memberId: member.id, type: NEWSLETTER_CONSENT.type, granted: true, revokedAt: null },
      select: { id: true },
    });
    if (!active) {
      await this.prisma.consent.create({
        data: {
          memberId: member.id,
          ...NEWSLETTER_CONSENT,
          granted: true,
          source: body.source ?? 'website',
          metadata: { locale: body.locale ?? null },
        },
      });
    }
    return { ok: true };
  }
}
