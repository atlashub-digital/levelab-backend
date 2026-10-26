import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
  ServiceUnavailableException,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { createReadStream, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SupabaseJwtGuard, type AuthedRequest } from '../auth/supabase-jwt.guard';
import { CONTENT_ASSETS, getAsset } from './access.catalog';
import { AroService } from '../aro/aro.service';
import { EntitlementsService } from './entitlements.service';
import { MembersService } from './members.service';

/** Signed-in member area (Supabase JWT). */
@Controller('me')
@UseGuards(SupabaseJwtGuard)
export class MeController {
  constructor(
    private readonly members: MembersService,
    private readonly entitlements: EntitlementsService,
    private readonly aro: AroService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async me(@Req() req: AuthedRequest) {
    const member = await this.members.forAuthUser(req.authUser);
    const keys = await this.entitlements.activeKeys(member.id);
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
    // ARO is the authority for reader access; fail closed when unreachable.
    const aro = await this.aro.authoritativeReaderKeys(member.email ?? '');
    if (aro === null) throw new ServiceUnavailableException({ code: 'ARO_UNAVAILABLE' });
    return CONTENT_ASSETS.map(({ file: _file, ...asset }) => ({
      ...asset,
      hasAccess: aro.has(asset.requires),
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
    // ARO authoritative check, fail closed on ARO unavailability.
    const aro = await this.aro.authoritativeReaderKeys(member.email ?? '');
    if (aro === null) throw new ServiceUnavailableException({ code: 'ARO_UNAVAILABLE' });
    if (!aro.has(asset.requires)) {
      throw new ForbiddenException({ code: 'NO_ACCESS', requires: asset.requires });
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
