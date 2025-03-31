import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Create a postgres connection
const client = postgres(process.env.DATABASE_URL!);

// Create the Drizzle ORM instance with the schema
export const db = drizzle(client, { schema });