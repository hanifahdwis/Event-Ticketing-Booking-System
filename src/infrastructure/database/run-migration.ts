import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'event_ticketing',
  });

  await client.connect();
  console.log('Connected to PostgreSQL');

  const sqlPath = path.join(
    __dirname,
    'migrations',
    '001_create_events_and_ticket_categories.sql',
  );
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  await client.query(sql);
  console.log('Migration applied successfully');

  await client.end();
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});