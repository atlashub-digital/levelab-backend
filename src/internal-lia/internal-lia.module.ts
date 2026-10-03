import { Module } from '@nestjs/common';
import { InternalLiaController } from './internal-lia.controller';
import { InternalLiaGuard } from './internal-lia.guard';
import { InternalLiaService } from './internal-lia.service';
import { LiaApiGuard } from './lia-api.guard';
import { LiaContextController } from './lia-context.controller';

@Module({
  controllers: [InternalLiaController, LiaContextController],
  providers: [InternalLiaGuard, LiaApiGuard, InternalLiaService],
})
export class InternalLiaModule {}
