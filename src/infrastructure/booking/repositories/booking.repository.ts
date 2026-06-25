import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

import {IBookingRepository} from '../../../domain/booking/repositories/booking.repository.interface';
import { Booking } from '../../../domain/booking/aggregates/booking.aggregate';
import { BookingId } from '../../../domain/booking/value-objects/booking-id.vo';
import {
  BookingStatus,
  BookingStatusEnum,
} from '../../../domain/booking/value-objects/booking-status.vo';
import { PaymentDeadline } from '../../../domain/booking/value-objects/payment-deadline.vo';
import { Quantity } from '../../../domain/booking/value-objects/quantity.vo';
import { EventId } from '../../../domain/event/value-objects/event-id.vo';
import { TicketCategoryId } from '../../../domain/event/value-objects/ticket-category-id.vo';
import { Money } from '../../../domain/shared/value-objects/money.vo';
import { DB_POOL } from '../../event/repositories/event.repository';

@Injectable()
export class BookingRepository implements IBookingRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async findById(id: BookingId): Promise<Booking | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM bookings WHERE id = $1',
        [id.value],
      );
      if (result.rows.length === 0) return null;
      return this.mapRowToBooking(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async findActiveByCustomerAndEvent(
    customerId: string,
    eventId: string,
  ): Promise<Booking | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM bookings
         WHERE customer_id = $1
           AND event_id    = $2
           AND status IN ('PendingPayment', 'Paid')
         LIMIT 1`,
        [customerId, eventId],
      );
      if (result.rows.length === 0) return null;
      return this.mapRowToBooking(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async findExpiredPendingBookings(at: Date): Promise<Booking[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM bookings
         WHERE status = 'PendingPayment'
           AND payment_deadline < $1`,
        [at],
      );
      return result.rows.map((row) => this.mapRowToBooking(row));
    } finally {
      client.release();
    }
  }

  async findAllPaidByEventId(eventId: string): Promise<Booking[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM bookings
         WHERE event_id = $1
           AND status = 'Paid'`,
        [eventId],
      );
      return result.rows.map((row) => this.mapRowToBooking(row));
    } finally {
      client.release();
    }
  }

  async findAllByEventId(eventId: string): Promise<Booking[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM bookings WHERE event_id = $1`,
        [eventId],
      );
      return result.rows.map((row) => this.mapRowToBooking(row));
    } finally {
      client.release();
    }
  }

  async save(booking: Booking): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO bookings (
            id,
            customer_id,
            customer_name,
            event_id,
            ticket_category_id,
            quantity,
            total_price_amount,
            total_price_currency,
            status,
            payment_deadline,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            status               = EXCLUDED.status,
            total_price_amount   = EXCLUDED.total_price_amount,
            total_price_currency = EXCLUDED.total_price_currency,
            updated_at           = NOW()`,
        [
          booking.id.value,
          booking.customerId,
          booking.customerName,
          booking.eventId.value,
          booking.ticketCategoryId.value,
          booking.quantity.value,
          booking.totalPrice.amount,
          booking.totalPrice.currency,
          booking.status.value,
          booking.paymentDeadline.value,
        ],
      );
    } finally {
      client.release();
    }
  }

  private mapRowToBooking(row: any): Booking {
    return Booking.reconstitute(
      new BookingId(row.id),
      row.customer_id,
      row.customer_name ?? '',
      new EventId(row.event_id),
      new TicketCategoryId(row.ticket_category_id),
      new Quantity(row.quantity),
      new Money(parseFloat(row.total_price_amount), row.total_price_currency),
      new BookingStatus(row.status as BookingStatusEnum),
      new PaymentDeadline(new Date(row.payment_deadline)),
    );
  }
}