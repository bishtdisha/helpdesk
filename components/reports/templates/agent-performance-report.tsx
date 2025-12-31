"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from "recharts"
import { User, Trophy, Clock, CheckCircle, TrendingUp } from "lucide-react"

interface AgentPerformanceData {
  summary: {
    totalAgents: number
    totalTicketsResolved: number
    avgResolutionTime: string
    topPerformer: string
  }
  agents: {
    id: string
    name: string
    team: string
    ticketsAssigned: number
    ticketsResolved: number
    avgResolutionTime: string
    slaCompliance: number
    customerSatisfaction: number
  }[]
  topPerformers: {
    name: string
    resolved: number
    avgTime: string
    slaRate: number
  }[]
  performanceMetrics: {
    agent: string
    speed: number
    quality: number
    volume: number
    sla: number
  }[]
}

export function AgentPerformanceReport({ data }: { data: AgentPerformanceData }) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-3xl font-bold">{data.summary.totalAgents}</p>
              </div>
              <User className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tickets Resolved</p>
                <p className="text-3xl font-bold text-green-600">{data.summary.totalTicketsResolved}</p>
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
                <p className="text-sm text-muted-foreground">Top Performer</p>
                <p className="text-xl font-bold truncate">{data.summary.topPerformer}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.topPerformers.slice(0, 3).map((performer, index) => (
              <div 
                key={performer.name}
                className={`p-4 rounded-lg border-2 ${
                  index === 0 ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950' :
                  index === 1 ? 'border-gray-300 bg-gray-50 dark:bg-gray-900' :
                  'border-orange-300 bg-orange-50 dark:bg-orange-950'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    'bg-orange-400'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-semibold">{performer.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Resolved</p>
                    <p className="font-bold">{performer.resolved}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Time</p>
                    <p className="font-bold">{performer.avgTime}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">SLA</p>
                    <p className="font-bold text-green-600">{performer.slaRate}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets by Agent */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tickets Resolved by Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.agents.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="ticketsResolved" name="Resolved" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Comparison (Top 3)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={[
                  { metric: 'Speed', ...Object.fromEntries(data.performanceMetrics.slice(0, 3).map(p => [p.agent, p.speed])) },
                  { metric: 'Quality', ...Object.fromEntries(data.performanceMetrics.slice(0, 3).map(p => [p.agent, p.quality])) },
                  { metric: 'Volume', ...Object.fromEntries(data.performanceMetrics.slice(0, 3).map(p => [p.agent, p.volume])) },
                  { metric: 'SLA', ...Object.fromEntries(data.performanceMetrics.slice(0, 3).map(p => [p.agent, p.sla])) },
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  {data.performanceMetrics.slice(0, 3).map((agent, index) => (
                    <Radar
                      key={agent.agent}
                      name={agent.agent}
                      dataKey={agent.agent}
                      stroke={['#3b82f6', '#10b981', '#f59e0b'][index]}
                      fill={['#3b82f6', '#10b981', '#f59e0b'][index]}
                      fillOpacity={0.2}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Assigned</TableHead>
                <TableHead className="text-right">Resolved</TableHead>
                <TableHead className="text-right">Avg Time</TableHead>
                <TableHead className="text-right">SLA %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <div className="bg-primary text-primary-foreground flex items-center justify-center h-full text-sm">
                          {agent.name.charAt(0)}
                        </div>
                      </Avatar>
                      <span className="font-medium">{agent.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{agent.team}</TableCell>
                  <TableCell className="text-right">{agent.ticketsAssigned}</TableCell>
                  <TableCell className="text-right font-medium text-green-600">{agent.ticketsResolved}</TableCell>
                  <TableCell className="text-right">{agent.avgResolutionTime}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={agent.slaCompliance >= 90 ? "default" : agent.slaCompliance >= 70 ? "secondary" : "destructive"}>
                      {agent.slaCompliance}%
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
