import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

import {ITicketRepository} from '../../../domain/ticket/repositories/ticket.repository.interface';
import { Ticket } from '../../../domain/ticket/aggregates/ticket.aggregate';
import { TicketId } from '../../../domain/ticket/value-objects/ticket-id.vo';
import { TicketCode } from '../../../domain/ticket/value-objects/ticket-code.vo';
import {
  TicketStatus,
  TicketStatusEnum,
} from '../../../domain/ticket/value-objects/ticket-status.vo';
import { BookingId } from '../../../domain/booking/value-objects/booking-id.vo';
import { EventId } from '../../../domain/event/value-objects/event-id.vo';
import { TicketCategoryId } from '../../../domain/event/value-objects/ticket-category-id.vo';
import { DB_POOL } from '../../event/repositories/event.repository';

@Injectable()
export class TicketRepository implements ITicketRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async findById(id: TicketId): Promise<Ticket | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM tickets WHERE id = $1',
        [id.value],
      );
      if (result.rows.length === 0) return null;
      return this.mapRowToTicket(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async findByCode(code: TicketCode): Promise<Ticket | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM tickets WHERE ticket_code = $1',
        [code.value],
      );
      if (result.rows.length === 0) return null;
      return this.mapRowToTicket(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async findByBookingId(bookingId: BookingId): Promise<Ticket[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM tickets WHERE booking_id = $1',
        [bookingId.value],
      );
      return result.rows.map((row) => this.mapRowToTicket(row));
    } finally {
      client.release();
    }
  }

  async findByEventId(eventId: EventId): Promise<Ticket[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM tickets WHERE event_id = $1',
        [eventId.value],
      );
      return result.rows.map((row) => this.mapRowToTicket(row));
    } finally {
      client.release();
    }
  }

  async save(ticket: Ticket): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO tickets (
            id,
            booking_id,
            customer_id,
            event_id,
            ticket_category_id,
            ticket_code,
            status,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            status     = EXCLUDED.status,
            updated_at = NOW()`,
        [
          ticket.id.value,
          ticket.bookingId.value,
          ticket.customerId,
          ticket.eventId.value,
          ticket.ticketCategoryId.value,
          ticket.code.value,
          ticket.status.value,
        ],
      );
    } finally {
      client.release();
    }
  }

  async saveAll(tickets: Ticket[]): Promise<void> {
    if (tickets.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const ticket of tickets) {
        await client.query(
          `INSERT INTO tickets (
              id,
              booking_id,
              customer_id,
              event_id,
              ticket_category_id,
              ticket_code,
              status,
              created_at,
              updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET
              status     = EXCLUDED.status,
              updated_at = NOW()`,
          [
            ticket.id.value,
            ticket.bookingId.value,
            ticket.customerId,
            ticket.eventId.value,
            ticket.ticketCategoryId.value,
            ticket.code.value,
            ticket.status.value,
          ],
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  private mapRowToTicket(row: any): Ticket {
    return Ticket.reconstitute(
      new TicketId(row.id),
      new BookingId(row.booking_id),
      row.customer_id,
      new EventId(row.event_id),
      new TicketCategoryId(row.ticket_category_id),
      new TicketCode(row.ticket_code),
      new TicketStatus(row.status as TicketStatusEnum),
    );
  }
}