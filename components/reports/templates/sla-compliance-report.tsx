"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from "recharts"
import { CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react"

interface SLAComplianceData {
  summary: {
    totalTickets: number
    withinSLA: number
    breached: number
    complianceRate: number
    avgResponseTime: string
  }
  byTeam: {
    team: string
    total: number
    withinSLA: number
    breached: number
    complianceRate: number
  }[]
  byPriority: {
    priority: string
    total: number
    withinSLA: number
    breached: number
    complianceRate: number
  }[]
  trend: {
    date: string
    complianceRate: number
    breached: number
  }[]
  breachedTickets: {
    ticketNumber: number
    title: string
    priority: string
    team: string
    breachTime: string
  }[]
}

export function SLAComplianceReport({ data }: { data: SLAComplianceData }) {
  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600"
    if (rate >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getProgressColor = (rate: number) => {
    if (rate >= 90) return "bg-green-500"
    if (rate >= 70) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
                <p className={`text-3xl font-bold ${getComplianceColor(data.summary.complianceRate)}`}>
                  {data.summary.complianceRate}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Within SLA</p>
                <p className="text-3xl font-bold text-green-600">{data.summary.withinSLA}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Breached</p>
                <p className="text-3xl font-bold text-red-600">{data.summary.breached}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-3xl font-bold">{data.summary.avgResponseTime}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance by Team */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SLA Compliance by Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.byTeam.map((team) => (
              <div key={team.team} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{team.team}</span>
                  <span className={`font-bold ${getComplianceColor(team.complianceRate)}`}>
                    {team.complianceRate}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={team.complianceRate} 
                    className="h-2 flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-24 text-right">
                    {team.withinSLA}/{team.total} tickets
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance by Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byPriority}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="priority" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="withinSLA" name="Within SLA" fill="#10b981" stackId="a" />
                  <Bar dataKey="breached" name="Breached" fill="#ef4444" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="complianceRate" 
                    name="Compliance %" 
                    stroke="#10b981" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breached Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Breached Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.breachedTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No breached tickets in this period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Breach Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.breachedTickets.map((ticket) => (
                  <TableRow key={ticket.ticketNumber}>
                    <TableCell className="font-mono">#{String(ticket.ticketNumber).padStart(5, "0")}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{ticket.title}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{ticket.priority}</Badge>
                    </TableCell>
                    <TableCell>{ticket.team}</TableCell>
                    <TableCell className="text-red-600">{ticket.breachTime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
