import React from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { 
  Home, 
  Upload, 
  Camera, 
  BarChart2, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const navItems = [
    { 
      path: '/', 
      label: 'Dashboard', 
      icon: <Home className="h-5 w-5 mr-3" /> 
    },
    { 
      path: '/upload-measurement', 
      label: 'Upload Measurement',
      icon: <Upload className="h-5 w-5 mr-3" />
    },
    { 
      path: '/realtime-measurement', 
      label: 'Real-time Measurement',
      icon: <Camera className="h-5 w-5 mr-3" />
    },
    { 
      path: '/analytics', 
      label: 'Analytics',
      icon: <BarChart2 className="h-5 w-5 mr-3" />
    },
    { 
      path: '/settings', 
      label: 'Settings',
      icon: <Settings className="h-5 w-5 mr-3" />
    }
  ];
  
  const isActive = (path: string) => location === path;
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden lg:block">
      <div className="p-6">
        <h1 className="text-xl font-semibold text-primary flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          DimensionAI
        </h1>
      </div>
      
      <nav className="mt-6">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
          >
            <a className={`flex items-center px-6 py-3 ${
              isActive(item.path) 
                ? 'text-primary bg-blue-50 border-l-4 border-primary' 
                : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'
            }`}>
              {item.icon}
              {item.label}
            </a>
          </Link>
        ))}
      </nav>
      
      <div className="absolute bottom-0 w-64 border-t border-gray-200">
        <Button
          variant="ghost"
          className="flex items-center w-full px-6 py-3 text-gray-600 hover:bg-gray-50 justify-start"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
        
        <div className="px-6 py-4 flex items-center">
          <Avatar>
            <AvatarFallback>{user?.name?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-800">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500">{user?.email || ''}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
