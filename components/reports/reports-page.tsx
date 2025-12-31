"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, BarChart3, Clock, Users } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { REPORT_DEFINITIONS, ReportType } from "@/lib/reports/report-types"
import { ReportCard } from "./report-card"
import { ReportViewer } from "./report-viewer"

export function ReportsPage() {
  const { user } = useAuth()
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>("all")

  const userRole = user?.role?.name as 'Admin/Manager' | 'Team Leader' | 'User/Employee' | undefined

  // Filter reports based on user role
  const availableReports = REPORT_DEFINITIONS.filter(
    (report) => userRole && report.availableFor.includes(userRole)
  )

  const filteredReports = activeCategory === "all" 
    ? availableReports 
    : availableReports.filter(r => r.category === activeCategory)

  const categories = [
    { id: "all", label: "All Reports", icon: FileText },
    { id: "tickets", label: "Tickets", icon: FileText },
    { id: "performance", label: "Performance", icon: BarChart3 },
    { id: "sla", label: "SLA", icon: Clock },
    { id: "workload", label: "Workload", icon: Users },
  ]

  if (selectedReport) {
    return (
      <ReportViewer 
        reportType={selectedReport} 
        onBack={() => setSelectedReport(null)} 
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 rounded-lg p-6 border border-purple-100 dark:border-purple-900">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate and export detailed reports for your helpdesk data
            </p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-2">
              <cat.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{cat.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No reports available in this category</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onClick={() => setSelectedReport(report.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
