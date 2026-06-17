import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';
import { RequestRefundCommandHandler } from './commands/request-refund.handler';
import { ApproveRefundCommandHandler } from './commands/approve-refund.handler';
import { RejectRefundCommandHandler } from './commands/reject-refund.handler';
import { MarkRefundPaidOutCommandHandler } from './commands/mark-refund-paid-out.handler';

@Module({
  imports: [InfrastructureModule],
  providers: [
    RequestRefundCommandHandler,
    ApproveRefundCommandHandler,
    RejectRefundCommandHandler,
    MarkRefundPaidOutCommandHandler,
  ],
  exports: [
    RequestRefundCommandHandler,
    ApproveRefundCommandHandler,
    RejectRefundCommandHandler,
    MarkRefundPaidOutCommandHandler,
  ],
})
export class RefundApplicationModule {}

