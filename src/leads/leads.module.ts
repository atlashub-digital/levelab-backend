import { Module } from '@nestjs/common';
import { LeadsController, WebFormsGuard } from './leads.controller';

@Module({
  controllers: [LeadsController],
  providers: [WebFormsGuard],
})
export class LeadsModule {}
