import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
});

export const measurements = pgTable("measurements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  objectName: text("object_name").notNull(),
  dimensions: text("dimensions").notNull(),
  method: text("method").notNull(),
  imageUrl: text("image_url"),
  confidence: integer("confidence"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  data: jsonb("data")
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
});

export const insertMeasurementSchema = createInsertSchema(measurements).pick({
  userId: true,
  objectName: true,
  dimensions: true,
  method: true,
  imageUrl: true,
  confidence: true,
  data: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMeasurement = z.infer<typeof insertMeasurementSchema>;
export type Measurement = typeof measurements.$inferSelect;
