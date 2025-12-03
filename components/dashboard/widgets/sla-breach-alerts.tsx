'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, XCircle, ExternalLink } from "lucide-react";
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function SLABreachAlerts() {
  const { data, isLoading, error } = useSWR('/api/dashboard/sla-alerts', fetcher, {
    refreshInterval: 60000, // Refresh every minute for SLA alerts
    revalidateOnFocus: true,
  });

  if (error) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">SLA / Priority Breakdown</CardTitle>
          <CardDescription className="text-sm text-red-600">Failed to load alerts</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold">SLA / Priority Breakdown</CardTitle>
          <CardDescription className="text-sm">Loading alerts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-32 bg-muted animate-pulse rounded-lg" />
            <div className="h-24 bg-muted animate-pulse rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { nearBreach, breached, priorityMatrix } = data;

  const formatTimeLeft = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">SLA / Priority Breakdown</CardTitle>
        <CardDescription className="text-sm">Tickets requiring immediate attention</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Near Breach Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Tickets Near SLA Breach (Next 2 Hours)
            </h3>
            <Badge variant="destructive" className="text-xs">
              {nearBreach?.length || 0}
            </Badge>
          </div>
          {nearBreach && nearBreach.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {nearBreach.map((ticket: any) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/tickets/${ticket.id}`}
                        className="text-sm font-medium text-red-900 hover:underline truncate"
                      >
                        #{ticket.ticketNumber} - {ticket.title}
                      </Link>
                      <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                        {ticket.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-red-600" />
                      <span className="text-xs text-red-700 font-medium">
                        {formatTimeLeft(ticket.timeLeftMinutes)} left
                      </span>
                    </div>
                  </div>
                  <Link href={`/dashboard/tickets/${ticket.id}`}>
                    <Button size="sm" variant="ghost" className="ml-2">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-sm text-green-700">No tickets near breach 🎉</p>
            </div>
          )}
        </div>

        {/* Breached Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Breached Tickets
            </h3>
            <Badge variant="destructive" className="text-xs">
              {breached || 0}
            </Badge>
          </div>
          {breached > 0 ? (
            <Link href="/dashboard/tickets?status=breached">
              <Button variant="outline" size="sm" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                View All Breached Tickets
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-sm text-green-700">No breached tickets 🎉</p>
            </div>
          )}
        </div>

        {/* Priority vs SLA Matrix */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Priority vs SLA Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Priority</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Open</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Avg SLA Left</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Breached</th>
                </tr>
              </thead>
              <tbody>
                {priorityMatrix && priorityMatrix.map((row: any) => (
                  <tr key={row.priority} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3">
                      <Badge variant={getPriorityColor(row.priority)} className="text-xs">
                        {row.priority}
                      </Badge>
                    </td>
                    <td className="text-right py-2 px-3 font-medium">{row.open}</td>
                    <td className="text-right py-2 px-3">
                      <span className={row.avgSlaLeftMinutes < 120 ? 'text-red-600 font-medium' : ''}>
                        {formatTimeLeft(row.avgSlaLeftMinutes)}
                      </span>
                    </td>
                    <td className="text-right py-2 px-3">
                      {row.breached > 0 ? (
                        <span className="text-red-600 font-medium">{row.breached}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
