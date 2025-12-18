'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, Check, ChevronDown, X, Calendar, RotateCcw } from 'lucide-react';
import { TicketStatus, TicketPriority } from '@prisma/client';
import { cn } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Searchable Select Component - Custom implementation with React Portal
interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  options: { value: string; label: string }[];
}

function SearchableSelect({
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  options,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = searchQuery
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Reset highlighted index when search query changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update position when opening and on scroll
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 220),
      });
    }
  }, []);

  useEffect(() => {
    if (open) {
      updatePosition();
      // Update position on scroll
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [open, updatePosition]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setOpen(false);
          setSearchQuery('');
          break;
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredOptions.length > 0) {
            onValueChange(filteredOptions[highlightedIndex].value);
            setOpen(false);
            setSearchQuery('');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredOptions, highlightedIndex, onValueChange]);

  const dropdown = open && mounted ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 9999,
      }}
      className="bg-popover text-popover-foreground border rounded-md shadow-md overflow-hidden animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
    >
      {/* Search Input */}
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {/* Options List */}
      <div className="max-h-[200px] overflow-y-auto p-1">
        {filteredOptions.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          filteredOptions.map((option, index) => (
            <button
              key={option.value}
              onClick={() => {
                onValueChange(option.value);
                setOpen(false);
                setSearchQuery('');
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                'relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none select-none transition-colors',
                'hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary',
                // Highlight first option when searching, or selected option
                (searchQuery && index === highlightedIndex) && 'bg-primary/10 text-primary',
                (!searchQuery && value === option.value) && 'bg-primary/10 text-primary'
              )}
            >
              <span className="flex-1 text-left">{option.label}</span>
              {value === option.value && (
                <span className="absolute right-2 flex size-3.5 items-center justify-center">
                  <Check className="size-4" />
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          // Base styles matching SelectTrigger exactly
          'flex h-11 w-full md:w-[180px] items-center justify-between gap-2 rounded-xl border-[3px] border-input bg-transparent px-4 py-3 text-[15px] font-medium whitespace-nowrap shadow-md',
          // Text colors - darker text
          'text-foreground',
          // Transition
          'transition-all duration-200',
          // Hover state
          'hover:border-ring/50 hover:shadow-lg hover:shadow-black/10 dark:hover:bg-input/50',
          // Focus state
          'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/25 focus-visible:shadow-xl focus-visible:shadow-black/15',
          // Disabled state
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
          // Dark mode
          'dark:bg-input/30',
          // Placeholder color when no selection
          (!selectedOption || selectedOption.value === 'all') && 'text-muted-foreground'
        )}
      >
        <span className="truncate line-clamp-1">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className="size-4 text-muted-foreground shrink-0" />
      </button>
      {dropdown}
    </>
  );
}

export function TicketFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const permissions = usePermissions();

  // Get initial values from URL
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [priority, setPriority] = useState(searchParams.get('priority') || 'all');
  const [team, setTeam] = useState(searchParams.get('teamId') || 'all');
  const [assignee, setAssignee] = useState(searchParams.get('assignedTo') || 'all');
  const [month, setMonth] = useState(searchParams.get('month') || 'all');

  // Generate month options for the last 12 months + current month
  const getMonthOptions = () => {
    const options = [{ value: 'all', label: 'All Months' }];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    
    return options;
  };

  const monthOptions = getMonthOptions();

  // Dynamic data for dropdowns
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Check permissions once
  const canViewTeamFilters = permissions.canViewAllTickets() || permissions.canViewTeamTickets();

  // Fetch teams and users on mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams?simple=true');
        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams || []);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users?simple=true');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (canViewTeamFilters) {
      fetchTeams();
      fetchUsers();
    }
  }, [canViewTeamFilters]);

  // Debounce search term
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Update URL when filters change
  const updateURL = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update or remove parameters
      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Reset to page 1 when filters change
      params.set('page', '1');

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Update URL when debounced search changes
  useEffect(() => {
    updateURL({ search: debouncedSearch });
  }, [debouncedSearch, updateURL]);

  const handleStatusChange = (value: string) => {
    setStatus(value);
    updateURL({ status: value });
  };

  const handlePriorityChange = (value: string) => {
    setPriority(value);
    updateURL({ priority: value });
  };

  const handleTeamChange = (value: string) => {
    setTeam(value);
    updateURL({ teamId: value });
  };

  const handleAssigneeChange = (value: string) => {
    setAssignee(value);
    updateURL({ assignedTo: value });
  };

  const handleMonthChange = (value: string) => {
    setMonth(value);
    updateURL({ month: value });
  };

  // Check if any filters are active
  const hasActiveFilters = 
    searchTerm !== '' ||
    status !== 'all' ||
    priority !== 'all' ||
    month !== 'all' ||
    team !== 'all' ||
    assignee !== 'all';

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatus('all');
    setPriority('all');
    setMonth('all');
    setTeam('all');
    setAssignee('all');
    router.push(pathname);
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded">
                <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-base font-semibold">Filters & Search</span>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
          
          {/* Search and Filters in Single Row */}
          <div className="flex gap-3 flex-col md:flex-row">
            {/* Search Input - Takes remaining space */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets by title, ID, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            {/* Status Filter */}
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-10 w-full md:w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={TicketStatus.OPEN}>Open</SelectItem>
                <SelectItem value={TicketStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={TicketStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={TicketStatus.RESOLVED}>Resolved</SelectItem>
                <SelectItem value={TicketStatus.CLOSED}>Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="h-10 w-full md:w-[160px]">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value={TicketPriority.LOW}>Low</SelectItem>
                <SelectItem value={TicketPriority.MEDIUM}>Medium</SelectItem>
                <SelectItem value={TicketPriority.HIGH}>High</SelectItem>
                <SelectItem value={TicketPriority.URGENT}>Urgent</SelectItem>
              </SelectContent>
            </Select>

            {/* Month Filter */}
            <SearchableSelect
              value={month}
              onValueChange={handleMonthChange}
              placeholder="All Months"
              searchPlaceholder="Search months..."
              emptyText="No month found."
              options={monthOptions}
            />

            {/* Team Filter - Only for Admin_Manager and Team_Leader */}
            {canViewTeamFilters && (
              <SearchableSelect
                value={team}
                onValueChange={handleTeamChange}
                placeholder="All Teams"
                searchPlaceholder="Search teams..."
                emptyText="No team found."
                options={[
                  { value: 'all', label: 'All Teams' },
                  ...teams.map((t) => ({ value: t.id, label: t.name })),
                ]}
              />
            )}

            {/* Assignee Filter - Only for Admin_Manager and Team_Leader */}
            {canViewTeamFilters && (
              <SearchableSelect
                value={assignee}
                onValueChange={handleAssigneeChange}
                placeholder="All Assignees"
                searchPlaceholder="Search assignees..."
                emptyText="No assignee found."
                options={[
                  { value: 'all', label: 'All Assignees' },
                  { value: 'unassigned', label: 'Unassigned' },
                  ...users.map((u) => ({ value: u.id, label: u.name })),
                ]}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
