'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Bind portal root
  useEffect(() => {
    const container = document.getElementById('portal-root');
    setPortalContainer(container);
  }, []);

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const data = await response.json();
        setItems(data[responseKey] || []);
      } catch (error) {
        console.error('SimpleSelect fetch error →', error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    if (endpoint) fetchItems();
  }, [endpoint, responseKey]);

  // Position calculation (wrapped to avoid re-creating func)
  const calculatePosition = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  // Recalculate when dropdown opens
  useEffect(() => {
    if (!open) return;
    calculatePosition();
    // Recalculate on scroll + resize
    window.addEventListener('scroll', calculatePosition, true);
    window.addEventListener('resize', calculatePosition);
    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [open, calculatePosition]);

  const selectedItem = items.find((item) => item[valueKey] === value);
  const selectedLabel = selectedItem ? selectedItem[labelKey] : '';

  const filteredItems = items.filter((item) =>
    item[labelKey]?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="w-full">
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        disabled={disabled || isLoading}
        onClick={() => {
          setOpen(!open);
          if (!open) setSearchQuery('');
        }}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </span>
        ) : selectedLabel ? (
          <span>{selectedLabel}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {/* DROPDOWN PORTAL */}
      {open && portalContainer &&
        createPortal(
          <div
            className="bg-white border shadow-lg rounded-md z-[99999]"
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              maxHeight: '300px',
            }}
          >
            {/* Search input */}
            <div className="border-b p-2">
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Items */}
            <div className="max-h-[260px] overflow-y-auto p-1">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const itemLabel = item[labelKey];
                  const itemValue = item[valueKey];
                  const isSelected = value === itemValue;

                  return (
                    <div
                      key={itemValue}
                      onClick={() => {
                        onValueChange(itemValue);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex items-center px-3 py-2 rounded cursor-pointer text-sm',
                        isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'
                      )}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span>{itemLabel}</span>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No results found
                </div>
              )}
            </div>
          </div>,
          portalContainer
        )}
    </div>
  );
}
