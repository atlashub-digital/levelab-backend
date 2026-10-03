import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AdminGuard } from '../auth/admin.guard';
import { PrismaService } from '../database/prisma.service';
import { ENTITLEMENT_KEYS, OFFERS, type EntitlementKey } from './access.catalog';
import { EntitlementsService } from './entitlements.service';
import { MembersService } from './members.service';

class GrantDto {
  @IsEmail()
  email!: string;

  /** Grant the keys of a catalog offer (e.g. "guia-corpo-forte")… */
  @IsOptional()
  @IsIn(Object.keys(OFFERS))
  offer?: string;

  /** …or explicit keys. */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(ENTITLEMENT_KEYS, { each: true })
  keys?: EntitlementKey[];

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Operator endpoints (manual access while no payment provider is wired). */
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly members: MembersService,
    private readonly entitlements: EntitlementsService,
  ) {}

  @Post('entitlements')
  async grant(@Body() body: GrantDto) {
    // An explicit endsAt applies to every key; otherwise each offer grant
    // uses its own duration (e.g. LeveLab+ for 30 days with a guide).
    const explicitEnd = body.endsAt ? new Date(body.endsAt) : undefined;
    const now = Date.now();
    const grants = body.keys
      ? body.keys.map((key) => ({ key, endsAt: explicitEnd }))
      : body.offer
        ? OFFERS[body.offer].grants.map(({ key, days }) => ({
            key,
            endsAt: explicitEnd ?? (days ? new Date(now + days * 86_400_000) : undefined),
          }))
        : [];
    if (!grants.length) throw new BadRequestException('Provide offer or keys.');
    const keys = grants.map((grant) => grant.key);

    const member = await this.members.forEmail(body.email);
    const created = await this.entitlements.grant({
      memberId: member.id,
      grants,
      source: body.source ?? 'manual',
      sourceRef: body.sourceRef ?? body.offer,
      note: body.note,
    });
    await this.prisma.auditEvent.create({
      data: {
        actorType: 'admin',
        action: 'entitlement.grant',
        resource: 'Member',
        resourceId: member.id,
        payload: { keys, offer: body.offer ?? null, endsAt: body.endsAt ?? null },
      },
    });
    return {
      memberId: member.id,
      granted: created.map((e) => ({ id: e.id, key: e.key, endsAt: e.endsAt })),
    };
  }

  @Post('entitlements/:id/revoke')
  async revoke(@Param('id') id: string) {
    const revoked = await this.entitlements.revoke(id);
    await this.prisma.auditEvent.create({
      data: {
        actorType: 'admin',
        action: 'entitlement.revoke',
        resource: 'Entitlement',
        resourceId: id,
      },
    });
    return { id: revoked.id, revokedAt: revoked.revokedAt };
  }

  @Get('members')
  async findMember(@Query('email') email?: string) {
    if (!email) throw new BadRequestException('email is required.');
    const member = await this.prisma.member.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { entitlements: { orderBy: { createdAt: 'desc' } } },
    });
    if (!member) return { member: null };
    return {
      member: {
        id: member.id,
        email: member.email,
        linkedToLogin: Boolean(member.authUserId),
        createdAt: member.createdAt,
      },
      entitlements: member.entitlements,
      activeKeys: await this.entitlements.activeKeys(member.id),
    };
  }
}
