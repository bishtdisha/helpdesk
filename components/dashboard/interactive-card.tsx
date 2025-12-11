'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InteractiveCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  expandedContent?: React.ReactNode;
  tooltip?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  hoverEffect?: 'lift' | 'glow' | 'scale' | 'none';
  expandable?: boolean;
  defaultExpanded?: boolean;
  gradient?: string;
}

export function InteractiveCard({
  title,
  description,
  icon,
  children,
  expandedContent,
  tooltip,
  className,
  headerClassName,
  contentClassName,
  hoverEffect = 'lift',
  expandable = false,
  defaultExpanded = false,
  gradient,
}: InteractiveCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isHovered, setIsHovered] = useState(false);

  const hoverEffects = {
    lift: 'hover:shadow-lg hover:-translate-y-1 transition-all duration-300',
    glow: 'hover:shadow-xl hover:shadow-primary/20 transition-all duration-300',
    scale: 'hover:scale-[1.02] transition-all duration-300',
    none: 'transition-shadow duration-200',
  };

  return (
    <Card
      className={cn(
        'h-full border border-border',
        hoverEffects[hoverEffect],
        gradient && `bg-gradient-to-br ${gradient}`,
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className={cn('flex flex-row items-center justify-between space-y-0 pb-3', headerClassName)}>
        <div className="flex items-center gap-3 flex-1">
          {icon && (
            <div className={cn(
              'p-2 rounded-lg transition-all duration-300',
              isHovered && 'scale-110'
            )}>
              {icon}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
              {tooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {description && (
              <CardDescription className="text-sm mt-1">{description}</CardDescription>
            )}
          </div>
        </div>
        {expandable && expandedContent && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
      </CardHeader>
      <CardContent className={cn('space-y-4', contentClassName)}>
        {children}
        {expandable && expandedContent && (
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-in-out',
              isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            <div className="pt-4 border-t border-border">
              {expandedContent}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
