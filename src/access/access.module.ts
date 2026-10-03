import { Global, Module } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { AdminController } from './admin.controller';
import { CatalogController } from './catalog.controller';
import { EntitlementsService } from './entitlements.service';
import { MeController } from './me.controller';
import { MembersService } from './members.service';

@Global()
@Module({
  controllers: [MeController, CatalogController, AdminController],
  providers: [MembersService, EntitlementsService, SupabaseJwtGuard, AdminGuard],
  exports: [EntitlementsService, MembersService],
})
export class AccessModule {}
