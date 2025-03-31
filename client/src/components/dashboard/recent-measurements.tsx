import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Cloud, Camera, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Measurement } from '@shared/schema';
import { Link } from 'wouter';
import { MeasurementDetailDialog } from '@/components/measurement/measurement-detail-dialog';
import { useToast } from '@/hooks/use-toast';

interface RecentMeasurementsProps {
  measurements: Measurement[];
  isLoading: boolean;
  onDelete: (id: number) => void;
  isDeletingId: number | null;
}

export function RecentMeasurements({ 
  measurements, 
  isLoading, 
  onDelete,
  isDeletingId 
}: RecentMeasurementsProps) {
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { toast } = useToast();
  
  // Query for the selected measurement detail
  const { data: measurementDetail, refetch, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['/api/measurements', selectedMeasurement?.id],
    queryFn: async () => {
      if (!selectedMeasurement) return null;
      const res = await fetch(`/api/measurements/${selectedMeasurement.id}`);
      if (!res.ok) throw new Error('Failed to fetch measurement details');
      return res.json();
    },
    enabled: false // Don't run automatically, we'll trigger it manually
  });
  
  const handleViewMeasurement = async (measurement: Measurement) => {
    setSelectedMeasurement(measurement);
    
    try {
      // Refetch the detailed measurement data
      await refetch();
      setIsDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load measurement details",
        variant: "destructive"
      });
      console.error("Error fetching measurement details:", error);
    }
  };
  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-200 bg-white">
        <CardTitle className="text-lg font-semibold text-gray-800">Recent Measurements</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : measurements.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <p>No measurements yet. Start by uploading an image or using the camera.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-xs font-medium text-gray-500 uppercase">Date</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase">Object</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase">Dimensions</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase">Method</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {measurements.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm text-gray-900">
                    {item.createdAt ? format(new Date(item.createdAt), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center">
                        {item.method === 'Upload' ? (
                          <Cloud className="h-6 w-6 text-gray-500" />
                        ) : (
                          <Camera className="h-6 w-6 text-gray-500" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.objectName}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-900">{item.dimensions}</TableCell>
                  <TableCell>
                    <Badge
                      variant={item.method === 'Upload' ? 'outline' : 'default'}
                      className={item.method === 'Upload' 
                        ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                      }
                    >
                      {item.method === 'Upload' ? 'Image Upload' : 'Real-time Camera'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                        onClick={() => handleViewMeasurement(item)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-900 hover:bg-red-50"
                        onClick={() => onDelete(item.id)}
                        disabled={isDeletingId === item.id}
                      >
                        {isDeletingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      {measurements.length > 0 && (
        <CardFooter className="p-4 border-t border-gray-200 bg-gray-50">
          <Link href="/analytics" className="text-sm font-medium text-primary hover:text-blue-700">
            View analytics →
          </Link>
        </CardFooter>
      )}
      
      {/* Measurement detail dialog */}
      <MeasurementDetailDialog
        measurement={measurementDetail || selectedMeasurement}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isLoading={isLoadingDetail}
      />
    </Card>
  );
}
