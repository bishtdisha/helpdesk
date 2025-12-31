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
import { Users, TrendingUp, Clock, CheckCircle } from "lucide-react"

interface TeamPerformanceData {
  summary: {
    totalTeams: number
    totalTickets: number
    avgResolutionTime: string
    bestTeam: string
  }
  teams: {
    id: string
    name: string
    members: number
    ticketsAssigned: number
    ticketsResolved: number
    avgResolutionTime: string
    slaCompliance: number
    workloadPerMember: number
  }[]
  comparison: {
    team: string
    resolved: number
    pending: number
  }[]
  trend: {
    date: string
    [team: string]: number | string
  }[]
}

export function TeamPerformanceReport({ data }: { data: TeamPerformanceData }) {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Teams</p>
                <p className="text-3xl font-bold">{data.summary.totalTeams}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-3xl font-bold">{data.summary.totalTickets}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Resolution</p>
                <p className="text-3xl font-bold">{data.summary.avgResolutionTime}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Best Team</p>
                <p className="text-xl font-bold truncate">{data.summary.bestTeam}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Workload Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.comparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="team" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="resolved" name="Resolved" fill="#10b981" stackId="a" />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Team Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.teams.map((team, index) => (
          <Card key={team.id} className="border-l-4" style={{ borderLeftColor: colors[index % colors.length] }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{team.name}</CardTitle>
                <Badge variant="outline">{team.members} members</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Assigned</p>
                  <p className="text-xl font-bold">{team.ticketsAssigned}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Resolved</p>
                  <p className="text-xl font-bold text-green-600">{team.ticketsResolved}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">SLA Compliance</span>
                  <span className="font-medium">{team.slaCompliance}%</span>
                </div>
                <Progress value={team.slaCompliance} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                <div>
                  <p className="text-muted-foreground">Avg Resolution</p>
                  <p className="font-medium">{team.avgResolutionTime}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Per Member</p>
                  <p className="font-medium">{team.workloadPerMember} tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resolution Trend by Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {data.teams.slice(0, 5).map((team, index) => (
                  <Line
                    key={team.id}
                    type="monotone"
                    dataKey={team.name}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Team Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead className="text-right">Assigned</TableHead>
                <TableHead className="text-right">Resolved</TableHead>
                <TableHead className="text-right">Avg Time</TableHead>
                <TableHead className="text-right">SLA %</TableHead>
                <TableHead className="text-right">Per Member</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell className="text-right">{team.members}</TableCell>
                  <TableCell className="text-right">{team.ticketsAssigned}</TableCell>
                  <TableCell className="text-right font-medium text-green-600">{team.ticketsResolved}</TableCell>
                  <TableCell className="text-right">{team.avgResolutionTime}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={team.slaCompliance >= 90 ? "default" : team.slaCompliance >= 70 ? "secondary" : "destructive"}>
                      {team.slaCompliance}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{team.workloadPerMember}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
