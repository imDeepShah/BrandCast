import { createClient } from '@clickhouse/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD,
});

async function check() {
  const query = `SELECT id, brand_name FROM brands`;
  const resultSet = await clickhouse.query({ query, format: 'JSONEachRow' });
  const data = await resultSet.json();
  console.log("Brands in DB:", data);
  process.exit(0);
}
check();
