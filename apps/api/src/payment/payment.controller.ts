import {
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { PaymentIntentStatus, PaymentProvider } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { SepayService } from './sepay.service';

@Controller('bookings/:bookingId/payment')
export class PaymentController {
  constructor(
    private readonly sepayService: SepayService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('sepay')
  @HttpCode(200)
  createSepayIntent(
    @Param('bookingId') bookingId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.sepayService.createIntentForBooking(bookingId, idempotencyKey);
  }

  @Public()
  @Get('status')
  async getPaymentStatus(@Param('bookingId') bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      select: {
        id: true,
        orderCode: true,
        status: true,
        paymentIntents: {
          where: {
            provider: PaymentProvider.SEPAY,
            status: {
              in: [
                PaymentIntentStatus.PENDING,
                PaymentIntentStatus.PAID,
                PaymentIntentStatus.EXPIRED,
                PaymentIntentStatus.MANUAL_REVIEW,
              ],
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            id: true,
            status: true,
            amount: true,
            expiresAt: true,
            providerOrderCode: true,
          },
        },
      },
    });

    return {
      bookingId,
      bookingStatus: booking?.status ?? null,
      orderCode: booking?.orderCode ?? null,
      intent: booking?.paymentIntents[0] ?? null,
    };
  }
}
