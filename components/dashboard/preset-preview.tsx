'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardPreset, DashboardWidget } from '@/lib/types/dashboard';

interface PresetPreviewProps {
  preset: DashboardPreset;
  availableWidgets: DashboardWidget[];
  className?: string;
}

export function PresetPreview({ preset, availableWidgets, className }: PresetPreviewProps) {
  // Create a miniature grid representation
  const gridCols = 12;
  const gridRows = Math.max(...preset.layout.map(item => item.y + item.h));
  
  // Create grid cells
  const gridCells = Array.from({ length: gridRows }, (_, row) =>
    Array.from({ length: gridCols }, (_, col) => {
      const item = preset.layout.find(
        layout => 
          col >= layout.x && 
          col < layout.x + layout.w && 
          row >= layout.y && 
          row < layout.y + layout.h
      );
      
      if (item) {
        const widget = availableWidgets.find(w => w.id === item.i);
        return {
          widgetId: item.i,
          widgetTitle: widget?.title || item.i,
          category: widget?.category || 'unknown',
          isStart: col === item.x && row === item.y,
        };
      }
      
      return null;
    })
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'metrics':
        return 'bg-blue-100 border-blue-200';
      case 'charts':
        return 'bg-green-100 border-green-200';
      case 'activity':
        return 'bg-purple-100 border-purple-200';
      case 'system':
        return 'bg-orange-100 border-orange-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{preset.name}</h4>
            <Badge variant="outline" className="text-xs">
              {preset.visibleWidgets.length} widgets
            </Badge>
          </div>
          
          {/* Miniature grid preview */}
          <div 
            className="grid gap-1 border rounded-md p-2 bg-muted/20"
            style={{ 
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              aspectRatio: '3/2'
            }}
          >
            {gridCells.flat().map((cell, index) => {
              const row = Math.floor(index / gridCols);
              const col = index % gridCols;
              
              if (!cell) {
                return (
                  <div 
                    key={`${row}-${col}`} 
                    className="aspect-square bg-background border border-border/20 rounded-sm"
                  />
                );
              }
              
              return (
                <div
                  key={`${row}-${col}`}
                  className={`aspect-square rounded-sm border ${getCategoryColor(cell.category)} ${
                    cell.isStart ? 'relative' : ''
                  }`}
                  title={cell.widgetTitle}
                >
                  {cell.isStart && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1 h-1 bg-current rounded-full opacity-60" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Widget list */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Included widgets:</p>
            <div className="flex flex-wrap gap-1">
              {preset.visibleWidgets.slice(0, 6).map((widgetId) => {
                const widget = availableWidgets.find(w => w.id === widgetId);
                if (!widget) return null;
                
                return (
                  <Badge 
                    key={widgetId} 
                    variant="secondary" 
                    className="text-xs px-2 py-0.5"
                  >
                    {widget.title}
                  </Badge>
                );
              })}
              {preset.visibleWidgets.length > 6 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{preset.visibleWidgets.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}