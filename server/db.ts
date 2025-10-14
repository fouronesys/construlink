import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Allow self-signed certificates for database connections
// This is common in private deployments (CapRover, self-hosted databases)
// For production with proper certificates, set DB_SSL_REJECT_UNAUTHORIZED=true
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized }
});

export const db = drizzle({ client: pool, schema });