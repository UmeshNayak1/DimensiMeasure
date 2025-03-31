import React, { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Loader2, Camera, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WebcamCaptureProps {
  onCapture: (imageSrc: string) => void;
  className?: string;
}

export function WebcamCapture({ onCapture, className = '' }: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const handleUserMedia = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onCapture(imageSrc);
      }
    }
  }, [onCapture]);

  const switchCamera = useCallback(() => {
    setFacingMode(prevMode => (prevMode === 'user' ? 'environment' : 'user'));
  }, []);

  // Always ensure camera is available
  useEffect(() => {
    const checkCameraAvailability = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Clean up the stream to avoid memory leaks
        stream.getTracks().forEach(track => track.stop());
        setIsCameraReady(true);
      } catch (err) {
        console.error('Error accessing camera:', err);
        setIsCameraReady(false);
      }
    };

    checkCameraAvailability();
  }, []);

  return (
    <div className={`relative overflow-hidden bg-black rounded-lg ${className}`}>
      {!isCameraReady ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
          <Camera className="h-12 w-12 mb-4 text-gray-400" />
          <h4 className="text-lg font-medium">Camera Access Required</h4>
          <p className="mt-2 text-sm text-gray-300 text-center max-w-xs">
            We need permission to access your camera for real-time measurements
          </p>
          <Button 
            className="mt-4"
            onClick={() => navigator.mediaDevices.getUserMedia({ video: true })}
          >
            Enable Camera
          </Button>
        </div>
      ) : (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }}
            onUserMedia={handleUserMedia}
            className="w-full h-full object-cover"
          />
          
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="bg-black bg-opacity-50 border-0 hover:bg-opacity-70 text-white"
              onClick={switchCamera}
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="bg-primary bg-opacity-90 hover:bg-opacity-100"
              onClick={capture}
            >
              <Camera className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Measurement Guidelines Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-dashed border-white rounded-lg w-3/4 h-3/4 flex items-center justify-center text-white">
              <div className="text-center p-4 bg-black bg-opacity-50 rounded-lg">
                <p>Position object within the frame</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface WebcamWithProcessingProps extends WebcamCaptureProps {
  isProcessing?: boolean;
  measurementData?: {
    objectName: string;
    dimensions: string;
    confidence: number;
    bbox?: [number, number, number, number]; // x1, y1, x2, y2
  } | null;
}

export function WebcamWithProcessing({ 
  onCapture, 
  className = '',
  isProcessing = false,
  measurementData = null
}: WebcamWithProcessingProps) {
  const webcamRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className={`relative ${className}`} ref={webcamRef}>
      <WebcamCapture onCapture={onCapture} className={className} />
      
      {/* Loading overlay */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4 border-4 border-gray-600 border-t-primary w-12 h-12 rounded-full animate-spin"></div>
            <p className="text-white">Processing measurement...</p>
          </div>
        </div>
      )}
      
      {/* Bounding box overlay */}
      {!isProcessing && measurementData && measurementData.bbox && (
        <div 
          className="absolute border-2 border-blue-500 rounded-sm z-10"
          style={{
            top: `${measurementData.bbox[1]}px`,
            left: `${measurementData.bbox[0]}px`,
            width: `${measurementData.bbox[2] - measurementData.bbox[0]}px`,
            height: `${measurementData.bbox[3] - measurementData.bbox[1]}px`,
          }}
        >
          {/* Label on top of bounding box */}
          <div 
            className="absolute -top-7 left-0 right-0 mx-auto px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded flex items-center justify-center max-w-fit"
            style={{ 
              textShadow: '0 0 3px rgba(0,0,0,0.5)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
            }}
          >
            {measurementData.objectName}: {measurementData.dimensions}
          </div>
        </div>
      )}
      
      {/* Measurement data overlay */}
      {!isProcessing && measurementData && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4 text-white">
          <div className="flex justify-between items-center text-sm md:text-base">
            <div>
              <div className="text-sm opacity-75">Detected Object:</div>
              <div className="font-medium">{measurementData.objectName}</div>
            </div>
            <div>
              <div className="text-sm opacity-75">Dimensions:</div>
              <div className="font-medium">{measurementData.dimensions}</div>
            </div>
            <div>
              <div className="text-sm opacity-75">Confidence:</div>
              <div className="font-medium">{measurementData.confidence}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
