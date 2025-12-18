'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Check } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

export type DateRangeOption = 'today' | '7days' | '15days' | '30days' | 'custom';

export interface DateRangeValue {
  range: DateRangeOption;
  customRange?: DateRange;
  label: string;
}

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  showToday?: boolean;
  className?: string;
}

const presetOptions: { value: DateRangeOption; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '15days', label: 'Last 15 Days' },
  { value: '30days', label: 'Last 30 Days' },
];

export function DateRangeFilter({
  value,
  onChange,
  showToday = true,
  className,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempCustomRange, setTempCustomRange] = useState<DateRange | undefined>(value.customRange);

  const handlePresetSelect = (option: DateRangeOption) => {
    onChange({
      range: option,
      label: presetOptions.find(o => o.value === option)?.label || option,
    });
    setIsOpen(false);
    setShowCalendar(false);
  };

  const handleCustomClick = () => {
    setShowCalendar(true);
  };

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    setTempCustomRange(range);
    if (range?.from && range?.to) {
      const fromStr = format(range.from, 'MMM d');
      const toStr = format(range.to, 'MMM d');
      const label = range.from.getTime() === range.to.getTime() 
        ? fromStr 
        : `${fromStr} - ${toStr}`;
      
      onChange({
        range: 'custom',
        customRange: range,
        label,
      });
      setIsOpen(false);
      setShowCalendar(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setShowCalendar(false);
    }
  };

  const filteredOptions = showToday 
    ? presetOptions 
    : presetOptions.filter(o => o.value !== 'today');

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1.5 text-xs h-8", className)}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>{value.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="end" 
        sideOffset={8}
      >
        {!showCalendar ? (
          <div className="p-1 min-w-[160px]">
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePresetSelect(option.value)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {option.label}
                {value.range === option.value && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
            <div className="h-px bg-border my-1" />
            <button
              onClick={handleCustomClick}
              className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Custom Range
              {value.range === 'custom' && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          </div>
        ) : (
          <div>
            <div className="px-3 py-2 border-b">
              <button 
                onClick={() => setShowCalendar(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ← Back to presets
              </button>
            </div>
            <Calendar
              mode="range"
              selected={tempCustomRange}
              onSelect={handleCustomDateSelect}
              numberOfMonths={1}
              disabled={{ after: new Date() }}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Hook for easy state management
export function useDateRangeFilter(initialRange: DateRangeOption = '30days') {
  const [value, setValue] = useState<DateRangeValue>({
    range: initialRange,
    label: presetOptions.find(o => o.value === initialRange)?.label || initialRange,
  });

  // Helper to get API params
  const getApiParams = () => {
    const params = new URLSearchParams();
    params.append('range', value.range);
    
    if (value.range === 'custom' && value.customRange?.from) {
      params.append('from', format(value.customRange.from, 'yyyy-MM-dd'));
      if (value.customRange.to) {
        params.append('to', format(value.customRange.to, 'yyyy-MM-dd'));
      } else {
        params.append('to', format(value.customRange.from, 'yyyy-MM-dd'));
      }
    }
    
    return params.toString();
  };

  return {
    value,
    setValue,
    getApiParams,
  };
}
