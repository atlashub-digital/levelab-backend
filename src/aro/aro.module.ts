import { Module } from '@nestjs/common';
import { AroController } from './aro.controller';
import { AroService } from './aro.service';

@Module({
  controllers: [AroController],
  providers: [AroService],
  exports: [AroService],
})
export class AroModule {}
