'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Lightbulb, 
  FileText, 
  Clock, 
  ExternalLink, 
  UserPlus,
  X,
  Zap,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { useTicketMutations } from '@/lib/hooks/use-ticket-mutations';
import { TicketPriority, TicketStatus } from '@prisma/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SuggestedArticle {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  viewCount: number;
  helpfulCount: number;
  relevanceScore: number;
  articleCategories: Array<{
    category: {
      id: string;
      name: string;
    };
  }>;
}

interface SimilarTicket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  resolvedAt: string | null;
  resolutionTime: number | null;
  relevanceScore: number;
}

interface SmartSuggestion {
  type: 'team' | 'priority';
  suggestion: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

interface TicketSuggestedActionsProps {
  ticket: {
    id: string;
    title: string;
    description: string;
    priority: TicketPriority;
    status: TicketStatus;
    category?: string | null;
  };
  onRefresh?: () => void;
}

export function TicketSuggestedActions({ ticket, onRefresh }: TicketSuggestedActionsProps) {
  const [kbSuggestions, setKbSuggestions] = useState<SuggestedArticle[]>([]);
  const [similarTickets, setSimilarTickets] = useState<SimilarTicket[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [loadingKb, setLoadingKb] = useState(false);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [loadingSmart, setLoadingSmart] = useState(false);
  
  const permissions = usePermissions();
  const { updateTicket, assignTicket } = useTicketMutations();

  const ticketContent = `${ticket.title} ${ticket.description}`;

  // Fetch KB article suggestions
  useEffect(() => {
    if (ticketContent.length > 10) {
      fetchKbSuggestions();
    }
  }, [ticketContent]);

  // Fetch similar tickets
  useEffect(() => {
    if (ticketContent.length > 10) {
      fetchSimilarTickets();
    }
  }, [ticketContent]);

  // Generate smart suggestions
  useEffect(() => {
    if (ticketContent.length > 10) {
      generateSmartSuggestions();
    }
  }, [ticketContent]);

  const fetchKbSuggestions = async () => {
    try {
      setLoadingKb(true);
      const response = await fetch(
        `/api/knowledge-base/suggest?content=${encodeURIComponent(ticketContent)}&limit=3`
      );
      if (response.ok) {
        const data = await response.json();
        setKbSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching KB suggestions:', error);
    } finally {
      setLoadingKb(false);
    }
  };

  const fetchSimilarTickets = async () => {
    try {
      setLoadingSimilar(true);
      const response = await fetch(
        `/api/tickets/similar?content=${encodeURIComponent(ticketContent)}&limit=3&excludeId=${ticket.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setSimilarTickets(data.similarTickets || []);
      }
    } catch (error) {
      console.error('Error fetching similar tickets:', error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const generateSmartSuggestions = async () => {
    try {
      setLoadingSmart(true);
      const suggestions: SmartSuggestion[] = [];

      // Priority suggestions based on keywords
      const urgentKeywords = ['urgent', 'critical', 'emergency', 'down', 'outage', 'broken'];
      const highKeywords = ['important', 'asap', 'soon', 'issue', 'problem', 'error'];
      
      const content = ticketContent.toLowerCase();
      
      if (ticket.priority !== 'URGENT' && urgentKeywords.some(keyword => content.includes(keyword))) {
        suggestions.push({
          type: 'priority',
          suggestion: 'URGENT',
          reason: 'Contains urgent keywords indicating high severity',
          confidence: 'high'
        });
      } else if (ticket.priority === 'LOW' && highKeywords.some(keyword => content.includes(keyword))) {
        suggestions.push({
          type: 'priority',
          suggestion: 'HIGH',
          reason: 'Contains keywords suggesting higher priority',
          confidence: 'medium'
        });
      }

      // Team suggestions based on category/content
      const techKeywords = ['server', 'database', 'api', 'code', 'bug', 'deployment'];
      const supportKeywords = ['account', 'login', 'password', 'billing', 'subscription'];
      
      if (techKeywords.some(keyword => content.includes(keyword))) {
        suggestions.push({
          type: 'team',
          suggestion: 'Technical Team',
          reason: 'Contains technical keywords',
          confidence: 'medium'
        });
      } else if (supportKeywords.some(keyword => content.includes(keyword))) {
        suggestions.push({
          type: 'team',
          suggestion: 'Support Team',
          reason: 'Contains support-related keywords',
          confidence: 'medium'
        });
      }

      setSmartSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating smart suggestions:', error);
    } finally {
      setLoadingSmart(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    try {
      switch (action) {
        case 'close':
          await updateTicket(ticket.id, { status: 'CLOSED' }, { showUndo: true });
          break;
        case 'resolve':
          await updateTicket(ticket.id, { status: 'RESOLVED' }, { showUndo: true });
          break;
        case 'in_progress':
          await updateTicket(ticket.id, { status: 'IN_PROGRESS' }, { showUndo: true });
          break;
        default:
          break;
      }
      onRefresh?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update ticket');
    }
  };

  const handleApplySuggestion = async (suggestion: SmartSuggestion) => {
    try {
      if (suggestion.type === 'priority') {
        await updateTicket(ticket.id, { priority: suggestion.suggestion as TicketPriority });
        toast.success(`Priority updated to ${suggestion.suggestion}`);
        onRefresh?.();
      }
      // Team assignment would require additional API integration
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to apply suggestion');
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 20) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (score >= 10) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case 'medium': return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case 'low': return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Don't show if no content or ticket is already closed
  if (ticketContent.length <= 10 || ticket.status === 'CLOSED') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Suggested Actions
        </CardTitle>
        <CardDescription>
          AI-powered suggestions to help resolve this ticket faster
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Actions */}
        {permissions.canEditTicket(ticket) && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Actions
            </h4>
            <div className="flex flex-wrap gap-2">
              {ticket.status !== 'IN_PROGRESS' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('in_progress')}
                  className="gap-1"
                >
                  <TrendingUp className="h-3 w-3" />
                  Start Progress
                </Button>
              )}
              {ticket.status !== 'RESOLVED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('resolve')}
                  className="gap-1"
                >
                  <FileText className="h-3 w-3" />
                  Mark Resolved
                </Button>
              )}
              {ticket.status !== 'CLOSED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('close')}
                  className="gap-1"
                >
                  <X className="h-3 w-3" />
                  Close Ticket
                </Button>
              )}
              {permissions.canAssignTicket(ticket) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  <UserPlus className="h-3 w-3" />
                  Assign
                </Button>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Smart Suggestions */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Smart Suggestions
          </h4>
          {loadingSmart ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
            </div>
          ) : smartSuggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No suggestions available</p>
          ) : (
            <div className="space-y-2">
              {smartSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {suggestion.type === 'priority' ? 'Priority' : 'Team'}: {suggestion.suggestion}
                        </span>
                        <Badge className={getConfidenceColor(suggestion.confidence)} variant="outline">
                          {suggestion.confidence}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                    </div>
                    {permissions.canEditTicket(ticket) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApplySuggestion(suggestion)}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* KB Article Suggestions */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Knowledge Base Articles
          </h4>
          {loadingKb ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : kbSuggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No relevant articles found</p>
          ) : (
            <div className="space-y-2">
              {kbSuggestions.map((article) => (
                <div
                  key={article.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h5 className="font-medium text-sm line-clamp-1 flex-1">{article.title}</h5>
                    <Badge className={getRelevanceColor(article.relevanceScore)} variant="outline">
                      {article.relevanceScore >= 20 ? "High" : article.relevanceScore >= 10 ? "Medium" : "Low"}
                    </Badge>
                  </div>
                  {article.summary && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {article.summary}
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 h-auto p-1"
                    onClick={() => window.open(`/dashboard/knowledge-base/${article.id}`, '_blank')}
                  >
                    View Article
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Similar Tickets */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Similar Resolved Tickets
          </h4>
          {loadingSimilar ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : similarTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No similar tickets found</p>
          ) : (
            <div className="space-y-2">
              {similarTickets.map((similarTicket) => (
                <div
                  key={similarTicket.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h5 className="font-medium text-sm line-clamp-1 flex-1">{similarTicket.title}</h5>
                    <Badge className={getRelevanceColor(similarTicket.relevanceScore)} variant="outline">
                      {similarTicket.relevanceScore >= 20 ? "High" : similarTicket.relevanceScore >= 10 ? "Medium" : "Low"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {similarTicket.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Status: {similarTicket.status}</span>
                      {similarTicket.resolutionTime && (
                        <span>• Resolved in {similarTicket.resolutionTime}h</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 h-auto p-1"
                      onClick={() => window.open(`/dashboard/tickets/${similarTicket.id}`, '_blank')}
                    >
                      View Ticket
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}