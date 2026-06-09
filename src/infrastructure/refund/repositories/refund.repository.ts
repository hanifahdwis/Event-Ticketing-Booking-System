import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

import {
  IRefundRepository,
} from '../../../domain/refund/repositories/refund.repository.interface';
import { Refund } from '../../../domain/refund/aggregates/refund.aggregate';
import { RefundId } from '../../../domain/refund/value-objects/refund-id.vo';
import { RefundStatus } from '../../../domain/refund/value-objects/refund-status.vo';
import { RejectionReason } from '../../../domain/refund/value-objects/rejection-reason.vo';
import { PaymentReference } from '../../../domain/refund/value-objects/payment-reference.vo';
import { RefundEligibilityDomainService } from '../../../domain/refund/services/refund-eligibility.domain-service';
import { Money } from '../../../domain/shared/value-objects/money.vo';
import { DB_POOL } from '../../event/repositories/event.repository';

@Injectable()
export class RefundRepository implements IRefundRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async save(refund: Refund): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO refunds (
            id,
            booking_id,
            customer_id,
            amount,
            currency,
            status,
            rejection_reason,
            payment_reference,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            status             = EXCLUDED.status,
            rejection_reason   = EXCLUDED.rejection_reason,
            payment_reference  = EXCLUDED.payment_reference,
            updated_at         = NOW()`,
        [
          refund.id.getValue(),
          refund.bookingId,
          refund.customerId,
          refund.amount.amount,
          refund.amount.currency,
          refund.status,
          refund.rejectionReason?.getValue() ?? null,
          refund.paymentReference?.getValue() ?? null,
        ],
      );
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<Refund | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM refunds WHERE id = $1',
        [id],
      );
      if (result.rows.length === 0) return null;
      return this.mapRowToRefund(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async findByBookingId(bookingId: string): Promise<Refund | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM refunds WHERE booking_id = $1 LIMIT 1',
        [bookingId],
      );
      if (result.rows.length === 0) return null;
      return this.mapRowToRefund(result.rows[0]);
    } finally {
      client.release();
    }
  }

  private mapRowToRefund(row: any): Refund {
    const eligibilityService = new RefundEligibilityDomainService();

    const refund = this.reconstituteRefund(row, eligibilityService);
    return refund;
  }

  private reconstituteRefund(
    row: any,
    eligibilityService: RefundEligibilityDomainService,
  ): Refund {
    const mockBooking = { id: row.booking_id, status: 'Paid' };
    const mockTickets = [{ status: 'Active' }];
    const mockEvent = {
      status: 'Published',
      startDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 
    };

    const alwaysEligibleService = {
      isEligible: () => true,
    } as unknown as RefundEligibilityDomainService;

    const refund = Refund.request(
      RefundId.restore(row.id),
      mockBooking,
      mockTickets,
      mockEvent,
      row.customer_id,
      new Money(parseFloat(row.amount), row.currency),
      alwaysEligibleService,
      new Date(row.created_at),
    );

    refund.clearDomainEvents();
    const status = row.status as RefundStatus;

    if (status === RefundStatus.Approved) {
      refund.approve();
      refund.clearDomainEvents();
    } else if (status === RefundStatus.Rejected) {
      refund.reject(RejectionReason.create(row.rejection_reason ?? 'Unknown'));
      refund.clearDomainEvents();
    } else if (status === RefundStatus.PaidOut) {
      refund.approve();
      refund.clearDomainEvents();
      refund.markAsPaidOut(
        PaymentReference.create(row.payment_reference ?? ''),
      );
      refund.clearDomainEvents();
    }

    return refund;
  }
}