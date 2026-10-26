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
    // Local keys authorize explicit complimentary/admin access only when ARO
    // is enabled. Paid ARO rights are checked per asset by MeController so
    // separate book/workbook entitlements cannot accidentally unlock both.
    // The verified email is used exclusively by AroAccessService.
    void verifiedEmail;
    return expandKeys(rows.map((row) => row.key));
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
