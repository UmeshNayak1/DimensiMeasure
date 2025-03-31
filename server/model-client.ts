import fetch from 'node-fetch';

// Configuration for model server
const MODEL_API_URL = `http://localhost:${process.env.PYTHON_API_PORT || 5001}`;

interface MeasurementResult {
  success: boolean;
  message: string;
  measurements: Array<{
    objectName: string;
    dimensions: string;
    confidence: number;
    bbox: [number, number, number, number];
  }>;
  annotatedImage?: string; // Base64 encoded image with bounding boxes and measurements
}

/**
 * Client for interacting with the Python measurement model API
 */
export class ModelClient {
  /**
   * Check if the model server is running
   * @returns true if the server is running, false otherwise
   */
  async isAlive(): Promise<boolean> {
    try {
      const response = await fetch(`${MODEL_API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json() as { status: string };
        return data.status === 'ok';
      }
      
      return false;
    } catch (error) {
      console.error('Error checking model server health:', error);
      return false;
    }
  }
  
  /**
   * Process an image and get measurement results
   * @param imageBase64 Base64 encoded image data
   * @returns Measurement results
   */
  async processMeasurement(imageBase64: string): Promise<MeasurementResult> {
    try {
      const response = await fetch(`${MODEL_API_URL}/measure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json() as MeasurementResult;
      return result;
    } catch (error) {
      console.error('Error processing measurement:', error);
      return {
        success: false,
        message: `Error communicating with model server: ${error instanceof Error ? error.message : String(error)}`,
        measurements: [],
      };
    }
  }
}

// Export a singleton instance
export const modelClient = new ModelClient();