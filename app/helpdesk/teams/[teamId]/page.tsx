"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { TeamKanbanBoard } from '@/components/team-management/team-kanban-board';
import { TeamWithMembers } from '@/lib/types/rbac';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TeamBoardPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;
  
  const [team, setTeam] = useState<TeamWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teamId) {
      fetchTeam();
    }
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/teams/${teamId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Team not found');
        }
        throw new Error('Failed to fetch team');
      }

      const data = await response.json();
      setTeam(data.team || data);
    } catch (err) {
      console.error('Error fetching team:', err);
      setError(err instanceof Error ? err.message : 'Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/helpdesk/teams');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-destructive">{error || 'Team not found'}</p>
        <Button onClick={handleBack}>Back to Teams</Button>
      </div>
    );
  }

  return <TeamKanbanBoard team={team} onBack={handleBack} />;
}
