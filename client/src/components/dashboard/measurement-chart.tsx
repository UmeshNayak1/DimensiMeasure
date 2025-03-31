import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Measurement } from '@shared/schema';

interface MeasurementChartProps {
  measurements: Measurement[];
}

export function MeasurementChart({ measurements }: MeasurementChartProps) {
  // Data processing for the chart
  const processDataForChart = () => {
    // Create an object to store counts by dimension range
    const dimensionCounts: Record<string, number> = {};
    
    measurements.forEach(measurement => {
      try {
        // Assume dimensions are stored in the format "width × height × depth"
        const parts = measurement.dimensions.split('×');
        if (parts.length >= 1) {
          const width = parseFloat(parts[0].trim());
          if (!isNaN(width)) {
            // Group by ranges of 20cm
            const range = Math.floor(width / 20) * 20;
            const rangeKey = `${range}-${range + 20}cm`;
            dimensionCounts[rangeKey] = (dimensionCounts[rangeKey] || 0) + 1;
          }
        }
      } catch (e) {
        // Skip invalid dimensions
      }
    });
    
    // Convert to array for chart
    return Object.entries(dimensionCounts).map(([range, count]) => ({
      range,
      count
    })).sort((a, b) => {
      // Sort by the starting dimension
      const aStart = parseInt(a.range.split('-')[0]);
      const bStart = parseInt(b.range.split('-')[0]);
      return aStart - bStart;
    });
  };

  // Process data
  const chartData = processDataForChart();

  // If there's no data or not enough measurements, show a placeholder
  const hasData = measurements.length >= 2 && chartData.length > 0;

  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-semibold text-gray-800">Measurement Distribution</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {!hasData ? (
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">
                {measurements.length === 0 
                  ? "No measurement data available"
                  : "Not enough measurements for distribution chart"}
              </p>
              <p className="text-xs text-gray-400">Add more measurements to see distribution</p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar name="Measurement Count" dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
