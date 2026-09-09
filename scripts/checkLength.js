import { createClient } from '@clickhouse/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD,
});

async function run() {
  const rs = await clickhouse.query({ query: 'SELECT length(embedding) as len FROM brands LIMIT 1', format: 'JSONEachRow' });
  const data = await rs.json();
  console.log(data);
  process.exit(0);
}
run();
