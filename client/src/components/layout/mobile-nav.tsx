import React from 'react';
import { useLocation, Link } from 'wouter';
import { Home, Upload, Camera, BarChart2, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

export function MobileNav() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  
  const navItems: NavItem[] = [
    { 
      path: '/', 
      label: 'Dashboard', 
      icon: <Home className="h-6 w-6" /> 
    },
    { 
      path: '/upload-measurement', 
      label: 'Upload',
      icon: <Upload className="h-6 w-6" />
    },
    { 
      path: '/realtime-measurement', 
      label: 'Camera',
      icon: <Camera className="h-6 w-6" />
    },
    { 
      path: '/analytics', 
      label: 'Analytics',
      icon: <BarChart2 className="h-6 w-6" />
    },
    {
      path: '#',
      label: 'Logout',
      icon: <LogOut className="h-6 w-6" />,
      onClick: () => logoutMutation.mutate()
    }
  ];
  
  const isActive = (path: string) => location === path;
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-10">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          item.onClick ? (
            // For items with onClick handler (like logout)
            <button 
              key={item.path}
              onClick={item.onClick}
              className={`flex flex-col items-center py-3 ${
                isActive(item.path) ? 'text-primary' : 'text-gray-500'
              }`}
              disabled={logoutMutation.isPending}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ) : (
            // For regular navigation items
            <Link 
              key={item.path} 
              href={item.path}
            >
              <a className={`flex flex-col items-center py-3 ${
                isActive(item.path) ? 'text-primary' : 'text-gray-500'
              }`}>
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </a>
            </Link>
          )
        ))}
      </div>
    </nav>
  );
}
