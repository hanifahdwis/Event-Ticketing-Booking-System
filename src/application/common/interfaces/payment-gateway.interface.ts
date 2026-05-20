export interface PaymentResult {
  success: boolean;
  transactionId: string;
  paidAt: Date;
}

export interface IPaymentGateway {
  charge(
    bookingId: string,
    customerId: string,
    amount: number,
    currency: string,
  ): Promise<PaymentResult>;
}

export const PAYMENT_GATEWAY = Symbol('IPaymentGateway');