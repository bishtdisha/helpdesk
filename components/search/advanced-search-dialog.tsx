'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TicketFilters, TicketStatus, TicketPriority } from '@/lib/types/ticket';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { useRecentSearches } from '@/lib/hooks/use-recent-searches';
import { CustomerSearchInput } from '@/components/user-management/customer-search-input';
import { DynamicDropdownSelect } from '@/components/search/dynamic-dropdown-select';
import { Search, Calendar as CalendarIcon, X, Filter, ExternalLink, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
}

interface AdvancedSearchFilters extends TicketFilters {
  ticketId?: string;
  customer?: Customer;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  resolvedAfter?: Date;
  resolvedBefore?: Date;
}

interface AdvancedSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (filters: AdvancedSearchFilters) => void;
  initialFilters?: AdvancedSearchFilters;
}

export function AdvancedSearchDialog({
  open,
  onOpenChange,
  onSearch,
  initialFilters = {},
}: AdvancedSearchDialogProps) {
  const permissions = usePermissions();
  const router = useRouter();
  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches, generateSearchName } = useRecentSearches();
  
  // Form state
  const [filters, setFilters] = useState<AdvancedSearchFilters>(initialFilters);
  
  // Ticket ID search state
  const [isCheckingTicketId, setIsCheckingTicketId] = useState(false);
  
  // Date picker states
  const [createdAfterOpen, setCreatedAfterOpen] = useState(false);
  const [createdBeforeOpen, setCreatedBeforeOpen] = useState(false);
  const [updatedAfterOpen, setUpdatedAfterOpen] = useState(false);
  const [updatedBeforeOpen, setUpdatedBeforeOpen] = useState(false);
  const [resolvedAfterOpen, setResolvedAfterOpen] = useState(false);
  const [resolvedBeforeOpen, setResolvedBeforeOpen] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFilters(initialFilters);
    }
  }, [open, initialFilters]);

  // Handle form field changes
  const updateFilter = <K extends keyof AdvancedSearchFilters>(
    key: K,
    value: AdvancedSearchFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle array field changes (status, priority)
  const updateArrayFilter = <K extends keyof AdvancedSearchFilters>(
    key: K,
    value: string,
    checked: boolean
  ) => {
    setFilters(prev => {
      const currentArray = (prev[key] as string[]) || [];
      if (checked) {
        return {
          ...prev,
          [key]: [...currentArray, value],
        };
      } else {
        return {
          ...prev,
          [key]: currentArray.filter(item => item !== value),
        };
      }
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
  };

  // Handle ticket ID search with exact match navigation
  const handleTicketIdChange = async (ticketId: string) => {
    updateFilter('ticketId', ticketId);
    
    // If it looks like a complete ticket ID (8+ characters), try to find exact match
    if (ticketId.length >= 8) {
      setIsCheckingTicketId(true);
      try {
        // Try to find exact match
        const response = await apiClient.get(`/tickets/${ticketId}`);
        if (response) {
          // Found exact match, offer to navigate directly
          toast.success(
            `Found ticket: ${response.title}`,
            {
              action: {
                label: 'View Ticket',
                onClick: () => {
                  router.push(`/dashboard/tickets/${ticketId}`);
                  onOpenChange(false);
                },
              },
            }
          );
        }
      } catch {
        // Ticket not found or no access, continue with search
      } finally {
        setIsCheckingTicketId(false);
      }
    }
  };

  // Handle search
  const handleSearch = () => {
    // Remove empty values and transform customer object
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        
        // Transform customer object to customerId for API
        if (key === 'customer' && value && typeof value === 'object' && 'id' in value) {
          acc.customerId = (value as Customer).id;
        } else {
          acc[key as keyof AdvancedSearchFilters] = value;
        }
      }
      return acc;
    }, {} as AdvancedSearchFilters);

    // Save to recent searches if there are any filters
    if (Object.keys(cleanFilters).length > 0) {
      const searchName = generateSearchName(cleanFilters);
      addRecentSearch(searchName, cleanFilters);
    }

    onSearch(cleanFilters);
    onOpenChange(false);
  };

  // Apply a recent search
  const applyRecentSearch = (recentSearch: { name: string; filters: AdvancedSearchFilters }) => {
    // Transform the saved filters back to component state
    const transformedFilters: AdvancedSearchFilters = { ...recentSearch.filters };
    
    // If there's a customerId, we need to fetch the customer details
    // For now, we'll just set the basic filters
    setFilters(transformedFilters);
    
    toast.success(`Applied search: ${recentSearch.name}`);
  };

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(value => 
    value !== undefined && value !== null && value !== '' && 
    !(Array.isArray(value) && value.length === 0)
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Search
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Use multiple criteria to find specific tickets. All fields are optional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Searches
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRecentSearches}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear All
                </Button>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {recentSearches.map((search) => (
                  <div
                    key={search.id}
                    className="flex items-center gap-2 p-2 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => applyRecentSearch(search)}
                      className="flex-1 justify-start text-left h-auto p-1 font-normal"
                    >
                      <div className="truncate text-xs">{search.name}</div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecentSearch(search.id)}
                      className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentSearches.length > 0 && <Separator />}

          {/* Basic Search */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Basic Search</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Keywords</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search in title and description..."
                    value={filters.search || ''}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticketId">Ticket ID</Label>
                <div className="relative">
                  <Input
                    id="ticketId"
                    placeholder="Enter ticket ID or partial ID..."
                    value={filters.ticketId || ''}
                    onChange={(e) => handleTicketIdChange(e.target.value)}
                    disabled={isCheckingTicketId}
                  />
                  {isCheckingTicketId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
                {filters.ticketId && filters.ticketId.length >= 8 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Complete ticket IDs will show a direct link if found
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Customer Search */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Customer Information</h4>
            
            <div className="space-y-2">
              <Label>Customer</Label>
              <CustomerSearchInput
                value={filters.customer?.name || ''}
                onSelect={(customer) => updateFilter('customer', customer)}
                placeholder="Search by customer name or email..."
              />
              {filters.customer && (
                <p className="text-xs text-muted-foreground">
                  Selected: {filters.customer.name} ({filters.customer.email})
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Status and Priority */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Status & Priority</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex flex-wrap gap-2">
                  {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as TicketStatus[]).map((status) => (
                    <Badge
                      key={status}
                      variant={filters.status?.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => updateArrayFilter('status', status, !filters.status?.includes(status))}
                    >
                      {status === 'WAITING_FOR_CUSTOMER' ? 'On Hold' : 
                       status === 'CLOSED' ? 'Cancelled' : 
                       status.replace('_', ' ')}
                      {filters.status?.includes(status) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex flex-wrap gap-2">
                  {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TicketPriority[]).map((priority) => (
                    <Badge
                      key={priority}
                      variant={filters.priority?.includes(priority) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => updateArrayFilter('priority', priority, !filters.priority?.includes(priority))}
                    >
                      {priority}
                      {filters.priority?.includes(priority) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Team and Assignment - Only for users with team permissions */}
          {permissions.canViewTeamTickets() && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Assignment</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamId">Team</Label>
                    <DynamicDropdownSelect
                      value={filters.teamId || ''}
                      onValueChange={(value: string) => updateFilter('teamId', value || undefined)}
                      placeholder="Select team..."
                      apiEndpoint="/api/teams"
                      responseKey="teams"
                      formatLabel={(team: { name: string }) => team.name}
                      formatValue={(team: { id: string }) => team.id}
                      allowClear
                      clearLabel="All Teams"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignedTo">Assigned To</Label>
                    <Select value={filters.assignedTo || ''} onValueChange={(value) => updateFilter('assignedTo', value || undefined)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Assignees</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {/* TODO: Load users from API */}
                        <SelectItem value="user1">John Doe</SelectItem>
                        <SelectItem value="user2">Jane Smith</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Date Ranges */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Date Ranges</h4>
            
            <div className="space-y-4">
              {/* Created Date */}
              <div className="space-y-2">
                <Label>Created Date</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Popover open={createdAfterOpen} onOpenChange={setCreatedAfterOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.createdAfter && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.createdAfter ? format(filters.createdAfter, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.createdAfter}
                          onSelect={(date) => {
                            updateFilter('createdAfter', date);
                            setCreatedAfterOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Popover open={createdBeforeOpen} onOpenChange={setCreatedBeforeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.createdBefore && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.createdBefore ? format(filters.createdBefore, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.createdBefore}
                          onSelect={(date) => {
                            updateFilter('createdBefore', date);
                            setCreatedBeforeOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Updated Date */}
              <div className="space-y-2">
                <Label>Updated Date</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Popover open={updatedAfterOpen} onOpenChange={setUpdatedAfterOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.updatedAfter && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.updatedAfter ? format(filters.updatedAfter, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.updatedAfter}
                          onSelect={(date) => {
                            updateFilter('updatedAfter', date);
                            setUpdatedAfterOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Popover open={updatedBeforeOpen} onOpenChange={setUpdatedBeforeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.updatedBefore && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.updatedBefore ? format(filters.updatedBefore, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.updatedBefore}
                          onSelect={(date) => {
                            updateFilter('updatedBefore', date);
                            setUpdatedBeforeOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Resolved Date */}
              <div className="space-y-2">
                <Label>Resolved Date</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Popover open={resolvedAfterOpen} onOpenChange={setResolvedAfterOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.resolvedAfter && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.resolvedAfter ? format(filters.resolvedAfter, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.resolvedAfter}
                          onSelect={(date) => {
                            updateFilter('resolvedAfter', date);
                            setResolvedAfterOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Popover open={resolvedBeforeOpen} onOpenChange={setResolvedBeforeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.resolvedBefore && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.resolvedBefore ? format(filters.resolvedBefore, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.resolvedBefore}
                          onSelect={(date) => {
                            updateFilter('resolvedBefore', date);
                            setResolvedBeforeOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
            Clear All
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleSearch} className="flex-1 sm:flex-none">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}