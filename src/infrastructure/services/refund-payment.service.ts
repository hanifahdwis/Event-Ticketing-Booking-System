import { Injectable } from '@nestjs/common';
import {
  IRefundPaymentService,
  RefundPayoutResult,
} from '../../application/common/interfaces/refund-payment-service.interface';

@Injectable()
export class RefundPaymentService implements IRefundPaymentService {
  async payout(
    refundId: string,
    customerId: string,
    amount: number,
    currency: string,
  ): Promise<RefundPayoutResult> {
    console.log(
      `[RefundPaymentService] payout → refundId=${refundId}, customerId=${customerId}, amount=${amount} ${currency}`,
    );
    return {
      success: true,
      paymentReference: `REF-${Date.now()}`,
      paidOutAt: new Date(),
    };
  }
}