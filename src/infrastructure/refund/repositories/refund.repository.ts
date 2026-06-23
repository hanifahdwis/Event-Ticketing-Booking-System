import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { IRefundRepository } from '../../../domain/refund/repositories/refund.repository.interface';
import { Refund } from '../../../domain/refund/aggregates/refund.aggregate';
import { RefundId } from '../../../domain/refund/value-objects/refund-id.vo';
import { RefundStatus } from '../../../domain/refund/value-objects/refund-status.vo';
import { RejectionReason } from '../../../domain/refund/value-objects/rejection-reason.vo';
import { PaymentReference } from '../../../domain/refund/value-objects/payment-reference.vo';
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
    const rejectionReason = row.rejection_reason
      ? RejectionReason.create(row.rejection_reason)
      : undefined;

    const paymentReference = row.payment_reference
      ? PaymentReference.create(row.payment_reference)
      : undefined;

    return Refund.reconstitute(
      RefundId.restore(row.id),
      row.booking_id,
      row.customer_id,
      new Money(parseFloat(row.amount), row.currency),
      row.status as RefundStatus,
      new Date(row.created_at),
      rejectionReason,
      paymentReference,
    );
  }
}