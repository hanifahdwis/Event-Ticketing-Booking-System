import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MarkRefundPaidOutCommand } from './mark-refund-paid-out.command';
import { MarkRefundPaidOutResponseDto } from '../dtos/mark-refund-paid-out.dto';
import {
  IRefundRepository,
  REFUND_REPOSITORY,
} from '../../../domain/refund/repositories/refund.repository.interface';
import {
  IRefundPaymentService,
  REFUND_PAYMENT_SERVICE,
} from '../../common/interfaces/refund-payment-service.interface';
import { PaymentReference } from '../../../domain/refund/value-objects/payment-reference.vo';
import { RefundStatus } from '../../../domain/refund/value-objects/refund-status.vo';

@Injectable()
export class MarkRefundPaidOutCommandHandler {
  constructor(
    @Inject(REFUND_REPOSITORY)
    private readonly refundRepository: IRefundRepository,

    @Inject(REFUND_PAYMENT_SERVICE)
    private readonly refundPaymentService: IRefundPaymentService,
  ) {}

  
  async execute(command: MarkRefundPaidOutCommand): Promise<MarkRefundPaidOutResponseDto> {
    const refund = await this.refundRepository.findById(command.refundId);
    if (!refund) {
      throw new NotFoundException(`Refund not found: ${command.refundId}`);
    }

    if (refund.status !== RefundStatus.Approved) {
      throw new BadRequestException(
        'A refund can only be marked as paid out if its status is Approved',
      );
    }

    const payout = await this.refundPaymentService.payout(
      refund.id.getValue(),
      refund.customerId,
      refund.amount.amount,
      refund.amount.currency,
    );

    if (!payout.success) {
      throw new BadRequestException('Refund payout failed');
    }

    const paymentReference = PaymentReference.create(payout.paymentReference);

    try {
      refund.markAsPaidOut(paymentReference);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
    await this.refundRepository.save(refund);


    const dto = new MarkRefundPaidOutResponseDto();
    dto.refundId = refund.id.getValue();
    dto.bookingId = refund.bookingId;
    dto.status = refund.status;
    dto.paymentReference = paymentReference.getValue();
    dto.paidOutAt = payout.paidOutAt;

    return dto;
  }
}