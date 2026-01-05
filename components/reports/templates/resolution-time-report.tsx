"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Clock, Timer, TrendingUp, TrendingDown } from "lucide-react"

interface ResolutionTimeReportProps {
  data: {
    summary: {
      totalTickets: number
      avgResolutionTime: string
      avgResolutionHours: number
      fastestResolution: string
      slowestResolution: string
    }
    byPriority: {
      priority: string
      count: number
      avgResolutionHours: number
      avgResolutionFormatted: string
    }[]
    byTeam: {
      teamId: string
      teamName: string
      count: number
      avgResolutionHours: number
      avgResolutionFormatted: string
    }[]
    byCategory: {
      category: string
      count: number
      avgResolutionHours: number
      avgResolutionFormatted: string
    }[]
    priorityChart: { name: string; value: number; count: number }[]
    teamChart: { name: string; value: number; count: number }[]
  }
}

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#22c55e",
}

const CHART_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00C49F", "#FFBB28"]

export function ResolutionTimeReport({ data }: ResolutionTimeReportProps) {
  const { summary, byPriority, byTeam, byCategory, priorityChart, teamChart } = data

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resolved</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTickets}</div>
            <p className="text-xs text-muted-foreground">tickets analyzed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgResolutionTime}</div>
            <p className="text-xs text-muted-foreground">average time to resolve</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fastest</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.fastestResolution}</div>
            <p className="text-xs text-muted-foreground">quickest resolution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slowest</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.slowestResolution}</div>
            <p className="text-xs text-muted-foreground">longest resolution</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Priority Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Resolution Time by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" unit="h" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip 
                    formatter={(value: number) => [`${value}h`, "Avg Time"]}
                    labelFormatter={(label) => `Priority: ${label}`}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {priorityChart.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PRIORITY_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Team Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Resolution Time by Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis unit="h" />
                  <Tooltip 
                    formatter={(value: number) => [`${value}h`, "Avg Time"]}
                  />
                  <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Priority Table */}
        <Card>
          <CardHeader>
            <CardTitle>By Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byPriority.map((item) => (
                <div key={item.priority} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: PRIORITY_COLORS[item.priority],
                        color: PRIORITY_COLORS[item.priority]
                      }}
                    >
                      {item.priority}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{item.count} tickets</span>
                  </div>
                  <span className="font-semibold">{item.avgResolutionFormatted}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Category Table */}
        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {byCategory.slice(0, 10).map((item, index) => (
                <div key={item.category} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="font-medium">{item.category}</span>
                    <span className="text-sm text-muted-foreground">({item.count})</span>
                  </div>
                  <span className="font-semibold">{item.avgResolutionFormatted}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Resolution Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Team</th>
                  <th className="text-center py-3 px-4 font-medium">Tickets</th>
                  <th className="text-center py-3 px-4 font-medium">Avg Resolution</th>
                  <th className="text-right py-3 px-4 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                {byTeam.map((team, index) => {
                  const avgHours = summary.avgResolutionHours || 1
                  const performance = ((avgHours - team.avgResolutionHours) / avgHours) * 100
                  const isGood = performance >= 0
                  
                  return (
                    <tr key={team.teamId} className="border-b last:border-0">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">#{index + 1}</span>
                          <span className="font-medium">{team.teamName}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">{team.count}</td>
                      <td className="text-center py-3 px-4 font-semibold">{team.avgResolutionFormatted}</td>
                      <td className="text-right py-3 px-4">
                        <Badge variant={isGood ? "default" : "destructive"}>
                          {isGood ? "+" : ""}{performance.toFixed(0)}%
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
