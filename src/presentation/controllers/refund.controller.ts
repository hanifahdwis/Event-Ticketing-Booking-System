import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { RequestRefundCommandHandler } from '../../application/refund/commands/request-refund.handler';
import { ApproveRefundCommandHandler } from '../../application/refund/commands/approve-refund.handler';
import { RejectRefundCommandHandler } from '../../application/refund/commands/reject-refund.handler';
import { MarkRefundPaidOutCommandHandler } from '../../application/refund/commands/mark-refund-paid-out.handler';

import { RequestRefundCommand } from '../../application/refund/commands/request-refund.command';
import { ApproveRefundCommand } from '../../application/refund/commands/approve-refund.command';
import { RejectRefundCommand } from '../../application/refund/commands/reject-refund.command';
import { MarkRefundPaidOutCommand } from '../../application/refund/commands/mark-refund-paid-out.command';

class RequestRefundRequestBody {
  customerId: string;
  bookingId: string;
}

class ApproveRefundRequestBody {
  organizerId: string;
}

class RejectRefundRequestBody {
  organizerId: string;
  reason: string;
}

class MarkRefundPaidOutRequestBody {
  adminId: string;
}


@Controller('refunds')
export class RefundController {
  constructor(
    private readonly requestRefundHandler: RequestRefundCommandHandler,
    private readonly approveRefundHandler: ApproveRefundCommandHandler,
    private readonly rejectRefundHandler: RejectRefundCommandHandler,
    private readonly markRefundPaidOutHandler: MarkRefundPaidOutCommandHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async requestRefund(@Body() body: RequestRefundRequestBody) {
    const command = new RequestRefundCommand(body.bookingId, body.customerId);
    return this.requestRefundHandler.execute(command);
  }

  @Patch(':refundId/approve')
  async approveRefund(
    @Param('refundId') refundId: string,
    @Body() body: ApproveRefundRequestBody,
  ) {
    const command = new ApproveRefundCommand(refundId, body.organizerId);
    return this.approveRefundHandler.execute(command);
  }

  @Patch(':refundId/reject')
  async rejectRefund(
    @Param('refundId') refundId: string,
    @Body() body: RejectRefundRequestBody,
  ) {
    const command = new RejectRefundCommand(
      refundId,
      body.organizerId,
      body.reason,
    );
    return this.rejectRefundHandler.execute(command);
  }

  @Patch(':refundId/paid-out')
  async markRefundPaidOut(
    @Param('refundId') refundId: string,
    @Body() body: MarkRefundPaidOutRequestBody,
  ) {
    const command = new MarkRefundPaidOutCommand(refundId, body.adminId);
    return this.markRefundPaidOutHandler.execute(command);
  }
}

