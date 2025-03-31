// Database connection test utility
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { sql } = require('drizzle-orm');

// Load environment variables
require('dotenv').config();

async function testDatabaseConnection() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    console.log('Testing database connection...');
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    const db = drizzle(client);
    
    console.log('Database client created...');
    
    // Test a simple query
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('Database connection successful!', result);
    
    client.end();
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

testDatabaseConnection();