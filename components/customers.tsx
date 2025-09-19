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
import { Plus, Search, Eye, Edit, Mail, Phone, MapPin } from "lucide-react"

const mockCustomers = [
  {
    id: "CUST-001",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    company: "Acme Corp",
    status: "Active",
    tickets: 3,
    lastContact: "2024-01-15",
    location: "New York, NY",
  },
  {
    id: "CUST-002",
    name: "Jane Smith",
    email: "jane.smith@techco.com",
    phone: "+1 (555) 987-6543",
    company: "TechCo Inc",
    status: "Active",
    tickets: 7,
    lastContact: "2024-01-14",
    location: "San Francisco, CA",
  },
  {
    id: "CUST-003",
    name: "Bob Johnson",
    email: "bob.johnson@startup.io",
    phone: "+1 (555) 456-7890",
    company: "Startup.io",
    status: "Inactive",
    tickets: 1,
    lastContact: "2024-01-10",
    location: "Austin, TX",
  },
  {
    id: "CUST-004",
    name: "Alice Brown",
    email: "alice.brown@enterprise.com",
    phone: "+1 (555) 321-0987",
    company: "Enterprise Solutions",
    status: "Active",
    tickets: 12,
    lastContact: "2024-01-16",
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
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  const filteredCustomers = mockCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>Enter customer information to create a new profile.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john.doe@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="+1 (555) 123-4567" />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" placeholder="Acme Corp" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="New York, NY" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Create Customer</Button>
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
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>Manage customer profiles and interaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.id}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.company}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>
                    <Badge variant={customer.status === "Active" ? "default" : "secondary"}>{customer.status}</Badge>
                  </TableCell>
                  <TableCell>{customer.tickets}</TableCell>
                  <TableCell>{customer.lastContact}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(customer)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px]">
                          <DialogHeader>
                            <DialogTitle>Customer Profile: {customer.name}</DialogTitle>
                            <DialogDescription>Complete customer information and interaction history</DialogDescription>
                          </DialogHeader>
                          <Tabs defaultValue="profile" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="profile">Profile</TabsTrigger>
                              <TabsTrigger value="tickets">Tickets</TabsTrigger>
                              <TabsTrigger value="interactions">Interactions</TabsTrigger>
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
                                      <span>{customer.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-muted-foreground" />
                                      <span>{customer.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                      <span>{customer.location}</span>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Account Details</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div>
                                      <span className="text-sm text-muted-foreground">Company:</span>
                                      <p className="font-medium">{customer.company}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm text-muted-foreground">Status:</span>
                                      <Badge
                                        className="ml-2"
                                        variant={customer.status === "Active" ? "default" : "secondary"}
                                      >
                                        {customer.status}
                                      </Badge>
                                    </div>
                                    <div>
                                      <span className="text-sm text-muted-foreground">Total Tickets:</span>
                                      <p className="font-medium">{customer.tickets}</p>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </TabsContent>
                            <TabsContent value="tickets">
                              <Card>
                                <CardHeader>
                                  <CardTitle>Customer Tickets</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-muted-foreground">
                                    Ticket history for this customer would be displayed here.
                                  </p>
                                </CardContent>
                              </Card>
                            </TabsContent>
                            <TabsContent value="interactions">
                              <Card>
                                <CardHeader>
                                  <CardTitle>Interaction History</CardTitle>
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
