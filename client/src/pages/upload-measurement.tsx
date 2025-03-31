import React, { useState, useCallback } from 'react';
import { Layout } from '@/components/layout/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Eye, Download, Share2, Loader2 } from 'lucide-react';
import { InsertMeasurement } from '@shared/schema';
import { Badge } from '@/components/ui/badge';

export default function UploadMeasurement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [measurementUnit, setMeasurementUnit] = useState('cm');
  const [referenceObject, setReferenceObject] = useState('none');
  const [sensitivity, setSensitivity] = useState([7]);
  const [showResults, setShowResults] = useState(false);
  const [processingResults, setProcessingResults] = useState(false);
  
  // Mock measurement results (will be replaced with real data from API)
  const [measurementResults, setMeasurementResults] = useState<{
    objects: Array<{
      name: string;
      dimensions: string;
      confidence: number;
    }>;
  } | null>(null);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Reset results when new file is selected
    setShowResults(false);
    setMeasurementResults(null);
  }, []);

  // Start measurement process
  const handleStartMeasurement = useCallback(async () => {
    if (!selectedFile || !imagePreview) return;
    
    setProcessingResults(true);
    
    try {
      // Call our custom model API with the image data
      const response = await fetch('/api/model/measure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imagePreview,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.measurements && result.measurements.length > 0) {
        // Transform the measurements to match our UI format
        const processedResults = {
          objects: result.measurements.map((item: any) => ({
            name: item.objectName,
            dimensions: item.dimensions,
            confidence: Math.round(item.confidence * 100)
          }))
        };
        
        setMeasurementResults(processedResults);
        setShowResults(true);
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
      setProcessingResults(false);
    }
  }, [selectedFile, imagePreview, toast]);

  // Save measurement results to the database
  const { mutate: saveMeasurement, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!user || !measurementResults || !measurementResults.objects.length) {
        throw new Error("No measurement data available");
      }
      
      const mainObject = measurementResults.objects[0];
      
      const measurementData: InsertMeasurement = {
        userId: user.id,
        objectName: mainObject.name,
        dimensions: mainObject.dimensions,
        method: "Upload",
        confidence: mainObject.confidence,
        imageUrl: imagePreview || undefined,
        data: measurementResults
      };
      
      const res = await apiRequest("POST", "/api/measurements", measurementData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/measurements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: "Measurement saved",
        description: "Your measurement has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save measurement: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  return (
    <Layout>
      <Card className="border border-gray-200 mb-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Upload Image</h3>
          
          <FileUpload 
            onFileSelect={handleFileSelect} 
            accept="image/*"
            maxSize={10}
          />
        </CardContent>
      </Card>
      
      <Card className="border border-gray-200 mb-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Image Preview & Settings</h3>
          
          <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
            {/* Preview Area */}
            <div className="md:w-2/3 bg-gray-100 rounded-lg relative overflow-hidden" style={{ height: '400px' }}>
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Upload preview" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M9 9h.01M15 9h.01M9 12h.01M15 12h.01M9 15h.01M15 15h.01" />
                    </svg>
                    <p className="mt-2">Image preview will appear here</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Settings */}
            <div className="md:w-1/3">
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
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
                  <Label>Reference Object</Label>
                  <Select value={referenceObject} onValueChange={setReferenceObject}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select reference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (ML Detection)</SelectItem>
                      <SelectItem value="card">Credit Card (8.5 × 5.4 cm)</SelectItem>
                      <SelectItem value="a4">A4 Paper (29.7 × 21 cm)</SelectItem>
                      <SelectItem value="letter">Letter Paper (11 × 8.5 in)</SelectItem>
                      <SelectItem value="custom">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Detection Sensitivity</Label>
                  <Slider
                    value={sensitivity}
                    onValueChange={setSensitivity}
                    min={1}
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    className="w-full"
                    onClick={handleStartMeasurement}
                    disabled={!selectedFile || processingResults}
                  >
                    {processingResults ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : 'Start Measurement'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Results Section (Initially Hidden) */}
      {showResults && measurementResults && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-800">Measurement Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
              {/* Result Image */}
              <div className="md:w-2/3 bg-gray-100 rounded-lg relative" style={{ height: '400px' }}>
                {imagePreview && (
                  <img 
                    src={imagePreview} 
                    alt="Measurement result" 
                    className="object-contain w-full h-full"
                  />
                )}
                
                {/* Measurement Overlays */}
                {/* Simple mock overlays - in a real app these would be positioned based on ML model output */}
                <div className="absolute" style={{ top: '120px', left: '100px', width: '200px', height: '100px', border: '2px dashed #3B82F6', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 600, textShadow: '0 0 3px rgba(0,0,0,0.8)' }}>
                  200 × 100 cm
                </div>
                <div className="absolute" style={{ top: '240px', left: '150px', width: '100px', height: '40px', border: '2px dashed #3B82F6', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 600, textShadow: '0 0 3px rgba(0,0,0,0.8)' }}>
                  100 × 40 cm
                </div>
              </div>
              
              {/* Results Details */}
              <div className="md:w-1/3">
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Detected Objects</h4>
                    <div className="mt-2 space-y-2">
                      {measurementResults.objects.map((obj, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{obj.name}</span>
                          <span className="font-medium">{obj.dimensions}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium text-gray-700">Confidence Scores</h4>
                    <div className="mt-2 space-y-2">
                      {measurementResults.objects.map((obj, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <span>{obj.name.split('(')[0].trim()}</span>
                          <div className="ml-auto w-32 bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-green-500 h-2.5 rounded-full" 
                              style={{ width: `${obj.confidence}%` }}
                            />
                          </div>
                          <span className="ml-2 text-xs">{obj.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 flex space-x-2">
                    <Button 
                      className="flex-1"
                      onClick={() => saveMeasurement()}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : 'Save Results'}
                    </Button>
                    <Button variant="outline" size="icon">
                      <Download className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}
