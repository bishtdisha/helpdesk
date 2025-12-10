'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface HistoryEntry {
  id: string;
  ticketId: string;
  userId: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface EscalationHistoryProps {
  ticketId: string;
}

export function EscalationHistory({ ticketId }: EscalationHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [ticketId]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.get<{ history: HistoryEntry[] }>(
        `/tickets/${ticketId}/history`
      );
      
      // Filter for escalation-related entries
      const escalationEntries = response.history.filter(
        entry => 
          entry.action === 'escalation_executed' || 
          entry.action === 'escalation_failed'
      );
      
      setHistory(escalationEntries);
    } catch (err) {
      console.error('Error fetching escalation history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch escalation history');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Escalation History</CardTitle>
          <CardDescription>Automated escalation actions for this ticket</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Escalation History</CardTitle>
          <CardDescription>Automated escalation actions for this ticket</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Escalation History</CardTitle>
          <CardDescription>Automated escalation actions for this ticket</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No escalation actions have been executed for this ticket.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Parse escalation details from newValue
  const parseEscalationDetails = (newValue: string | null) => {
    if (!newValue) return null;
    
    try {
      // Format: "Rule: {name}, Action: {type}, Result: {result}"
      const ruleMatch = newValue.match(/Rule: ([^,]+)/);
      const actionMatch = newValue.match(/Action: ([^,]+)/);
      const resultMatch = newValue.match(/Result: (.+)/);
      const errorMatch = newValue.match(/Error: (.+)/);
      
      return {
        ruleName: ruleMatch ? ruleMatch[1].trim() : 'Unknown',
        actionType: actionMatch ? actionMatch[1].trim() : 'Unknown',
        result: resultMatch ? resultMatch[1].trim() : null,
        error: errorMatch ? errorMatch[1].trim() : null,
      };
    } catch (error) {
      return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escalation History</CardTitle>
        <CardDescription>
          Automated escalation actions for this ticket ({history.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry) => {
            const details = parseEscalationDetails(entry.newValue);
            const isSuccess = entry.action === 'escalation_executed';
            
            return (
              <div
                key={entry.id}
                className={`p-4 rounded-lg border ${
                  isSuccess
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {isSuccess ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {isSuccess ? 'Escalation Executed' : 'Escalation Failed'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {entry.user?.name || 'System'}
                      </Badge>
                    </div>
                    
                    {details && (
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Rule:</span>{' '}
                          <span className="font-medium">{details.ruleName}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Action:</span>{' '}
                          <Badge variant="secondary" className="text-xs">
                            {details.actionType.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </Badge>
                        </div>
                        {details.result && (
                          <div className="text-sm text-muted-foreground">
                            {details.result}
                          </div>
                        )}
                        {details.error && (
                          <div className="text-sm text-red-600">
                            Error: {details.error}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
