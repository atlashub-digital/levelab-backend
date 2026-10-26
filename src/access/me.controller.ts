import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { createReadStream, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SupabaseJwtGuard, type AuthedRequest } from '../auth/supabase-jwt.guard';
import { ARO_RIGHT_BY_ASSET, CONTENT_ASSETS, getAsset } from './access.catalog';
import { AroAccessService } from '../aro/aro-access.service';
import { EntitlementsService } from './entitlements.service';
import { MembersService } from './members.service';

/** Signed-in member area (Supabase JWT). */
@Controller('me')
@UseGuards(SupabaseJwtGuard)
export class MeController {
  constructor(
    private readonly members: MembersService,
    private readonly entitlements: EntitlementsService,
    private readonly aro: AroAccessService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async me(@Req() req: AuthedRequest) {
    const member = await this.members.forAuthUser(req.authUser);
    const localKeys = await this.entitlements.activeKeys(member.id, member.email);
    const aroKeys = this.aro.enabled ? await this.aro.activeKeys(member.email) : [];
    const keys = [...new Set<string>([...localKeys, ...aroKeys])];
    return {
      member: {
        id: member.id,
        email: member.email,
        displayName: member.displayName,
      },
      access: { keys, premium: keys.includes('premium') },
    };
  }

  @Get('library')
  async library(@Req() req: AuthedRequest) {
    const member = await this.members.forAuthUser(req.authUser);
    const localKeys = await this.entitlements.activeKeys(member.id, member.email);
    const aroRights = this.aro.enabled
      ? new Set(await this.aro.activeKeys(member.email))
      : null;
    return CONTENT_ASSETS.map(({ file: _file, ...asset }) => ({
      ...asset,
      hasAccess: localKeys.includes(asset.requires) ||
        Boolean(aroRights?.has(ARO_RIGHT_BY_ASSET[asset.id])),
    }));
  }

  /** Streams the full PDF only to members holding the asset's key. */
  @Get('content/:assetId')
  async content(
    @Req() req: AuthedRequest,
    @Param('assetId') assetId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const asset = getAsset(assetId);
    if (!asset) throw new NotFoundException('Content not found.');

    const member = await this.members.forAuthUser(req.authUser);
    const localAccess = await this.entitlements.hasKey(member.id, asset.requires, member.email);
    // Per-document ARO verification is authoritative for paid rights. The
    // workbook cannot be opened merely by owning the guide entitlement.
    const aroRights = this.aro.enabled
      ? new Set(await this.aro.activeKeys(member.email))
      : null;
    const paidAccess = aroRights?.has(ARO_RIGHT_BY_ASSET[asset.id]) ?? false;
    if (!localAccess && !paidAccess) {
      throw new ForbiddenException({ code: 'NO_ACCESS' });
    }

    const path = join(this.config.get<string>('CONTENT_DIR') ?? '/content', asset.file);
    if (!existsSync(path)) throw new NotFoundException('Content file is not available.');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${asset.file}"`,
      'Cache-Control': 'private, no-store',
    });
    return new StreamableFile(createReadStream(path));
  }
}
