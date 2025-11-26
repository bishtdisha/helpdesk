export default function DashboardLoading() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r bg-card p-4 space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header skeleton */}
        <div className="border-b p-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        
        {/* Dashboard grid skeleton */}
        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-1 md:col-span-2 lg:col-span-4 h-16 bg-muted animate-pulse rounded-lg" />
            <div className="col-span-1 h-32 bg-muted animate-pulse rounded-lg" />
            <div className="col-span-1 h-32 bg-muted animate-pulse rounded-lg" />
            <div className="col-span-1 h-32 bg-muted animate-pulse rounded-lg" />
            <div className="col-span-1 h-32 bg-muted animate-pulse rounded-lg" />
            <div className="col-span-1 md:col-span-2 lg:col-span-2 h-80 bg-muted animate-pulse rounded-lg" />
            <div className="col-span-1 md:col-span-2 lg:col-span-2 h-80 bg-muted animate-pulse rounded-lg" />
            <div className="col-span-1 md:col-span-2 lg:col-span-4 h-64 bg-muted animate-pulse rounded-lg" />
          </div>
        </main>
      </div>
    </div>
  );
}
