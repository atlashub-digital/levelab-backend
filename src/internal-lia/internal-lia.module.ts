import { Module } from '@nestjs/common';
import { InternalLiaController } from './internal-lia.controller';
import { InternalLiaGuard } from './internal-lia.guard';
import { InternalLiaService } from './internal-lia.service';

@Module({
  controllers: [InternalLiaController],
  providers: [InternalLiaGuard, InternalLiaService],
})
export class InternalLiaModule {}
