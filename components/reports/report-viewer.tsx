"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowLeft, 
  Download, 
  FileSpreadsheet, 
  Loader2,
  RefreshCw 
} from "lucide-react"
import { ReportType, REPORT_DEFINITIONS, ReportFilters as ReportFiltersType } from "@/lib/reports/report-types"
import { ReportFilters } from "./report-filters"
import { TicketSummaryReport } from "./templates/ticket-summary-report"
import { SLAComplianceReport } from "./templates/sla-compliance-report"
import { AgentPerformanceReport } from "./templates/agent-performance-report"
import { TeamPerformanceReport } from "./templates/team-performance-report"
import { AgingReport } from "./templates/aging-report"
import { WorkloadDistributionReport } from "./templates/workload-distribution-report"
import { ResolutionTimeReport } from "./templates/resolution-time-report"
import { subDays } from "date-fns"

interface ReportViewerProps {
  reportType: ReportType
  onBack: () => void
}

export function ReportViewer({ reportType, onBack }: ReportViewerProps) {
  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const reportDef = REPORT_DEFINITIONS.find((r) => r.id === reportType)

  const generateReport = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (filters.dateRange.from) params.set("from", filters.dateRange.from.toISOString())
      if (filters.dateRange.to) params.set("to", filters.dateRange.to.toISOString())
      if (filters.teamId) params.set("teamId", filters.teamId)
      if (filters.assigneeId) params.set("assigneeId", filters.assigneeId)
      if (filters.status?.length) params.set("status", filters.status.join(","))
      if (filters.priority?.length) params.set("priority", filters.priority.join(","))

      const response = await fetch(`/api/reports/${reportType}?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to generate report")
      }

      const data = await response.json()
      setReportData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  const exportReport = async () => {
    setIsExporting(true)
    
    try {
      const params = new URLSearchParams()
      if (filters.dateRange.from) params.set("from", filters.dateRange.from.toISOString())
      if (filters.dateRange.to) params.set("to", filters.dateRange.to.toISOString())
      if (filters.teamId) params.set("teamId", filters.teamId)
      if (filters.assigneeId) params.set("assigneeId", filters.assigneeId)
      if (filters.status?.length) params.set("status", filters.status.join(","))
      if (filters.priority?.length) params.set("priority", filters.priority.join(","))
      params.set("export", "true")

      const response = await fetch(`/api/reports/${reportType}?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to export report")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${reportType}-report-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed")
    } finally {
      setIsExporting(false)
    }
  }

  // Auto-generate on mount and filter change
  useEffect(() => {
    generateReport()
  }, [])

  const renderReportContent = () => {
    if (isGenerating) {
      return (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Generating report...</p>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (error) {
      return (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-destructive">{error}</p>
              <Button onClick={generateReport}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (!reportData) {
      return (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-muted-foreground">Click "Generate Report" to view data</p>
            </div>
          </CardContent>
        </Card>
      )
    }

    switch (reportType) {
      case "ticket-summary":
        return <TicketSummaryReport data={reportData} />
      case "sla-compliance":
        return <SLAComplianceReport data={reportData} />
      case "agent-performance":
        return <AgentPerformanceReport data={reportData} />
      case "team-performance":
        return <TeamPerformanceReport data={reportData} />
      case "aging-report":
        return <AgingReport data={reportData} />
      case "workload-distribution":
        return <WorkloadDistributionReport data={reportData} />
      case "resolution-time":
        return <ResolutionTimeReport data={reportData} />
      default:
        return (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Report template not implemented yet
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{reportDef?.name}</h1>
            <p className="text-sm text-muted-foreground">{reportDef?.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={generateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Generate
          </Button>
          <Button 
            onClick={exportReport}
            disabled={isExporting || !reportData}
            className="bg-green-600 hover:bg-green-700"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ReportFilters
        filters={filters}
        onChange={setFilters}
        showTeamFilter={reportType !== "agent-performance"}
        showAssigneeFilter={reportType === "agent-performance" || reportType === "ticket-summary"}
      />

      {/* Report Content */}
      {renderReportContent()}
    </div>
  )
}
