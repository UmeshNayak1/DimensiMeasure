import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Layout } from '@/components/layout/layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { RecentMeasurements } from '@/components/dashboard/recent-measurements';
import { MeasurementChart } from '@/components/dashboard/measurement-chart';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Measurement } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user stats
  const { 
    data: stats, 
    isLoading: isLoadingStats 
  } = useQuery({
    queryKey: ['/api/stats'],
    enabled: !!user,
  });

  // Fetch user measurements
  const { 
    data: measurements = [], 
    isLoading: isLoadingMeasurements 
  } = useQuery<Measurement[]>({
    queryKey: ['/api/measurements'],
    enabled: !!user,
  });

  // Delete measurement mutation
  const { mutate: deleteMeasurement, isPending: isDeleting, variables: deletingId } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/measurements/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Measurement[]>(['/api/measurements'], (old = []) =>
        old.filter(measurement => measurement.id !== id)
      );
      
      // Invalidate stats since they will change
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: 'Measurement deleted',
        description: 'The measurement has been successfully deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete measurement: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Get recent measurements (last 5)
  const recentMeasurements = measurements.slice(0, 5);

  return (
    <Layout>
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoadingStats ? (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <StatsCard 
              title="Total Measurements" 
              value={stats?.totalMeasurements || 0} 
              type="measurements"
            />
            <StatsCard 
              title="Last 7 Days" 
              value={stats?.recentMeasurements || 0} 
              type="recent"
            />
            <StatsCard 
              title="Saved Images" 
              value={stats?.savedImages || 0} 
              type="images"
            />
            <StatsCard 
              title="Avg Object Size" 
              value={stats?.avgSize || 'N/A'} 
              type="size"
            />
          </>
        )}
      </div>
      
      {/* Recent Measurements */}
      <div className="mb-8">
        <RecentMeasurements 
          measurements={recentMeasurements}
          isLoading={isLoadingMeasurements}
          onDelete={deleteMeasurement}
          isDeletingId={isDeleting ? (deletingId as number) : null}
        />
      </div>
      
      {/* Measurement Distribution Chart */}
      <MeasurementChart measurements={measurements} />
    </Layout>
  );
}
