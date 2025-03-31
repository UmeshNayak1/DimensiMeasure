import React, { useState, useCallback } from 'react';
import { Layout } from '@/components/layout/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useCamera } from '@/hooks/use-camera';
import { WebcamWithProcessing } from '@/components/ui/webcam';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { InsertMeasurement } from '@shared/schema';

export default function RealtimeMeasurement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasCamera, requestCameraPermission } = useCamera();
  
  const [cameraActive, setCameraActive] = useState(false);
  const [measurementUnit, setMeasurementUnit] = useState('cm');
  const [measurementMode, setMeasurementMode] = useState('auto');
  const [detectionModel, setDetectionModel] = useState('yolo5');
  const [detectionSpeed, setDetectionSpeed] = useState('balanced');
  const [saveMeasurements, setSaveMeasurements] = useState(true);
  const [highAccuracy, setHighAccuracy] = useState(false);
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [measurementData, setMeasurementData] = useState<{
    objectName: string;
    dimensions: string;
    confidence: number;
    bbox?: [number, number, number, number]; // x1, y1, x2, y2
  } | null>(null);
  
  // Handle camera enable
  const handleEnableCamera = async () => {
    const hasAccess = await requestCameraPermission();
    if (hasAccess) {
      setCameraActive(true);
    } else {
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to use real-time measurement",
        variant: "destructive"
      });
    }
  };
  
  // Handle image capture
  const handleCapture = useCallback(async (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setIsProcessing(true);
    
    try {
      // Use our custom ML model through the API
      const response = await fetch('/api/model/measure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageSrc,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.measurements && result.measurements.length > 0) {
        // Use the highest confidence result
        const bestResult = result.measurements[0];
        setMeasurementData({
          objectName: bestResult.objectName,
          dimensions: bestResult.dimensions,
          confidence: Math.round(bestResult.confidence * 100),
          bbox: bestResult.bbox, // Include the bounding box data
        });
      } else {
        toast({
          title: "No objects detected",
          description: "The model couldn't detect any objects in the image.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process the image",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);
  
  // Save measurement to database
  const { mutate: saveMeasurement, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!user || !measurementData) {
        throw new Error("No measurement data available");
      }
      
      const measurementToSave: InsertMeasurement = {
        userId: user.id,
        objectName: measurementData.objectName,
        dimensions: measurementData.dimensions,
        method: "Camera",
        confidence: measurementData.confidence,
        imageUrl: capturedImage || undefined,
        data: { objects: [measurementData] }
      };
      
      const res = await apiRequest("POST", "/api/measurements", measurementToSave);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/measurements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: "Measurement saved",
        description: "Your measurement has been saved successfully.",
      });
      
      // Reset for new measurement
      setCapturedImage(null);
      setMeasurementData(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save measurement: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Start a new measurement (reset state)
  const handleNewMeasurement = () => {
    setCapturedImage(null);
    setMeasurementData(null);
  };

  return (
    <Layout>
      <Card className="border border-gray-200 mb-8">
        <CardHeader className="flex flex-wrap items-center justify-between border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-800">Camera View</CardTitle>
          
          <div className="flex space-x-2 mt-2 sm:mt-0">
            <Button
              variant="outline"
              onClick={() => handleEnableCamera()}
              disabled={cameraActive}
            >
              Switch Camera
            </Button>
            {measurementData && (
              <Button onClick={() => saveMeasurement()} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Measurement'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="camera-viewport rounded-lg w-full relative" style={{ height: '500px' }}>
            {cameraActive ? (
              <WebcamWithProcessing 
                onCapture={handleCapture}
                className="h-full w-full"
                isProcessing={isProcessing}
                measurementData={measurementData}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
                <div className="text-center text-white p-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h4 className="mt-4 text-lg font-medium">Camera Access Required</h4>
                  <p className="mt-2 text-sm text-gray-300">We need permission to access your camera for real-time measurements</p>
                  <Button className="mt-4" onClick={handleEnableCamera}>
                    Enable Camera
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-800">Measurement Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <Label>Measurement Mode</Label>
              <Select value={measurementMode} onValueChange={setMeasurementMode}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automatic Detection</SelectItem>
                  <SelectItem value="manual">Manual Measurement</SelectItem>
                  <SelectItem value="reference">Reference Object</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Measurement Unit</Label>
              <Select value={measurementUnit} onValueChange={setMeasurementUnit}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cm">Centimeters (cm)</SelectItem>
                  <SelectItem value="in">Inches (in)</SelectItem>
                  <SelectItem value="m">Meters (m)</SelectItem>
                  <SelectItem value="ft">Feet (ft)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Detection Models</Label>
              <Select value={detectionModel} onValueChange={setDetectionModel}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yolo5">YOLO v5 + Depth Estimation</SelectItem>
                  <SelectItem value="yolo4">YOLO v4 + Depth Estimation</SelectItem>
                  <SelectItem value="custom">Custom Model</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Detection Speed</Label>
              <Select value={detectionSpeed} onValueChange={setDetectionSpeed}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select speed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="accuracy">Prioritize Accuracy</SelectItem>
                  <SelectItem value="speed">Prioritize Speed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="save-measurements" 
                  checked={saveMeasurements}
                  onCheckedChange={(checked) => setSaveMeasurements(!!checked)}
                />
                <Label htmlFor="save-measurements" className="text-sm">Save Measurements</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="high-accuracy" 
                  checked={highAccuracy}
                  onCheckedChange={(checked) => setHighAccuracy(!!checked)}
                />
                <Label htmlFor="high-accuracy" className="text-sm">High Accuracy Mode</Label>
              </div>
            </div>
            
            <Button onClick={handleNewMeasurement}>
              <Plus className="h-5 w-5 mr-2" />
              New Measurement
            </Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
