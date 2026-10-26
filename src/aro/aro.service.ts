import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { EntitlementKey } from '../access/access.catalog';

/**
 * ARO integration (LeveLab V2, mission P0 2026-10-26).
 * - Inbound webhook `/api/v1/webhooks/aro`: signature-verified (HMAC-SHA256
 *   over `<ts>.<rawBody>` as `v1=<hex>`, ±300s window), fail-closed.
 * - Purchase activation `/api/v1/access/activate`: server-to-server check
 *   against the ARO (order approved + entitlements ACTIVE) before granting.
 * - Refunds: `entitlement.revoked` events revoke the matching local
 *   entitlements (source='aro', sourceRef=order_id) — mission item 7.
 */

type AroEvent = {
  id?: string;
  type: string;
  created_at?: string;
  project?: string;
  data?: Record<string, unknown>;
};

// ARO entitlement keys (authoritative) -> local reader keys. The offer
// `levelab-corpo-forte-br` grants the two READER rights; both unlock the
// local `content:corpo-forte` asset family (livro + workbook).
const ARO_TO_LOCAL: Record<string, { key: EntitlementKey; days?: number }> = {
  'levelab:reader:corpo-forte': { key: 'content:corpo-forte' },
  'levelab:reader:corpo-forte-workbook': { key: 'content:corpo-forte' },
  // legacy aliases (older catalog revisions)
  'levelab:corpo-forte': { key: 'content:corpo-forte' },
  'levelab:levelab-plus': { key: 'levelab-plus', days: 30 },
};

@Injectable()
export class AroService {
  private readonly logger = new Logger(AroService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private webhookSecret(): string {
    return this.config.get<string>('ARO_WEBHOOK_SECRET') ?? '';
  }

  private serverKey(): string {
    return this.config.get<string>('ARO_SERVER_KEY') ?? '';
  }

  private baseUrl(): string {
    return (this.config.get<string>('ARO_PUBLIC_BASE_URL') ?? '').replace(/\/$/, '');
  }

  verifySignature(rawBody: string, timestamp: string, signature: string | undefined): boolean {
    const secret = this.webhookSecret();
    if (!secret || !signature || !timestamp) return false;
    const ts = Number(timestamp);
    if (!Number.isFinite(ts)) return false;
    if (Math.abs(Date.now() / 1000 - ts) > 300) return false;
    const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
    const got = signature.startsWith('v1=') ? signature.slice(3) : signature;
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(got, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  }

  async handleEvent(event: AroEvent): Promise<{ handled: boolean; note?: string }> {
    const data = event.data ?? {};
    const orderId = typeof data.order_id === 'string' ? data.order_id : undefined;
    const customerId = typeof data.customer_id === 'string' ? data.customer_id : undefined;
    const entitlements = Array.isArray(data.entitlements) ? (data.entitlements as Array<Record<string, unknown>>) : [];

    if (event.type === 'entitlement.granted') {
      if (!customerId) return { handled: false, note: 'missing_customer_id' };
      const member = await this.findMemberByAroCustomer(customerId);
      if (!member) return { handled: false, note: 'member_not_mapped_yet' };
      await this.grantAroKeys(member.id, entitlements, orderId);
      return { handled: true };
    }

    if (event.type === 'entitlement.revoked') {
      // Revoke everything sourced from this ARO order (mission item 7).
      const where = orderId
        ? { source: 'aro', sourceRef: { startsWith: `aro:${orderId}` } }
        : undefined;
      if (!where) return { handled: false, note: 'missing_order_id' };
      const res = await this.prisma.entitlement.updateMany({
        where: { ...where, revokedAt: null },
        data: { revokedAt: new Date(), note: 'revoked:aro-refund' },
      });
      this.logger.log(`aro entitlement.revoked order=${orderId} revoked=${res.count}`);
      return { handled: res.count > 0 };
    }

    // order.approved / payment.approved are recorded for traceability; grants
    // are driven by entitlement.granted + explicit activation.
    if (event.type === 'order.approved' || event.type === 'payment.approved') {
      this.logger.log(`aro ${event.type} order=${orderId} customer=${customerId}`);
      return { handled: true, note: 'acknowledged' };
    }

    return { handled: false, note: 'ignored_type' };
  }

  /**
   * AUTHORITATIVE access check (GO mandate 2026-10-26): resolves the member's
   * ACTIVE ARO entitlements by verified e-mail and maps them to local reader
   * keys. Returns null when the ARO is unreachable — callers must FAIL CLOSED.
   */
  async authoritativeReaderKeys(email: string): Promise<Set<EntitlementKey> | null> {
    const base = this.baseUrl();
    const key = this.serverKey();
    if (!base || !key) return null;
    try {
      const res = await fetch(`${base}/v1/entitlements/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: 'levelab', identity: { email } }),
      });
      if (!res.ok) return null;
      const body = (await res.json()) as {
        entitlements?: Array<{ key?: string; status?: string; starts_at?: string; expires_at?: string }>;
      };
      const now = Date.now();
      const out = new Set<EntitlementKey>();
      for (const e of body.entitlements ?? []) {
        if (e.status !== 'ACTIVE' || !e.key) continue;
        if (e.starts_at && Date.parse(e.starts_at) > now) continue;
        if (e.expires_at && Date.parse(e.expires_at) <= now) continue;
        const local = ARO_TO_LOCAL[e.key];
        if (local) out.add(local.key);
      }
      return out;
    } catch {
      return null;
    }
  }

  private async findMemberByAroCustomer(customerId: string) {
    // Mapping is stored on the local Order row created at activation time.
    const [order] = await this.prisma.$queryRawUnsafe<Array<{ memberId: string | null }>>(
      `SELECT "memberId" FROM "Order" WHERE metadata->>'aroCustomerId' = $1 ORDER BY "createdAt" DESC LIMIT 1`,
      customerId,
    );
    if (order?.memberId) return { id: order.memberId };
    return null;
  }

  private async grantAroKeys(
    memberId: string,
    entitlements: Array<Record<string, unknown>>,
    orderId?: string,
  ) {
    for (const ent of entitlements) {
      const aroKey = typeof ent.key === 'string' ? ent.key : undefined;
      const local = aroKey ? ARO_TO_LOCAL[aroKey] : undefined;
      if (!local) continue;
      const sourceRef = `aro:${orderId ?? 'unknown'}:${aroKey}`;
      const existing = await this.prisma.entitlement.findFirst({
        where: { memberId, source: 'aro', sourceRef, revokedAt: null },
      });
      if (existing) continue;
      const endsAt = local.days ? new Date(Date.now() + local.days * 86400_000) : null;
      await this.prisma.entitlement.create({
        data: {
          memberId,
          key: local.key,
          source: 'aro',
          sourceRef,
          endsAt,
          note: `ARO ${aroKey}`,
        },
      });
      this.logger.log(`granted ${local.key} to member=${memberId} via ${sourceRef}`);
    }
  }

  /** Purchase activation: verify server-to-server against ARO, then grant. */
  async activate(input: { email: string; orderId: string }) {
    const email = input.email.trim().toLowerCase();
    const base = this.baseUrl();
    const key = this.serverKey();
    if (!base || !key) throw new Error('aro_not_configured');

    const orderRes = await fetch(`${base}/v1/orders/${encodeURIComponent(input.orderId)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!orderRes.ok) throw new Error(`aro_order_lookup_failed:${orderRes.status}`);
    const order = (await orderRes.json()) as {
      status: string;
      project?: string;
      customer_id?: string;
      items?: Array<{ offer?: string }>;
    };
    if (order.status !== 'approved') throw new Error(`order_not_approved:${order.status}`);
    if (order.project && order.project !== 'levelab') throw new Error('wrong_project');

    let entitlements: Array<Record<string, unknown>> = [];
    if (order.customer_id) {
      const res = await fetch(`${base}/v1/entitlements/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: 'levelab', customer_id: order.customer_id }),
      });
      if (res.ok) {
        const body = (await res.json()) as { entitlements?: Array<Record<string, unknown>> };
        entitlements = body.entitlements ?? [];
      }
    }
    const active = entitlements.filter((e) => e.status === 'ACTIVE');
    if (!active.length) throw new Error('no_active_entitlements');

    const member = await this.prisma.member.upsert({
      where: { email },
      update: { status: 'ACTIVE' },
      create: { email, status: 'ACTIVE' },
    });

    const localOrder = await this.prisma.order.create({
      data: {
        memberId: member.id,
        status: 'paid',
        currency: 'BRL',
        total: 3990,
        metadata: {
          aroOrderId: input.orderId,
          aroCustomerId: order.customer_id ?? null,
          aroEntitlements: active.map((e) => String(e.key)),
        } as unknown as object,
      },
    });

    await this.grantAroKeys(member.id, active, input.orderId);

    return {
      member_id: member.id,
      order_id: localOrder.id,
      granted: active.map((e) => String(e.key)).filter((k) => k in ARO_TO_LOCAL),
    };
  }
}
