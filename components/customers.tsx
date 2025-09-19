"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Eye, Edit, Mail, Phone, MapPin, Users, Building, UserCheck, Clock } from "lucide-react"

const mockTeams = [
  {
    id: "TEAM-001",
    name: "Development Team",
    lead: "John Doe",
    email: "dev-team@company.com",
    phone: "+1 (555) 123-4567",
    department: "Engineering",
    status: "Active",
    members: 8,
    tickets: 15,
    lastActivity: "2024-01-15",
    location: "New York, NY",
  },
  {
    id: "TEAM-002",
    name: "Support Team",
    lead: "Jane Smith",
    email: "support@company.com",
    phone: "+1 (555) 987-6543",
    department: "Customer Success",
    status: "Active",
    members: 12,
    tickets: 23,
    lastActivity: "2024-01-14",
    location: "San Francisco, CA",
  },
  {
    id: "TEAM-003",
    name: "Marketing Team",
    lead: "Bob Johnson",
    email: "marketing@company.com",
    phone: "+1 (555) 456-7890",
    department: "Marketing",
    status: "Active",
    members: 6,
    tickets: 5,
    lastActivity: "2024-01-10",
    location: "Austin, TX",
  },
  {
    id: "TEAM-004",
    name: "Sales Team",
    lead: "Alice Brown",
    email: "sales@company.com",
    phone: "+1 (555) 321-0987",
    department: "Sales",
    status: "Active",
    members: 10,
    tickets: 8,
    lastActivity: "2024-01-16",
    location: "Chicago, IL",
  },
]

const mockInteractions = [
  { date: "2024-01-15", type: "Email", subject: "Login issue resolved", agent: "Sarah Wilson" },
  { date: "2024-01-14", type: "Phone", subject: "Account setup assistance", agent: "Mike Johnson" },
  { date: "2024-01-12", type: "Chat", subject: "Billing inquiry", agent: "Lisa Chen" },
  { date: "2024-01-10", type: "Email", subject: "Feature request follow-up", agent: "David Lee" },
]

export function Customers() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<any>(null)

  const filteredTeams = mockTeams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.lead.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.department.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalTeams = mockTeams.length
  const activeTeams = mockTeams.filter((team) => team.status === "Active").length
  const totalMembers = mockTeams.reduce((sum, team) => sum + team.members, 0)
  const totalTickets = mockTeams.reduce((sum, team) => sum + team.tickets, 0)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
        <p className="text-muted-foreground">Manage your teams, members, and track their support activities.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeams}</div>
            <p className="text-xs text-muted-foreground">Across all departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTeams}</div>
            <p className="text-xs text-muted-foreground">Currently operational</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">Across all teams</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets}</div>
            <p className="text-xs text-muted-foreground">Assigned to teams</p>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Team</DialogTitle>
                <DialogDescription>Create a new team and assign a team lead.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input id="teamName" placeholder="Development Team" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="teamLead">Team Lead</Label>
                    <Input id="teamLead" placeholder="John Doe" />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" placeholder="Engineering" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Team Email</Label>
                  <Input id="email" type="email" placeholder="team@company.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="+1 (555) 123-4567" />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" placeholder="New York, NY" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Create Team</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">Import</Button>
          <Button variant="outline">Export</Button>
        </div>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Teams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Directory</CardTitle>
          <CardDescription>Manage team information and track their activities</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team ID</TableHead>
                <TableHead>Team Name</TableHead>
                <TableHead>Team Lead</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.id}</TableCell>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>{team.lead}</TableCell>
                  <TableCell>{team.department}</TableCell>
                  <TableCell>{team.members}</TableCell>
                  <TableCell>
                    <Badge variant={team.status === "Active" ? "default" : "secondary"}>{team.status}</Badge>
                  </TableCell>
                  <TableCell>{team.tickets}</TableCell>
                  <TableCell>{team.lastActivity}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedTeam(team)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px]">
                          <DialogHeader>
                            <DialogTitle>Team Profile: {team.name}</DialogTitle>
                            <DialogDescription>Complete team information and activity history</DialogDescription>
                          </DialogHeader>
                          <Tabs defaultValue="profile" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="profile">Profile</TabsTrigger>
                              <TabsTrigger value="members">Members</TabsTrigger>
                              <TabsTrigger value="activity">Activity</TabsTrigger>
                            </TabsList>
                            <TabsContent value="profile" className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Contact Information</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-muted-foreground" />
                                      <span>{team.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-muted-foreground" />
                                      <span>{team.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                      <span>{team.location}</span>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Team Details</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div>
                                      <span className="text-sm text-muted-foreground">Team Lead:</span>
                                      <p className="font-medium">{team.lead}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm text-muted-foreground">Department:</span>
                                      <p className="font-medium">{team.department}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm text-muted-foreground">Members:</span>
                                      <p className="font-medium">{team.members}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm text-muted-foreground">Status:</span>
                                      <Badge
                                        className="ml-2"
                                        variant={team.status === "Active" ? "default" : "secondary"}
                                      >
                                        {team.status}
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </TabsContent>
                            <TabsContent value="members">
                              <Card>
                                <CardHeader>
                                  <CardTitle>Team Members</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-muted-foreground">
                                    Team member list and roles would be displayed here.
                                  </p>
                                </CardContent>
                              </Card>
                            </TabsContent>
                            <TabsContent value="activity">
                              <Card>
                                <CardHeader>
                                  <CardTitle>Recent Activity</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-3">
                                    {mockInteractions.map((interaction, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                      >
                                        <div>
                                          <p className="font-medium">{interaction.subject}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {interaction.type} • {interaction.agent}
                                          </p>
                                        </div>
                                        <span className="text-sm text-muted-foreground">{interaction.date}</span>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
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
