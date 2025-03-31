import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Measurement } from '@shared/schema';
import { format } from 'date-fns';
import { Cloud, Camera, Ruler, Calendar, Tag, Loader2 } from 'lucide-react';

interface MeasurementDetailDialogProps {
  measurement: Measurement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
}

export function MeasurementDetailDialog({
  measurement,
  open,
  onOpenChange,
  isLoading = false
}: MeasurementDetailDialogProps) {
  if (!measurement) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2 mb-2">
            {measurement.objectName}
            <Badge
              variant={measurement.method === 'Upload' ? 'outline' : 'default'}
              className={
                measurement.method === 'Upload'
                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
              }
            >
              {measurement.method === 'Upload' ? 'Image Upload' : 'Real-time Camera'}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4" />
              <span>
                {measurement.createdAt
                  ? format(new Date(measurement.createdAt), 'MMMM d, yyyy h:mm a')
                  : 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Ruler className="h-4 w-4" />
              <span>Dimensions: {measurement.dimensions}</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span>Confidence: {measurement.confidence ? measurement.confidence.toFixed(2) : 'N/A'}%</span>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center bg-gray-100 p-12 text-gray-500">
              <Loader2 className="h-16 w-16 animate-spin mb-4" />
              <p>Loading measurement details...</p>
            </div>
          ) : measurement.imageUrl ? (
            <div className="relative">
              <img 
                src={measurement.imageUrl} 
                alt={`Measurement of ${measurement.objectName}`} 
                className="w-full h-auto"
              />
              {/* If we have bounding box data in the future, we could overlay it here */}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-gray-100 p-12 text-gray-500">
              <div className="mb-4">
                {measurement.method === 'Upload' ? (
                  <Cloud className="h-16 w-16" />
                ) : (
                  <Camera className="h-16 w-16" />
                )}
              </div>
              <p>Image data is not available for this measurement.</p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}