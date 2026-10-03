import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EntitlementKey, expandKeys } from './access.catalog';

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Active, expanded keys for a member (premium expands to all keys). */
  async activeKeys(memberId: string): Promise<EntitlementKey[]> {
    const now = new Date();
    const rows = await this.prisma.entitlement.findMany({
      where: {
        memberId,
        revokedAt: null,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      select: { key: true },
    });
    return expandKeys(rows.map((row) => row.key));
  }

  async hasKey(memberId: string, key: EntitlementKey): Promise<boolean> {
    return (await this.activeKeys(memberId)).includes(key);
  }

  grant(input: {
    memberId: string;
    grants: Array<{ key: EntitlementKey; endsAt?: Date }>;
    source: string;
    sourceRef?: string;
    note?: string;
  }) {
    return this.prisma.$transaction(
      input.grants.map(({ key, endsAt }) =>
        this.prisma.entitlement.create({
          data: {
            memberId: input.memberId,
            key,
            source: input.source,
            sourceRef: input.sourceRef,
            endsAt,
            note: input.note,
          },
        }),
      ),
    );
  }

  revoke(id: string) {
    return this.prisma.entitlement.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}
