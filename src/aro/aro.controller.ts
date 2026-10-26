import { BadRequestException, Body, Controller, Headers, HttpCode, Logger, Post, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthedRequest, SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { AroService } from './aro.service';

@Controller()
export class AroController {
  private readonly logger = new Logger(AroController.name);

  constructor(private readonly aro: AroService) {}

  /** ARO outbound webhook — raw-body HMAC verification, fail-closed. */
  @Post('webhooks/aro')
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-aro-timestamp') timestamp?: string,
    @Headers('x-aro-signature') signature?: string,
    @Headers('x-aro-event-id') eventId?: string,
  ) {
    const raw =
      typeof req.rawBody === 'string'
        ? req.rawBody
        : req.rawBody
          ? Buffer.from(req.rawBody).toString('utf8')
          : '';
    if (!raw) throw new BadRequestException('missing_body');
    if (!this.aro.verifySignature(raw, timestamp ?? '', signature)) {
      this.logger.warn(`aro webhook signature rejected event=${eventId ?? 'unknown'}`);
      return { ok: false, error: 'invalid_signature' };
    }
    let event: Parameters<AroService['handleEvent']>[0];
    try {
      event = JSON.parse(raw);
    } catch {
      throw new BadRequestException('invalid_json');
    }
    const result = await this.aro.handleEvent(event);
    return { ok: true, ...result };
  }

  /**
   * Attach a paid ARO order to the AUTHENTICATED member identity.
   * SECURITY: the email comes exclusively from the verified Supabase JWT —
   * the browser can never claim an identity, only an order id it legitimately
   * paid for. The ARO remains the authority: order status + entitlements are
   * re-verified server-to-server before any grant (GO mandate 2026-10-26).
   */
  @UseGuards(SupabaseJwtGuard)
  @Post('access/activate')
  @HttpCode(200)
  async activate(@Req() req: AuthedRequest, @Body() body: { order_id?: string }) {
    const email = req.authUser.email;
    if (!email) throw new BadRequestException('identity_without_email');
    if (!body?.order_id) throw new BadRequestException('missing_fields');
    return this.aro.activate({ email, orderId: body.order_id });
  }
}
