"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from "recharts";
import { 
  TrendingUp, TrendingDown, Minus, AlertCircle, Award, AlertTriangle, Download 
} from "lucide-react";
import { ComparativeAnalysis } from '@/lib/services/analytics-service';

interface ComparativeAnalysisProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export function ComparativeAnalysisComponent({ dateRange }: ComparativeAnalysisProps) {
  const [analysis, setAnalysis] = useState<ComparativeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysis();
  }, [dateRange]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      });

      const response = await fetch(`/api/analytics/comparative?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch comparative analysis');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching comparative analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        format: 'csv',
      });

      const response = await fetch(`/api/analytics/export?type=comparative&${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comparative-analysis-${dateRange.startDate.toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting report:', err);
    }
  };

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
      case 'declining':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
      case 'stable':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading comparative analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  // Prepare radar chart data for top 5 teams
  const radarData = analysis.teamRankings.slice(0, 5).map(team => ({
    team: team.teamName,
    'Resolution Time': Math.max(0, 100 - team.metrics.resolutionTime), // Invert so higher is better
    'SLA Compliance': team.metrics.slaCompliance,
    'Customer Satisfaction': team.metrics.customerSatisfaction * 20, // Scale to 100
    'Ticket Volume': Math.min(100, (team.metrics.ticketVolume / Math.max(...analysis.teamRankings.map(t => t.metrics.ticketVolume))) * 100),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Comparative Analysis</h2>
          <p className="text-muted-foreground">
            Cross-team performance comparison and insights
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Analysis
        </Button>
      </div>

      {/* Executive Summary */}
      <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 dark:from-blue-950/30 to-white dark:to-background">
        <CardHeader>
          <CardTitle className="text-gray-700 dark:text-gray-200">Executive Summary</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Key insights and overall performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {analysis.executiveSummary.totalTickets}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Resolution Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {analysis.executiveSummary.overallResolutionTime.toFixed(1)}h
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">SLA Compliance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {analysis.executiveSummary.overallSLACompliance.toFixed(1)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Customer Satisfaction</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {analysis.executiveSummary.overallCustomerSatisfaction.toFixed(1)}/5
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Top Performing Team</h4>
            </div>
            <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
              {analysis.executiveSummary.topPerformingTeam}
            </p>
          </div>

          {analysis.executiveSummary.areasForImprovement.length > 0 && (
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500" />
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Areas for Improvement</h4>
              </div>
              <ul className="space-y-2">
                {analysis.executiveSummary.areasForImprovement.map((area, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-orange-600 dark:text-orange-500 mt-0.5">•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Rankings */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-gray-700 dark:text-gray-200">Team Rankings</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Teams ranked by composite performance score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Rank</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Team</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Score</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Resolution Time</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">SLA Compliance</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Customer Sat.</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Tickets</th>
                </tr>
              </thead>
              <tbody>
                {analysis.teamRankings.map((team) => (
                  <tr key={team.teamId} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <Badge 
                        variant={team.rank <= 3 ? "default" : "outline"}
                        className={team.rank === 1 ? "bg-yellow-500" : team.rank === 2 ? "bg-gray-400" : team.rank === 3 ? "bg-orange-600" : ""}
                      >
                        #{team.rank}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{team.teamName}</td>
                    <td className="text-right py-3 px-4">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{team.score.toFixed(1)}</span>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">{team.metrics.resolutionTime.toFixed(1)}h</td>
                    <td className="text-right py-3 px-4">
                      <Badge 
                        variant={
                          team.metrics.slaCompliance >= 90 ? "default" :
                          team.metrics.slaCompliance >= 80 ? "secondary" :
                          "destructive"
                        }
                      >
                        {team.metrics.slaCompliance.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">{team.metrics.customerSatisfaction.toFixed(1)}/5</td>
                    <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">{team.metrics.ticketVolume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Radar Chart */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-gray-700 dark:text-gray-200">Multi-Dimensional Performance</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Top 5 teams across key performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <PolarAngleAxis 
                dataKey="team" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                className="dark:[&_text]:fill-gray-400"
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#6b7280' }}
                className="dark:[&_text]:fill-gray-400"
              />
              <Radar 
                name="Performance" 
                dataKey="SLA Compliance" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.3}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-gray-700 dark:text-gray-200">Performance Trends</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Team performance changes compared to previous period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.performanceTrends.map((trend, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-4 rounded-lg border ${getTrendColor(trend.trend)}`}
              >
                <div className="flex items-center gap-3">
                  {getTrendIcon(trend.trend)}
                  <div>
                    <p className="font-medium">{trend.teamName}</p>
                    <p className="text-sm opacity-80">
                      {trend.metric === 'resolutionTime' ? 'Resolution Time' : trend.metric}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="font-semibold">
                    {trend.trend === 'improving' ? '↓' : trend.trend === 'declining' ? '↑' : '→'} {trend.changePercentage.toFixed(1)}%
                  </Badge>
                  <p className="text-xs mt-1 opacity-80 capitalize">{trend.trend}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Outliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Performers */}
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600 dark:text-green-500" />
              High Performers
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Teams and agents exceeding expectations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.outliers
                .filter(o => o.type === 'high_performer')
                .map((outlier, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{outlier.entityName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {outlier.metric === 'resolutionTime' ? 'Resolution Time' : 
                         outlier.metric === 'slaCompliance' ? 'SLA Compliance' : 
                         outlier.metric}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        {outlier.metric === 'slaCompliance' ? `${outlier.value.toFixed(1)}%` : 
                         outlier.metric === 'resolutionTime' ? `${outlier.value.toFixed(1)}h` :
                         outlier.value.toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {outlier.deviation.toFixed(1)}σ above avg
                      </p>
                    </div>
                  </div>
                ))}
              {analysis.outliers.filter(o => o.type === 'high_performer').length === 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                  No significant high performers identified
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/30 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500" />
              Needs Attention
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Teams and agents requiring support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.outliers
                .filter(o => o.type === 'needs_attention')
                .map((outlier, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{outlier.entityName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {outlier.metric === 'resolutionTime' ? 'Resolution Time' : 
                         outlier.metric === 'slaCompliance' ? 'SLA Compliance' : 
                         outlier.metric}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orange-600 dark:text-orange-400">
                        {outlier.metric === 'slaCompliance' ? `${outlier.value.toFixed(1)}%` : 
                         outlier.metric === 'resolutionTime' ? `${outlier.value.toFixed(1)}h` :
                         outlier.value.toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {outlier.deviation.toFixed(1)}σ {outlier.metric === 'resolutionTime' ? 'above' : 'below'} avg
                      </p>
                    </div>
                  </div>
                ))}
              {analysis.outliers.filter(o => o.type === 'needs_attention').length === 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                  All teams performing within expected range
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
