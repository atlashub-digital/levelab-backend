import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { LiaApiGuard } from './lia-api.guard';
import { InternalLiaService } from './internal-lia.service';

/**
 * Read-only context API consumed by LIA Core (levelab-lia
 * src/context/context.client.ts). Response shape = LiaMemberContext.
 */
@Controller('lia')
@UseGuards(LiaApiGuard)
export class LiaContextController {
  constructor(private readonly lia: InternalLiaService) {}

  @Get('context/:memberId')
  getMemberContext(@Param('memberId') memberId: string) {
    return this.lia.getLiaMemberContext(memberId);
  }
}
