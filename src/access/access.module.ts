import { Global, Module } from '@nestjs/common';
import { AroAccessService } from '../aro/aro-access.service';
import { AroWebhookController } from '../aro/aro-webhook.controller';
import { AdminGuard } from '../auth/admin.guard';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { AdminController } from './admin.controller';
import { CatalogController } from './catalog.controller';
import { EntitlementsService } from './entitlements.service';
import { MeController } from './me.controller';
import { MembersService } from './members.service';

@Global()
@Module({
  controllers: [MeController, CatalogController, AdminController, AroWebhookController],
  providers: [MembersService, EntitlementsService, SupabaseJwtGuard, AdminGuard, AroAccessService],
  exports: [EntitlementsService, MembersService],
})
export class AccessModule {}
