import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { Inject } from '@nestjs/common';
import { IEventRepository } from '../../../domain/event/repositories/event.repository.interface';
import { Event } from '../../../domain/event/aggregates/event.aggregate';
import { EventId } from '../../../domain/event/value-objects/event-id.vo';
import { EventName } from '../../../domain/event/value-objects/event-name.vo';
import { EventSchedule } from '../../../domain/event/value-objects/event-schedule.vo';
import { EventStatus } from '../../../domain/event/value-objects/event-status.vo';
import { EventStatusEnum } from '../../../domain/event/value-objects/event-status.vo';
import { Location } from '../../../domain/event/value-objects/location.vo';
import { Capacity } from '../../../domain/event/value-objects/capacity.vo';
import { TicketCategory } from '../../../domain/event/entities/ticket-category.entity';
import { TicketCategoryId } from '../../../domain/event/value-objects/ticket-category-id.vo';
import { TicketCategoryName } from '../../../domain/event/value-objects/ticket-category-name.vo';
import { Money } from '../../../domain/shared/value-objects/money.vo';
import { Quota } from '../../../domain/event/value-objects/quota.vo';
import { SalesPeriod } from '../../../domain/event/value-objects/sales-period.vo';

export const DB_POOL = Symbol('DB_POOL');

@Injectable()
export class EventRepository implements IEventRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async findById(id: EventId): Promise<Event | null> {
    const client = await this.pool.connect();
    try {
      const eventResult = await client.query(
        'SELECT * FROM events WHERE id = $1',
        [id.value],
      );

      if (eventResult.rows.length === 0) return null;

      const row = eventResult.rows[0];

      const tcResult = await client.query(
        'SELECT * FROM ticket_categories WHERE event_id = $1',
        [id.value],
      );

      const ticketCategories = tcResult.rows.map((tc) =>
        this.mapRowToTicketCategory(tc),
      );

      return this.mapRowToEvent(row, ticketCategories);
    } finally {
      client.release();
    }
  }

  async save(event: Event): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO events (id, organizer_id, name, description, start_date, end_date, address, city, max_capacity, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           start_date = EXCLUDED.start_date,
           end_date = EXCLUDED.end_date,
           address = EXCLUDED.address,
           city = EXCLUDED.city,
           max_capacity = EXCLUDED.max_capacity,
           status = EXCLUDED.status,
           updated_at = NOW()`,
        [
          event.id.value,
          event.organizerId,
          event.name.value,
          event.description,
          event.schedule.startDate,
          event.schedule.endDate,
          event.location.address,
          event.location.city,
          event.maxCapacity.value,
          event.status.value,
        ],
      );

      for (const tc of event.ticketCategories) {
        await client.query(
          `INSERT INTO ticket_categories
             (id, event_id, name, price_amount, price_currency, quota_total, quota_remaining, sales_start_date, sales_end_date, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             price_amount = EXCLUDED.price_amount,
             price_currency = EXCLUDED.price_currency,
             quota_total = EXCLUDED.quota_total,
             quota_remaining = EXCLUDED.quota_remaining,
             sales_start_date = EXCLUDED.sales_start_date,
             sales_end_date = EXCLUDED.sales_end_date,
             is_active = EXCLUDED.is_active,
             updated_at = NOW()`,
          [
            tc.id.value,
            event.id.value,
            tc.name.value,
            tc.price.amount,
            tc.price.currency,
            tc.quota.total,
            tc.quota.remaining,
            tc.salesPeriod.startDate,
            tc.salesPeriod.endDate,
            tc.isActive,
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

  async findAllPublished(): Promise<Event[]> {
    const client = await this.pool.connect();
    try {
      const eventResult = await client.query(
        "SELECT * FROM events WHERE status = 'Published' ORDER BY start_date ASC",
      );

      if (eventResult.rows.length === 0) return [];

      const events: Event[] = [];

      for (const row of eventResult.rows) {
        const tcResult = await client.query(
          'SELECT * FROM ticket_categories WHERE event_id = $1',
          [row.id],
        );
        const ticketCategories = tcResult.rows.map((tc) =>
          this.mapRowToTicketCategory(tc),
        );
        events.push(this.mapRowToEvent(row, ticketCategories));
      }

      return events;
    } finally {
      client.release();
    }
  }

  private mapRowToEvent(row: any, ticketCategories: TicketCategory[]): Event {
    return Event.reconstitute(
      new EventId(row.id),
      row.organizer_id,
      new EventName(row.name),
      row.description,
      new EventSchedule(new Date(row.start_date), new Date(row.end_date)),
      new Location(row.address, row.city),
      new Capacity(row.max_capacity),
      new EventStatus(row.status as EventStatusEnum),
      ticketCategories,
    );
  }

  private mapRowToTicketCategory(row: any): TicketCategory {
    return new TicketCategory({
      id: new TicketCategoryId(row.id),
      name: new TicketCategoryName(row.name),
      price: new Money(parseFloat(row.price_amount), row.price_currency),
      quota: new Quota(row.quota_total, row.quota_remaining),
      salesPeriod: new SalesPeriod(
        new Date(row.sales_start_date),
        new Date(row.sales_end_date),
      ),
      isActive: row.is_active,
    });
  }
}