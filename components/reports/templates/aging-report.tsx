"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import { Clock, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react"

interface AgingReportData {
  summary: {
    totalOpen: number
    under24h: number
    days1to3: number
    days3to7: number
    over7days: number
    avgAge: string
  }
  byAgeBucket: {
    bucket: string
    count: number
    color: string
  }[]
  byTeam: {
    team: string
    under24h: number
    days1to3: number
    days3to7: number
    over7days: number
  }[]
  oldestTickets: {
    ticketNumber: number
    title: string
    priority: string
    assignee: string
    team: string
    age: string
    createdAt: string
  }[]
}

const COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444']

export function AgingReport({ data }: { data: AgingReportData }) {
  const getAgeIcon = (bucket: string) => {
    if (bucket.includes('24')) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (bucket.includes('1-3')) return <Clock className="h-5 w-5 text-yellow-500" />
    if (bucket.includes('3-7')) return <AlertCircle className="h-5 w-5 text-orange-500" />
    return <AlertTriangle className="h-5 w-5 text-red-500" />
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Open</p>
              <p className="text-3xl font-bold">{data.summary.totalOpen}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">&lt; 24 Hours</p>
              <p className="text-3xl font-bold text-green-600">{data.summary.under24h}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">1-3 Days</p>
              <p className="text-3xl font-bold text-yellow-600">{data.summary.days1to3}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">3-7 Days</p>
              <p className="text-3xl font-bold text-orange-600">{data.summary.days3to7}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">&gt; 7 Days</p>
              <p className="text-3xl font-bold text-red-600">{data.summary.over7days}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byAgeBucket}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    label={({ bucket, percent }) => `${bucket} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {data.byAgeBucket.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Age by Team */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aging by Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byTeam}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="team" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="under24h" name="< 24h" fill="#10b981" stackId="a" />
                  <Bar dataKey="days1to3" name="1-3 days" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="days3to7" name="3-7 days" fill="#f97316" stackId="a" />
                  <Bar dataKey="over7days" name="> 7 days" fill="#ef4444" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Average Age Card */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-4">
            <Clock className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Average Ticket Age</p>
              <p className="text-4xl font-bold">{data.summary.avgAge}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Oldest Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Oldest Open Tickets (Needs Attention)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.oldestTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No aging tickets found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.oldestTickets.map((ticket) => (
                  <TableRow key={ticket.ticketNumber}>
                    <TableCell className="font-mono">#{String(ticket.ticketNumber).padStart(5, "0")}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{ticket.title}</TableCell>
                    <TableCell>
                      <Badge variant={ticket.priority === "URGENT" || ticket.priority === "HIGH" ? "destructive" : "secondary"}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{ticket.assignee}</TableCell>
                    <TableCell>{ticket.team}</TableCell>
                    <TableCell className="font-medium text-red-600">{ticket.age}</TableCell>
                    <TableCell className="text-muted-foreground">{ticket.createdAt}</TableCell>
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
