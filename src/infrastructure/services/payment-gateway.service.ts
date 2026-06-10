import { Injectable } from '@nestjs/common';
import {
  IPaymentGateway,
  PaymentResult,
} from '../../application/common/interfaces/payment-gateway.interface';

@Injectable()
export class PaymentGatewayService implements IPaymentGateway {
  async charge(
    bookingId: string,
    customerId: string,
    amount: number,
    currency: string,
  ): Promise<PaymentResult> {
    console.log(
      `[PaymentGateway] charge → bookingId=${bookingId}, customerId=${customerId}, amount=${amount} ${currency}`,
    );
    return {
      success: true,
      transactionId: `TXN-${Date.now()}`,
      paidAt: new Date(),
    };
  }
}