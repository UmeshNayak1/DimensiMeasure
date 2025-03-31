import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertMeasurementSchema } from "@shared/schema";
import { modelClient } from "./model-client";
import path from "path";

// Variable to track the model server process
let modelServerProcess: any = null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Start the Python model server
  try {
    // Use dynamic import for ES modules
    import('../model/start_model_server.js').then(modelStarter => {
      modelServerProcess = modelStarter.startModelServer();
      console.log('Custom measurement model server started');
    }).catch(err => {
      console.error('Failed to import measurement model starter:', err);
    });
  } catch (error) {
    console.error('Failed to start measurement model server:', error);
  }

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

  // Check model health
  app.get("/api/model/health", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const isAlive = await modelClient.isAlive();
      res.json({ status: isAlive ? 'online' : 'offline' });
    } catch (error) {
      console.error("Error checking model health:", error);
      res.status(500).json({ status: 'error', message: 'Failed to check model health' });
    }
  });

  // Process image with custom model
  app.post("/api/model/measure", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      if (!req.body.image) {
        return res.status(400).json({ error: 'No image data provided' });
      }

      // Process the image with our custom model
      const result = await modelClient.processMeasurement(req.body.image);

      if (!result.success) {
        return res.status(500).json({ 
          error: result.message || 'Failed to process image' 
        });
      }

      // Include the annotated image in the response
      res.json(result);
    } catch (error) {
      console.error("Error processing image with model:", error);
      res.status(500).json({ 
        error: 'Internal server error processing the image',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  
  // Clean up the model server when the HTTP server closes
  httpServer.on('close', () => {
    if (modelServerProcess) {
      console.log('Stopping measurement model server...');
      try {
        modelServerProcess.kill();
      } catch (error) {
        console.error('Error stopping model server:', error);
      }
    }
  });

  return httpServer;
}
