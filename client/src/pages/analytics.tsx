import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Layout } from '@/components/layout/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { type Measurement } from '@shared/schema';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('daily');

  const { data: measurements, isLoading } = useQuery<Measurement[]>({
    queryKey: ['/api/measurements'],
  });

  // Process data for charts
  const processData = () => {
    if (!measurements || measurements.length === 0) {
      return {
        timeSeriesData: [],
        methodDistribution: [],
        sizeDistribution: []
      };
    }

    // Time series data (daily or weekly)
    const timeData = [...measurements].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Group by method
    const methodCounts = measurements.reduce((acc, measurement) => {
      const { method } = measurement;
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const methodData = Object.entries(methodCounts).map(([name, value]) => ({
      name,
      value
    }));
    
    // Group by object size (using height as example)
    const sizeGroups = {
      'Small (<10cm)': 0,
      'Medium (10-30cm)': 0,
      'Large (>30cm)': 0,
      'Unknown': 0
    };
    
    measurements.forEach(m => {
      try {
        const parts = m.dimensions.split('×');
        if (parts.length >= 2) {
          const height = parseFloat(parts[1].trim());
          if (!isNaN(height)) {
            if (height < 10) sizeGroups['Small (<10cm)']++;
            else if (height <= 30) sizeGroups['Medium (10-30cm)']++;
            else sizeGroups['Large (>30cm)']++;
          } else {
            sizeGroups['Unknown']++;
          }
        } else {
          sizeGroups['Unknown']++;
        }
      } catch (e) {
        sizeGroups['Unknown']++;
      }
    });
    
    const sizeData = Object.entries(sizeGroups)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
    
    return {
      timeSeriesData: timeData,
      methodDistribution: methodData,
      sizeDistribution: sizeData
    };
  };

  const { timeSeriesData, methodDistribution, sizeDistribution } = processData();
  
  // Colors for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Format date for x-axis
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-[300px] w-full" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          </div>
        ) : measurements && measurements.length > 0 ? (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Measurement Trends</CardTitle>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-[200px] grid-cols-2">
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={timeSeriesData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis 
                        dataKey="createdAt" 
                        tickFormatter={formatDate}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        formatter={(value, name) => [value, 'Count']}
                      />
                      <Legend />
                      <Bar dataKey="id" fill="#8884d8" name="Measurements" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Measurement Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={methodDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {methodDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Object Size Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sizeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {sizeDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-[400px]">
              <h3 className="text-xl font-medium text-gray-500 mb-2">No Measurement Data Available</h3>
              <p className="text-gray-400">
                Start measuring objects to see analytics insights
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}