import { users, type User, type InsertUser, measurements, type Measurement, type InsertMeasurement } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private measurements: Map<number, Measurement>;
  currentUserId: number;
  currentMeasurementId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.measurements = new Map();
    this.currentUserId = 1;
    this.currentMeasurementId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMeasurements(userId: number): Promise<Measurement[]> {
    return Array.from(this.measurements.values())
      .filter(measurement => measurement.userId === userId)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Sort descending (newest first)
      });
  }

  async getMeasurement(id: number): Promise<Measurement | undefined> {
    return this.measurements.get(id);
  }

  async createMeasurement(insertMeasurement: InsertMeasurement): Promise<Measurement> {
    const id = this.currentMeasurementId++;
    const createdAt = new Date();
    const measurement: Measurement = { ...insertMeasurement, id, createdAt };
    this.measurements.set(id, measurement);
    return measurement;
  }

  async deleteMeasurement(id: number): Promise<void> {
    this.measurements.delete(id);
  }

  async getUserStats(userId: number): Promise<{
    totalMeasurements: number;
    recentMeasurements: number;
    savedImages: number;
    avgSize: string;
  }> {
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

export const storage = new MemStorage();
