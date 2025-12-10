'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Check, ChevronsUpDown, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { apiClient } from '@/lib/api-client';

interface Customer {
  id: string;
  name: string;
  email: string;
  company?: string | null;
}

interface CustomerSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function CustomerSelector({ value, onValueChange, disabled }: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Fetch customers based on search query
  const fetchCustomers = useCallback(async (search: string = '') => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ customers: Customer[] }>('/customers', {
        search,
        limit: 20,
      });
      setCustomers(response.customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch initial customers on mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Fetch customer details when value changes
  useEffect(() => {
    if (value && !selectedCustomer) {
      const customer = customers.find((c) => c.id === value);
      if (customer) {
        setSelectedCustomer(customer);
      } else {
        // Fetch customer details if not in list
        apiClient
          .get<{ customer: Customer }>(`/customers/${value}`)
          .then((response) => setSelectedCustomer(response.customer))
          .catch(() => setSelectedCustomer(null));
      }
    }
  }, [value, customers, selectedCustomer]);

  // Handle search input change
  const handleSearch = (search: string) => {
    setSearchQuery(search);
    if (search.length >= 2 || search.length === 0) {
      fetchCustomers(search);
    }
  };

  // Handle customer selection
  const handleSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      onValueChange(customerId);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCustomer ? (
            <div className="flex items-center gap-2 truncate">
              <User className="h-4 w-4 shrink-0" />
              <span className="truncate">{selectedCustomer.name}</span>
              {selectedCustomer.company && (
                <span className="text-muted-foreground text-sm truncate">
                  ({selectedCustomer.company})
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">Select customer...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search customers..."
            value={searchQuery}
            onValueChange={handleSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="py-6 text-center text-sm">Loading...</div>
              ) : (
                <div className="py-6 text-center text-sm">
                  {searchQuery ? 'No customers found.' : 'Start typing to search...'}
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={handleSelect}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === customer.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{customer.name}</span>
                      {customer.company && (
                        <span className="text-xs text-muted-foreground truncate">
                          {customer.company}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      {customer.email}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
