'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, User, Building, Mail, X, Check } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
}

interface CustomerSearchInputProps {
  value?: string;
  onSelect: (customer: Customer | null) => void;
  placeholder?: string;
  className?: string;
}

export function CustomerSearchInput({
  value,
  onSelect,
  placeholder = "Search customers...",
  className,
}: CustomerSearchInputProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search function
  const searchCustomers = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setCustomers([]);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');

    try {
      const response = await apiClient.get<{
        customers: Customer[];
        total: number;
      }>('/customers', {
        search: query.trim(),
        limit: 10,
      });

      setCustomers(response.customers || []);
    } catch (err) {
      console.error('Error searching customers:', err);
      setIsError(true);
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to search customers'
      );
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCustomers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchCustomers]);

  // Handle customer selection
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchQuery('');
    setOpen(false);
    onSelect(customer);
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedCustomer(null);
    setSearchQuery('');
    onSelect(null);
    inputRef.current?.focus();
  };

  // Initialize with value if provided
  useEffect(() => {
    if (value && !selectedCustomer) {
      // If we have a value but no selected customer, try to find it
      searchCustomers(value);
    }
  }, [value, selectedCustomer, searchCustomers]);

  return (
    <div className={cn("relative", className)}>
      {selectedCustomer ? (
        // Selected customer display
        <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedCustomer.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{selectedCustomer.email}</span>
                {selectedCustomer.company && (
                  <>
                    <Building className="h-3 w-3 ml-1" />
                    <span className="truncate">{selectedCustomer.company}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        // Search input
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setOpen(true)}
                className="pl-9"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandList>
                {/* Loading State */}
                {isLoading && (
                  <div className="p-2 space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Error State */}
                {isError && (
                  <div className="p-2">
                    <Alert variant="destructive">
                      <AlertDescription className="text-sm">
                        {errorMessage}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Empty State - No Search */}
                {!isLoading && !isError && searchQuery.length === 0 && (
                  <div className="p-4 text-center">
                    <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Start typing to search for customers
                    </p>
                  </div>
                )}

                {/* Empty State - No Results */}
                {!isLoading && !isError && searchQuery.length >= 2 && customers.length === 0 && (
                  <CommandEmpty>
                    <div className="p-4 text-center">
                      <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No customers found matching "{searchQuery}"
                      </p>
                    </div>
                  </CommandEmpty>
                )}

                {/* Customer Results */}
                {!isLoading && !isError && customers.length > 0 && (
                  <CommandGroup>
                    {customers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.id}
                        onSelect={() => handleSelectCustomer(customer)}
                        className="flex items-center gap-3 p-3 cursor-pointer"
                      >
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {customer.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{customer.email}</span>
                            {customer.company && (
                              <>
                                <Building className="h-3 w-3 ml-1" />
                                <span className="truncate">{customer.company}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Check className="h-4 w-4 opacity-0 group-data-[selected]:opacity-100" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Info Message */}
                {searchQuery.length > 0 && searchQuery.length < 2 && (
                  <div className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Type at least 2 characters to search
                    </p>
                  </div>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}