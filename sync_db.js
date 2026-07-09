import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read local .env file manually to avoid external dependency requirements
const envPath = path.join(__dirname, '.env');
let connectionString = process.env.DATABASE_URL;

if (!connectionString && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^DATABASE_URL=(.+)$/m);
  if (match) {
    connectionString = match[1].trim();
  }
}

if (!connectionString) {
  console.error('Error: DATABASE_URL not found in environment or .env file');
  process.exit(1);
}

const schemaPath = path.join(__dirname, 'schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  console.log('Connecting to Supabase PostgreSQL database...');
  try {
    await client.connect();
    console.log('Connected! Executing schema.sql sync queries...');
    await client.query(sql);
    console.log('Database schema successfully synchronized!');
  } catch (err) {
    console.error('Database sync failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}
run();
