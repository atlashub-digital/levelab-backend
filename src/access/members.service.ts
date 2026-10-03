import { Injectable } from '@nestjs/common';
import type { Member } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../auth/supabase-jwt.guard';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Member for a signed-in Supabase user. Links an existing member with the
   * same email (e.g. access granted before the first login) or creates one.
   */
  async forAuthUser(user: AuthUser): Promise<Member> {
    const linked = await this.prisma.member.findUnique({ where: { authUserId: user.id } });
    if (linked) return linked;

    if (user.email) {
      const byEmail = await this.prisma.member.findUnique({ where: { email: user.email } });
      if (byEmail) {
        return this.prisma.member.update({
          where: { id: byEmail.id },
          data: { authUserId: user.id },
        });
      }
    }

    return this.prisma.member.create({
      data: { authUserId: user.id, email: user.email },
    });
  }

  /** Find or create a member by email (operator grants before first login). */
  async forEmail(email: string): Promise<Member> {
    const normalized = email.trim().toLowerCase();
    return this.prisma.member.upsert({
      where: { email: normalized },
      update: {},
      create: { email: normalized },
    });
  }
}
