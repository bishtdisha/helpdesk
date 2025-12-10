'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';
import { usePermissions } from '@/lib/hooks/use-permissions';

interface EscalationResult {
  ruleId: string;
  ruleName: string;
  actionType: string;
  success: boolean;
  result?: string;
  error?: string;
}

interface EscalationEvaluateButtonProps {
  ticketId: string;
  onEvaluationComplete?: () => void;
}

export function EscalationEvaluateButton({ ticketId, onEvaluationComplete }: EscalationEvaluateButtonProps) {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    message: string;
    escalationsExecuted: number;
    escalationsFailed: number;
    results: EscalationResult[];
  } | null>(null);
  const { toast } = useToast();
  const { canManageSLA } = usePermissions(); // Using canManageSLA as proxy for admin check

  const handleEvaluate = async () => {
    try {
      setIsEvaluating(true);
      
      const response = await apiClient.post<{
        message: string;
        ticketId: string;
        escalationsExecuted: number;
        escalationsFailed: number;
        results: EscalationResult[];
      }>(`/escalation/evaluate/${ticketId}`, {});

      setResults(response);
      setShowResults(true);

      if (response.escalationsExecuted > 0) {
        toast({
          title: 'Escalation Complete',
          description: `${response.escalationsExecuted} escalation rule(s) executed successfully`,
        });
        
        // Notify parent component to refresh ticket data
        onEvaluationComplete?.();
      } else {
        toast({
          title: 'No Escalations',
          description: response.message,
        });
      }
    } catch (error) {
      console.error('Error evaluating escalation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to evaluate escalation',
        variant: 'destructive',
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  // Only show button to admins
  if (!canManageSLA()) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleEvaluate}
        disabled={isEvaluating}
      >
        {isEvaluating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Evaluating...
          </>
        ) : (
          <>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Evaluate Escalation
          </>
        )}
      </Button>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Escalation Evaluation Results</DialogTitle>
            <DialogDescription>
              {results?.message}
            </DialogDescription>
          </DialogHeader>

          {results && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">
                    {results.escalationsExecuted} Successful
                  </span>
                </div>
                {results.escalationsFailed > 0 && (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium">
                      {results.escalationsFailed} Failed
                    </span>
                  </div>
                )}
              </div>

              {results.results.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Rules Triggered:</h4>
                  {results.results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.success
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {result.success ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="font-medium text-sm">{result.ruleName}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {result.actionType.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </Badge>
                          </div>
                          {result.success && result.result && (
                            <p className="text-sm text-muted-foreground">{result.result}</p>
                          )}
                          {!result.success && result.error && (
                            <p className="text-sm text-red-600">{result.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.results.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No escalation rules were triggered for this ticket.</p>
                  <p className="text-sm mt-1">
                    The ticket does not meet any escalation conditions at this time.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
