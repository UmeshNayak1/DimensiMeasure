import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import 'dotenv/config';

// Log database connection attempt
console.log('Database URL exists:', !!process.env.DATABASE_URL);

let client: ReturnType<typeof postgres>;
let dbInstance: ReturnType<typeof drizzle<typeof schema>>;

// Create postgres connection with additional options
try {
  // Create a postgres connection with error handling
  client = postgres(process.env.DATABASE_URL!, {
    max: 10, // Maximum number of connections
    idle_timeout: 20, // Max seconds a connection can be idle
    connect_timeout: 10, // Max seconds to wait for connection
    debug: true, // Enable debug logs
  });

  // Create the Drizzle ORM instance with the schema
  dbInstance = drizzle(client, { schema });
  
  console.log('Database connection initialized successfully');
} catch (error) {
  console.error('Failed to initialize database connection:', error);
  // Provide a fallback DB instance that will throw clear errors if used
  dbInstance = new Proxy({} as any, {
    get: (_target: any, prop: string | symbol) => {
      if (prop === 'then') return null; // For await compatibility
      throw new Error(`Database connection failed. Cannot access ${String(prop)}`);
    }
  }) as any;
}

export const db = dbInstance;