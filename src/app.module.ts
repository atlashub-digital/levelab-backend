import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    InternalLiaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
