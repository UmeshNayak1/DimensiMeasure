import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertMeasurementSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Get user stats
  app.get("/api/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const stats = await storage.getUserStats(userId);
    res.json(stats);
  });

  // Get all measurements for the current user
  app.get("/api/measurements", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const measurements = await storage.getMeasurements(userId);
    res.json(measurements);
  });

  // Get a specific measurement
  app.get("/api/measurements/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid measurement ID");

    const measurement = await storage.getMeasurement(id);
    if (!measurement) return res.status(404).send("Measurement not found");
    if (measurement.userId !== req.user!.id) return res.sendStatus(403);

    res.json(measurement);
  });

  // Create a new measurement
  app.post("/api/measurements", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    
    // Validate the request body
    try {
      const validatedData = insertMeasurementSchema.parse({
        ...req.body,
        userId
      });
      
      const measurement = await storage.createMeasurement(validatedData);
      res.status(201).json(measurement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "An unexpected error occurred" });
      }
    }
  });

  // Delete a measurement
  app.delete("/api/measurements/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid measurement ID");

    const measurement = await storage.getMeasurement(id);
    if (!measurement) return res.status(404).send("Measurement not found");
    if (measurement.userId !== req.user!.id) return res.sendStatus(403);

    await storage.deleteMeasurement(id);
    res.sendStatus(204);
  });

  // API endpoint for future ML model integration - object detection
  app.post("/api/detect-object", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // This is a placeholder for the future ML model integration
    // In a real implementation, this would call the ML model service
    
    res.json({
      success: true,
      message: "ML object detection integration placeholder. Will be implemented with actual model.",
      objects: []
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
