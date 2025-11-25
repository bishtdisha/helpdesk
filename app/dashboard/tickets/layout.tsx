'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { NavigationHeader } from '@/components/navigation-header';

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeModule, setActiveModule] = useState('tickets');

  // Listen for module change events
  useEffect(() => {
    const handleModuleChange = (event: CustomEvent) => {
      setActiveModule(event.detail);
    };

    window.addEventListener('setActiveModule' as any, handleModuleChange as any);
    return () => {
      window.removeEventListener('setActiveModule' as any, handleModuleChange as any);
    };
  }, []);

  const handleModuleChange = (module: string) => {
    setActiveModule(module);
    // Navigate to dashboard with the selected module
    if (module !== 'tickets') {
      window.location.href = '/dashboard';
      setTimeout(() => {
        const event = new CustomEvent('setActiveModule', { detail: module });
        window.dispatchEvent(event);
      }, 100);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <NavigationHeader title="Tickets" />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
