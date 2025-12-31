"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Clock, 
  User, 
  Users, 
  Timer, 
  Calendar, 
  BarChart3,
  ArrowRight 
} from "lucide-react"
import { ReportDefinition } from "@/lib/reports/report-types"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Clock,
  User,
  Users,
  Timer,
  Calendar,
  BarChart3,
}

const categoryColors: Record<string, string> = {
  tickets: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  performance: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  sla: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  workload: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
}

const iconBgColors: Record<string, string> = {
  tickets: "bg-blue-100 dark:bg-blue-900",
  performance: "bg-green-100 dark:bg-green-900",
  sla: "bg-orange-100 dark:bg-orange-900",
  workload: "bg-purple-100 dark:bg-purple-900",
}

const iconTextColors: Record<string, string> = {
  tickets: "text-blue-600 dark:text-blue-400",
  performance: "text-green-600 dark:text-green-400",
  sla: "text-orange-600 dark:text-orange-400",
  workload: "text-purple-600 dark:text-purple-400",
}

interface ReportCardProps {
  report: ReportDefinition
  onClick: () => void
}

export function ReportCard({ report, onClick }: ReportCardProps) {
  const Icon = iconMap[report.icon] || FileText

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4"
      style={{ borderLeftColor: `var(--${report.category}-color, #6366f1)` }}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-lg ${iconBgColors[report.category]}`}>
            <Icon className={`h-5 w-5 ${iconTextColors[report.category]}`} />
          </div>
          <Badge variant="secondary" className={`text-xs ${categoryColors[report.category]}`}>
            {report.category}
          </Badge>
        </div>
        <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">
          {report.name}
        </CardTitle>
        <CardDescription className="text-sm line-clamp-2">
          {report.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button 
          variant="ghost" 
          className="w-full justify-between group-hover:bg-muted"
        >
          <span>Generate Report</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  )
}
