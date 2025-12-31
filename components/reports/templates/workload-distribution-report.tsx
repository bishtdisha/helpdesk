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
  PieChart,
  Pie,
  Cell,
  Legend,
  Treemap
} from "recharts"
import { Users, User, AlertTriangle, CheckCircle, Scale } from "lucide-react"

interface WorkloadDistributionData {
  summary: {
    totalAgents: number
    totalOpenTickets: number
    avgTicketsPerAgent: number
    overloadedAgents: number
    underutilizedAgents: number
  }
  byAgent: {
    name: string
    team: string
    openTickets: number
    capacity: number
    utilizationPercent: number
    status: 'overloaded' | 'optimal' | 'underutilized'
  }[]
  byTeam: {
    team: string
    totalTickets: number
    members: number
    avgPerMember: number
  }[]
  distribution: {
    range: string
    count: number
    color: string
  }[]
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']

export function WorkloadDistributionReport({ data }: { data: WorkloadDistributionData }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overloaded': return 'text-red-600 bg-red-100 dark:bg-red-900'
      case 'optimal': return 'text-green-600 bg-green-100 dark:bg-green-900'
      case 'underutilized': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getProgressColor = (percent: number) => {
    if (percent > 100) return 'bg-red-500'
    if (percent >= 70) return 'bg-green-500'
    return 'bg-yellow-500'
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-3xl font-bold">{data.summary.totalAgents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
                <p className="text-3xl font-bold">{data.summary.totalOpenTickets}</p>
              </div>
              <Scale className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg per Agent</p>
                <p className="text-3xl font-bold">{data.summary.avgTicketsPerAgent}</p>
              </div>
              <User className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overloaded</p>
                <p className="text-3xl font-bold text-red-600">{data.summary.overloadedAgents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Underutilized</p>
                <p className="text-3xl font-bold text-yellow-600">{data.summary.underutilizedAgents}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload by Agent */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workload by Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byAgent.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="openTickets" name="Open Tickets" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Utilization Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    label={({ range, percent }) => `${range} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {data.distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Workload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workload by Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byTeam}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="team" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalTickets" name="Total Tickets" fill="#3b82f6" />
                <Bar dataKey="avgPerMember" name="Avg per Member" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Agent Utilization Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent Utilization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Open Tickets</TableHead>
                <TableHead className="text-right">Capacity</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byAgent.map((agent) => (
                <TableRow key={agent.name}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.team}</TableCell>
                  <TableCell className="text-right">{agent.openTickets}</TableCell>
                  <TableCell className="text-right">{agent.capacity}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={Math.min(agent.utilizationPercent, 100)} 
                        className="h-2 w-20"
                      />
                      <span className="text-sm w-12">{agent.utilizationPercent}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
