import React from 'react';
import { Card } from '@/components/ui/card';
import { CircleDashed, ArrowUpCircle, Images, Ruler } from 'lucide-react';

type StatIconType = 'measurements' | 'recent' | 'images' | 'size';

interface StatsCardProps {
  title: string;
  value: string | number;
  type: StatIconType;
}

export function StatsCard({ title, value, type }: StatsCardProps) {
  // Define icon and color based on type
  const iconMap = {
    measurements: {
      icon: <CircleDashed className="h-6 w-6" />,
      bgColor: 'bg-blue-100',
      textColor: 'text-primary'
    },
    recent: {
      icon: <ArrowUpCircle className="h-6 w-6" />,
      bgColor: 'bg-green-100',
      textColor: 'text-secondary'
    },
    images: {
      icon: <Images className="h-6 w-6" />,
      bgColor: 'bg-purple-100',
      textColor: 'text-accent'
    },
    size: {
      icon: <Ruler className="h-6 w-6" />,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600'
    }
  };

  const { icon, bgColor, textColor } = iconMap[type];

  return (
    <Card className="p-6 border border-gray-200">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${bgColor} ${textColor}`}>
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-xl font-semibold text-gray-800">{value}</p>
        </div>
      </div>
    </Card>
  );
}
