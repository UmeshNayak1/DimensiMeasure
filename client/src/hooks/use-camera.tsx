import { useState, useEffect, useCallback } from 'react';

interface UseCameraOptions {
  onError?: (error: Error) => void;
  facingMode?: 'user' | 'environment';
}

interface UseCameraResult {
  hasCamera: boolean | null;
  cameraError: Error | null;
  isCameraInUse: boolean;
  requestCameraPermission: () => Promise<boolean>;
}

export function useCamera({
  onError,
  facingMode = 'environment'
}: UseCameraOptions = {}): UseCameraResult {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<Error | null>(null);
  const [isCameraInUse, setIsCameraInUse] = useState(false);

  const checkCameraAvailability = useCallback(async () => {
    try {
      // Check if the browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access');
      }
      
      // Try to access the camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode }
      });
      
      // If successful, release the stream
      stream.getTracks().forEach(track => track.stop());
      
      setHasCamera(true);
      setCameraError(null);
      return true;
    } catch (err) {
      setHasCamera(false);
      const error = err instanceof Error ? err : new Error('Failed to access camera');
      setCameraError(error);
      if (onError) onError(error);
      return false;
    }
  }, [facingMode, onError]);

  // Check camera availability on mount
  useEffect(() => {
    checkCameraAvailability();
  }, [checkCameraAvailability]);

  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      
      // If we're not actually using the camera, release it
      if (!isCameraInUse) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      setHasCamera(true);
      setCameraError(null);
      return true;
    } catch (err) {
      setHasCamera(false);
      const error = err instanceof Error ? err : new Error('Failed to access camera');
      setCameraError(error);
      if (onError) onError(error);
      return false;
    }
  }, [facingMode, isCameraInUse, onError]);

  return {
    hasCamera,
    cameraError,
    isCameraInUse,
    requestCameraPermission
  };
}
