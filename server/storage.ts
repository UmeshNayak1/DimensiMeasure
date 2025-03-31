import { users, type User, type InsertUser, measurements, type Measurement, type InsertMeasurement } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";

// Setup the session store
const PgSession = connectPgSimple(session);
const sessionStore = new PgSession({
  conString: process.env.DATABASE_URL,
  createTableIfMissing: true
});

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Measurement related methods
  getMeasurements(userId: number): Promise<Measurement[]>;
  getMeasurement(id: number): Promise<Measurement | undefined>;
  createMeasurement(measurement: InsertMeasurement): Promise<Measurement>;
  deleteMeasurement(id: number): Promise<void>;
  
  // Stats
  getUserStats(userId: number): Promise<{
    totalMeasurements: number;
    recentMeasurements: number;
    savedImages: number;
    avgSize: string;
  }>;
  
  sessionStore: any; // Using 'any' to avoid type issues
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = sessionStore;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getMeasurements(userId: number): Promise<Measurement[]> {
    const results = await db
      .select()
      .from(measurements)
      .where(eq(measurements.userId, userId))
      .orderBy(desc(measurements.createdAt));
    
    return results;
  }

  async getMeasurement(id: number): Promise<Measurement | undefined> {
    const [measurement] = await db
      .select()
      .from(measurements)
      .where(eq(measurements.id, id));
    
    return measurement || undefined;
  }

  async createMeasurement(insertMeasurement: InsertMeasurement): Promise<Measurement> {
    const [measurement] = await db
      .insert(measurements)
      .values(insertMeasurement)
      .returning();
    
    return measurement;
  }

  async deleteMeasurement(id: number): Promise<void> {
    await db
      .delete(measurements)
      .where(eq(measurements.id, id));
  }

  async getUserStats(userId: number): Promise<{
    totalMeasurements: number;
    recentMeasurements: number;
    savedImages: number;
    avgSize: string;
  }> {
    // Get all user measurements
    const userMeasurements = await this.getMeasurements(userId);
    const totalMeasurements = userMeasurements.length;
    
    // Count measurements from the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentMeasurements = userMeasurements.filter(
      m => m.createdAt && new Date(m.createdAt) >= oneWeekAgo
    ).length;
    
    // Count measurements with images
    const savedImages = userMeasurements.filter(m => m.imageUrl).length;
    
    // Calculate average size (this is a simplified example)
    let totalHeight = 0;
    let validMeasurements = 0;
    
    userMeasurements.forEach(m => {
      try {
        // Assume dimensions are stored in the format "width × height × depth"
        const parts = m.dimensions.split('×');
        if (parts.length >= 2) {
          const height = parseFloat(parts[1].trim());
          if (!isNaN(height)) {
            totalHeight += height;
            validMeasurements++;
          }
        }
      } catch (e) {
        // Skip invalid dimensions
      }
    });
    
    const avgSize = validMeasurements > 0 
      ? `${(totalHeight / validMeasurements).toFixed(1)} cm` 
      : "N/A";
    
    return {
      totalMeasurements,
      recentMeasurements,
      savedImages,
      avgSize
    };
  }
}

export const storage = new DatabaseStorage();
