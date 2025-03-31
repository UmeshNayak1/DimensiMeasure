const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');

const runMigration = async () => {
  console.log('Starting database migration...');
  
  try {
    // Create a migration client
    const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
    
    // Create a Drizzle instance with the migration client
    const db = drizzle(migrationClient);
    
    // Run the migrations
    await migrate(db, { migrationsFolder: "drizzle" });
    
    console.log('Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();