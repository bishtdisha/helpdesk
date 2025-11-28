'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
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

interface DynamicDropdownSelectProps<T> {
  endpoint: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  formatLabel: (item: T) => string;
  formatValue: (item: T) => string;
  formatSecondaryLabel?: (item: T) => string | null;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  responseKey?: string; // Key to extract items from response (e.g., 'teams', 'users', 'customers')
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

export function DynamicDropdownSelect<T extends Record<string, any>>({
  endpoint,
  value,
  onValueChange,
  placeholder = 'Select an option...',
  disabled = false,
  formatLabel,
  formatValue,
  formatSecondaryLabel,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  className,
  responseKey,
  'aria-required': ariaRequired,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: DynamicDropdownSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [loadingAnnouncement, setLoadingAnnouncement] = useState<string>('');

  // Fetch items based on search query
  const fetchItems = useCallback(
    async (search: string = '') => {
      setIsLoading(true);
      setError(null);
      setLoadingAnnouncement('Loading options...');
      
      try {
        const params: Record<string, any> = {};
        
        // Add search parameter if provided
        if (search) {
          params.search = search;
        }
        
        // Add pagination for large datasets - increased to show all records
        params.limit = 200;
        
        console.log(`[DynamicDropdownSelect] Fetching from ${endpoint} with params:`, params);
        
        const response = await apiClient.get<any>(endpoint, params);
        
        console.log(`[DynamicDropdownSelect] Response from ${endpoint}:`, response);
        
        // Extract items from response using responseKey or assume direct array
        let fetchedItems: T[];
        if (responseKey && response[responseKey]) {
          fetchedItems = response[responseKey];
        } else if (Array.isArray(response)) {
          fetchedItems = response;
        } else {
          // Try to find an array in the response
          const arrayKey = Object.keys(response).find(key => Array.isArray(response[key]));
          fetchedItems = arrayKey ? response[arrayKey] : [];
        }
        
        console.log(`[DynamicDropdownSelect] Extracted ${fetchedItems.length} items from ${endpoint}`);
        console.log(`[DynamicDropdownSelect] First item:`, fetchedItems[0]);
        
        setItems(fetchedItems);
        setLoadingAnnouncement(`${fetchedItems.length} options loaded`);
      } catch (err) {
        console.error(`Error fetching items from ${endpoint}:`, err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to load options';
        setError(errorMsg);
        setItems([]);
        setLoadingAnnouncement(`Error: ${errorMsg}`);
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint, responseKey]
  );

  // Fetch initial items on mount
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Update selected item when value changes
  useEffect(() => {
    if (value && items.length > 0) {
      const item = items.find((i) => formatValue(i) === value);
      if (item) {
        setSelectedItem(item);
      }
    } else if (!value) {
      setSelectedItem(null);
    }
  }, [value, items, formatValue]);

  // Handle search input change
  const handleSearch = (search: string) => {
    setSearchQuery(search);
    // Fetch with search query if length is sufficient or empty
    if (search.length >= 2 || search.length === 0) {
      fetchItems(search);
    }
  };

  // Handle item selection
  const handleSelect = (itemValue: string) => {
    console.log('[DynamicDropdownSelect] Item selected:', itemValue);
    const item = items.find((i) => formatValue(i) === itemValue);
    console.log('[DynamicDropdownSelect] Found item:', item);
    if (item) {
      setSelectedItem(item);
      onValueChange(itemValue);
      setOpen(false);
      setSearchQuery(''); // Clear search on selection
    }
  };

  return (
    <>
      {/* Screen reader announcement for loading state */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {loadingAnnouncement}
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-required={ariaRequired}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          className={cn('w-full justify-between', className)}
          disabled={disabled || isLoading}
        >
          {isLoading && !selectedItem ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground">Loading...</span>
            </div>
          ) : selectedItem ? (
            <div className="flex items-center gap-2 truncate">
              <span className="truncate">{formatLabel(selectedItem)}</span>
              {formatSecondaryLabel && formatSecondaryLabel(selectedItem) && (
                <span className="text-muted-foreground text-sm truncate">
                  {formatSecondaryLabel(selectedItem)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start" side="bottom">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={handleSearch}
          />
          <CommandList className="max-h-[300px] overflow-auto">
            <CommandEmpty>
              {isLoading ? (
                <div className="py-6 text-center text-sm">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  <span>Loading...</span>
                </div>
              ) : error ? (
                <div className="py-6 text-center text-sm text-destructive">
                  {error}
                </div>
              ) : (
                <div className="py-6 text-center text-sm">
                  {searchQuery ? emptyMessage : 'Start typing to search...'}
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {isLoading ? (
                <div className="py-6 text-center text-sm">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  <span>Loading...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No items available
                </div>
              ) : (
                items.map((item, index) => {
                  const itemValue = formatValue(item);
                  const itemLabel = formatLabel(item);
                  const secondaryLabel = formatSecondaryLabel?.(item);
                  
                  if (index === 0) {
                    console.log('[DynamicDropdownSelect] Rendering first item:', {
                      item,
                      itemValue,
                      itemLabel,
                      secondaryLabel
                    });
                  }
                  
                  return (
                    <CommandItem
                      key={itemValue}
                      value={itemLabel}
                      keywords={[itemLabel, secondaryLabel || '', itemValue]}
                      onSelect={() => handleSelect(itemValue)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === itemValue ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{itemLabel}</span>
                          {secondaryLabel && (
                            <span className="text-xs text-muted-foreground truncate">
                              {secondaryLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    </>
  );
}
