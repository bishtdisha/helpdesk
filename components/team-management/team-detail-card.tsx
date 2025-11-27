"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Mail, Users, Calendar } from "lucide-react"
import { TeamWithMembers } from "@/lib/types/rbac"

interface TeamDetailCardProps {
  team: TeamWithMembers
  isLeader?: boolean
}

export function TeamDetailCard({ team, isLeader }: TeamDetailCardProps) {
  return (
    <Card className={isLeader ? 'border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {team.name}
              {isLeader && (
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
                  <Crown className="w-3 h-3 mr-1" />
                  You lead this team
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{team.description || 'No description'}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* Team Email */}
          {team.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <a href={`mailto:${team.email}`} className="text-primary hover:underline">
                {team.email}
              </a>
            </div>
          )}
          
          {/* Team Leaders */}
          {team.teamLeaders && team.teamLeaders.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <Crown className="h-4 w-4 text-yellow-500 mt-0.5" />
              <div>
                <span className="text-muted-foreground">Leader{team.teamLeaders.length > 1 ? 's' : ''}:</span>
                <div className="mt-1 space-y-1">
                  {team.teamLeaders.map((tl) => (
                    <div key={tl.id} className="flex items-center gap-2">
                      <span className="font-medium">{tl.user.name}</span>
                      <span className="text-muted-foreground">({tl.user.email})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Member Count */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Members:</span>
            <Badge variant="secondary">{team.members?.length || 0}</Badge>
          </div>
          
          {/* Created Date */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created:</span>
            <span>{new Date(team.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
