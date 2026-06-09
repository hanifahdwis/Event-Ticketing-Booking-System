import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import { databaseConfig } from './database/database.config';
import { EventRepository, DB_POOL } from './event/repositories/event.repository';
import { Event } from '../domain/event/aggregates/event.aggregate';
import { EventId } from '../domain/event/value-objects/event-id.vo';

async function main() {
  const pool = new Pool(databaseConfig);
  const repo = new EventRepository(pool as any);

  const event = Event.create({
    organizerId: 'org-test-001',
    name: 'Tech Seminar 2026',
    description: 'A great tech seminar',
    schedule: {
      startDate: new Date('2025-12-01T09:00:00'),
      endDate: new Date('2025-12-01T17:00:00'),
    },
    location: { address: 'Jl. Raya No. 1', city: 'Surabaya' },
    maxCapacity: 200,
  });

  await repo.save(event);
  console.log('US1: Event saved, id =', event.id.value);

  event.addTicketCategory({
    name: 'Regular',
    price: 100000,
    quota: 100,
    salesPeriod: {
      startDate: new Date('2025-10-01'),
      endDate: new Date('2025-11-30'),
    },
  });
  await repo.save(event);
  console.log('US4: Ticket category added');

  event.publish();
  await repo.save(event);
  console.log('US2: Event published, status =', event.status.value);

  const found = await repo.findById(event.id);
  console.log('FindById: event name =', found?.name.value, '| status =', found?.status.value);
  console.log('Ticket categories count:', found?.ticketCategories.length);

  const published = await repo.findAllPublished();
  console.log('FindAllPublished count:', published.length);

  await pool.end();
  console.log('\nAll checks passed!');
}

main().catch(console.error);