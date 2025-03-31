import React, { ReactNode, useState } from 'react';
import { useLocation } from 'wouter';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { useAuth } from '@/hooks/use-auth';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const pageTitles: Record<string, { title: string, description: string }> = {
    '/': { 
      title: 'Dashboard', 
      description: 'Welcome back to your object measurement dashboard' 
    },
    '/upload-measurement': { 
      title: 'Upload Image for Measurement', 
      description: 'Upload an image to measure object dimensions' 
    },
    '/realtime-measurement': { 
      title: 'Real-time Object Measurement', 
      description: 'Measure object dimensions using your camera in real-time' 
    },
  };
  
  const currentPage = pageTitles[location] || { title: '', description: '' };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar (desktop) */}
      <Sidebar />
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-primary flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            DimensionAI
          </h1>
        </div>
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0 pb-16 lg:pb-0">
        <div className="p-6">
          {currentPage.title && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">{currentPage.title}</h2>
              <p className="text-gray-600">{currentPage.description}</p>
            </div>
          )}
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
