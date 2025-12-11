'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CleanKPICardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  trend?: {
    value: string;
    isPositive: boolean;
    icon: React.ReactNode;
  };
  popoverContent?: React.ReactNode;
  className?: string;
  iconBgColor?: string;
  valueColor?: string;
  hoverTrigger?: boolean;
}

export function CleanKPICard({
  title,
  value,
  icon,
  badge,
  trend,
  popoverContent,
  className,
  iconBgColor = 'bg-blue-100 dark:bg-blue-900/30',
  valueColor = 'text-blue-600',
  hoverTrigger = false,
}: CleanKPICardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    if (hoverTrigger) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTrigger) {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 100);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const cardContent = (
    <Card 
      className={cn(
        'hover:shadow-lg transition-all duration-300 cursor-pointer relative group',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => !hoverTrigger && setIsOpen(!isOpen)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {title}
          {popoverContent && (
            <ChevronDown className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </CardTitle>
        {icon && (
          <div className={cn('p-2 rounded-lg transition-transform duration-300 group-hover:scale-110', iconBgColor)}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className={cn('text-3xl font-bold', valueColor)}>
          {value}
        </div>
        <div className="flex items-center gap-2 flex-wrap min-h-[20px]">
          {badge && (
            <Badge variant={badge.variant || 'outline'} className="text-xs">
              {badge.text}
            </Badge>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-xs',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {trend.icon}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        {popoverContent && (
          <p className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity min-h-[16px]">
            {hoverTrigger ? 'Hover' : 'Click'} to see detailed breakdown
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (!popoverContent) {
    return cardContent;
  }

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <PopoverTrigger asChild>
          <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {cardContent}
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-4 z-[100] shadow-2xl border-2 bg-background/95 backdrop-blur-sm" 
          side="bottom" 
          align="center"
          sideOffset={10}
          collisionPadding={20}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {popoverContent}
        </PopoverContent>
      </Popover>
    </div>
  );
}
