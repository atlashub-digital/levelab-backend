import { Injectable } from '@nestjs/common';
import { AroAccessService } from '../aro/aro-access.service';
import { PrismaService } from '../database/prisma.service';
import { EntitlementKey, expandKeys } from './access.catalog';

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService, private readonly aro: AroAccessService) {}

  /** Active, expanded keys for a member (premium expands to all keys). */
  async activeKeys(memberId: string, verifiedEmail?: string | null): Promise<EntitlementKey[]> {
    const now = new Date();
    const rows = await this.prisma.entitlement.findMany({
      where: {
        memberId,
        ...(this.aro.enabled ? { source: { in: ['manual', 'admin'] } } : {}),
        revokedAt: null,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      select: { key: true },
    });
    const localKeys = rows.map((row) => row.key);
    if (!this.aro.enabled) return expandKeys(localKeys);
    const aroKeys = await this.aro.activeKeys(verifiedEmail);
    return expandKeys([...localKeys, ...aroKeys]);
  }

  async hasKey(memberId: string, key: EntitlementKey, verifiedEmail?: string | null): Promise<boolean> {
    return (await this.activeKeys(memberId, verifiedEmail)).includes(key);
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
