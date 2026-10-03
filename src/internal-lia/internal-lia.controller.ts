import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  RecordCheckinDto,
  ResolveMemberDto,
  UpdateWellnessProfileDto,
} from './internal-lia.dto';
import { InternalLiaGuard } from './internal-lia.guard';
import { InternalLiaService } from './internal-lia.service';

@Controller('internal/lia')
@UseGuards(InternalLiaGuard)
export class InternalLiaController {
  constructor(private readonly lia: InternalLiaService) {}

  @Post('members/resolve')
  resolveMember(@Body() body: ResolveMemberDto) {
    return this.lia.resolveMember(body);
  }

  @Get('members/:memberId/context')
  getContext(@Param('memberId') memberId: string) {
    return this.lia.getContext(memberId);
  }

  @Patch('members/:memberId/profile')
  updateProfile(
    @Param('memberId') memberId: string,
    @Body() body: UpdateWellnessProfileDto,
  ) {
    return this.lia.updateProfile(memberId, body);
  }

  @Post('members/:memberId/checkins')
  recordCheckin(
    @Param('memberId') memberId: string,
    @Body() body: RecordCheckinDto,
  ) {
    return this.lia.recordCheckin(memberId, body);
  }
}
