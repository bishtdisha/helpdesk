"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateRangePickerProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  onDateRangeChange: (range: { startDate: Date; endDate: Date }) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: dateRange.startDate,
    to: dateRange.endDate,
  });

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    if (newDate?.from && newDate?.to) {
      onDateRangeChange({
        startDate: newDate.from,
        endDate: newDate.to,
      });
    }
  };

  const handlePresetChange = (preset: string) => {
    let endDate = new Date();
    let startDate = new Date();

    switch (preset) {
      case "today":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "yesterday":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "last7days":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "last30days":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "last90days":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "thisMonth":
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case "lastMonth":
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
        endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
        break;
      case "thisYear":
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    const newRange = { from: startDate, to: endDate };
    setDate(newRange);
    onDateRangeChange({
      startDate,
      endDate,
    });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select onValueChange={handlePresetChange} defaultValue="last30days">
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="last7days">Last 7 days</SelectItem>
          <SelectItem value="last30days">Last 30 days</SelectItem>
          <SelectItem value="last90days">Last 90 days</SelectItem>
          <SelectItem value="thisMonth">This month</SelectItem>
          <SelectItem value="lastMonth">Last month</SelectItem>
          <SelectItem value="thisYear">This year</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
