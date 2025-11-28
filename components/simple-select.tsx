'use client';

import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SimpleSelectProps {
  endpoint: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  responseKey: string;
  labelKey: string;
  valueKey: string;
  searchPlaceholder?: string;
}

export function SimpleSelect({
  endpoint,
  value,
  onValueChange,
  placeholder = 'Select...',
  disabled = false,
  responseKey,
  labelKey,
  valueKey,
  searchPlaceholder = 'Search...',
}: SimpleSelectProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      console.log(`[SimpleSelect] 🔄 START Fetching from: ${endpoint}`);
      console.log(`[SimpleSelect] 📝 Response key to extract: ${responseKey}`);
      
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        console.log(`[SimpleSelect] 📡 Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[SimpleSelect] ❌ HTTP Error Response:`, errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`[SimpleSelect] 📦 Full API Response:`, data);
        console.log(`[SimpleSelect] 📊 Response structure:`, {
          hasResponseKey: responseKey in data,
          responseKey: responseKey,
          dataKeys: Object.keys(data),
          total: data.total,
          page: data.page,
          limit: data.limit
        });
        
        const fetchedItems = data[responseKey] || [];
        console.log(`[SimpleSelect] ✅ Extracted ${fetchedItems.length} items from '${responseKey}' key`);
        
        if (fetchedItems.length > 0) {
          console.log(`[SimpleSelect] 📋 First 3 items:`, fetchedItems.slice(0, 3));
          console.log(`[SimpleSelect] 🔍 Item structure (first item):`, fetchedItems[0]);
        } else {
          console.warn(`[SimpleSelect] ⚠️ No items found in response!`);
        }
        
        setItems(fetchedItems);
      } catch (error) {
        console.error(`[SimpleSelect] ❌ FETCH ERROR:`, error);
        console.error(`[SimpleSelect] ❌ Error details:`, {
          message: error instanceof Error ? error.message : 'Unknown error',
          endpoint: endpoint
        });
        setItems([]);
      } finally {
        setIsLoading(false);
        console.log(`[SimpleSelect] ⏹️ Fetch complete`);
      }
    };

    if (endpoint) {
      fetchItems();
    } else {
      console.error(`[SimpleSelect] ❌ No endpoint provided!`);
    }
  }, [endpoint, responseKey]);

  // Get selected item
  const selectedItem = items.find((item) => item[valueKey] === value);
  const selectedLabel = selectedItem ? selectedItem[labelKey] : '';

  // Filter items based on search
  const filteredItems = items.filter((item) =>
    item[labelKey]?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Log when dropdown opens
  useEffect(() => {
    if (open) {
      console.log(`[SimpleSelect] 🔽 Dropdown opened`);
      console.log(`[SimpleSelect] 📊 Current state:`, {
        totalItems: items.length,
        filteredItems: filteredItems.length,
        searchQuery: searchQuery,
        selectedValue: value,
        selectedLabel: selectedLabel,
        items: items
      });
      
      if (items.length === 0) {
        console.warn(`[SimpleSelect] ⚠️ WARNING: No items in state! Check if fetch completed.`);
      }
    }
  }, [open]);

  return (
    <Popover 
      open={open} 
      onOpenChange={(open) => {
        setOpen(open);
        if (open) setSearchQuery(""); // FIX: always reset search
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : selectedLabel ? (
            <span>{selectedLabel}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[400px] p-0 bg-white border shadow-lg" 
        align="start" 
        sideOffset={4}
        style={{ zIndex: 50 }}
      >
        <div className="flex flex-col bg-white">
          {/* Search Input */}
          <div className="border-b p-2">
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Items List */}
          <div className="max-h-[300px] overflow-y-auto p-2 bg-white">
            {isLoading ? (
              <div className="py-6 text-center text-sm">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                <span>Loading...</span>
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="space-y-1">
                {filteredItems.map((item, index) => {
                  const itemLabel = item[labelKey];
                  const itemValue = item[valueKey];
                  const isSelected = value === itemValue;
                  
                  if (index === 0) {
                    console.log(`[SimpleSelect] 🎨 Rendering first item:`, {
                      item,
                      label: itemLabel,
                      value: itemValue
                    });
                  }
                  
                  return (
                    <div
                      key={itemValue}
                      onClick={() => {
                        console.log(`[SimpleSelect] ✔️ Item selected:`, {
                          label: itemLabel,
                          value: itemValue
                        });
                        onValueChange(itemValue);
                        setOpen(false);
                        setSearchQuery('');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: isSelected ? '#f1f5f9' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 flex-shrink-0',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span style={{ flex: 1, color: '#000' }}>{itemLabel}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {searchQuery ? 'No results found' : 'No items available'}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
