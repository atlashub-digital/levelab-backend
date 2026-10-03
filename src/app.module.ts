import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccessModule } from './access/access.module';
import { LeadsModule } from './leads/leads.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { InternalLiaModule } from './internal-lia/internal-lia.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    DatabaseModule,
    AccessModule,
    LeadsModule,
    InternalLiaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
