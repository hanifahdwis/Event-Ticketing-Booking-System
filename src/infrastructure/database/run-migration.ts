import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const MIGRATIONS = [
  '001_create_events_and_ticket_categories.sql',
  '002_create_bookings.sql',
  '003_create_tickets.sql',
  '004_create_refunds.sql',
];

async function runMigrations() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'event_ticketing',
  });

  await client.connect();
  console.log('Connected to PostgreSQL');

  const migrationsDir = path.join(__dirname, 'migrations');

  for (const migrationFile of MIGRATIONS) {
    const sqlPath = path.join(migrationsDir, migrationFile);
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    console.log(`Running migration: ${migrationFile}`);
    await client.query(sql);
    console.log(`${migrationFile} applied successfully`);
  }

  await client.end();
  console.log('\nAll migrations applied successfully');
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});