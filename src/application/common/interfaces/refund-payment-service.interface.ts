export interface RefundPayoutResult {
  success: boolean;
  paymentReference: string;
  paidOutAt: Date;
}

export interface IRefundPaymentService {
  payout(
    refundId: string,
    customerId: string,
    amount: number,
    currency: string,
  ): Promise<RefundPayoutResult>;
}

export const REFUND_PAYMENT_SERVICE = Symbol('IRefundPaymentService');