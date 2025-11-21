'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutGrid, 
  Eye, 
  EyeOff, 
  Palette, 
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  PieChart,
  Activity,
  Server,
  ExternalLink
} from 'lucide-react';
import { DashboardWidget, DashboardPreset } from '@/lib/types/dashboard';
import { getPresetsForRole } from '@/lib/dashboard-config';
import { PresetPreview } from './preset-preview';

interface DashboardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableWidgets: DashboardWidget[];
  visibleWidgets: string[];
  onToggleWidget: (widgetId: string) => void;
  onApplyPreset: (preset: DashboardPreset) => void;
  onReset?: () => void;
  currentPreset?: string;
  userRole?: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'metrics':
      return BarChart3;
    case 'charts':
      return PieChart;
    case 'activity':
      return Activity;
    case 'system':
      return Server;
    default:
      return LayoutGrid;
  }
};

const getWidgetIcon = (widgetId: string) => {
  switch (widgetId) {
    case 'open-tickets':
      return AlertCircle;
    case 'resolved-today':
      return CheckCircle;
    case 'avg-response-time':
      return Clock;
    case 'active-customers':
      return Users;
    default:
      return LayoutGrid;
  }
};

export function DashboardSettingsDialog({
  open,
  onOpenChange,
  availableWidgets,
  visibleWidgets,
  onToggleWidget,
  onApplyPreset,
  onReset,
  currentPreset,
  userRole,
}: DashboardSettingsDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Group widgets by category
  const widgetsByCategory = availableWidgets.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = [];
    }
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, DashboardWidget[]>);

  // Get available presets for user role
  const availablePresets = userRole ? getPresetsForRole(userRole) : [];

  const handleApplyPreset = (preset: DashboardPreset) => {
    onApplyPreset(preset);
    setSelectedPreset(null);
    onOpenChange(false);
  };

  const handlePresetPreview = (presetId: string) => {
    setSelectedPreset(selectedPreset === presetId ? null : presetId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Customize Dashboard
          </DialogTitle>
          <DialogDescription>
            Personalize your dashboard by showing/hiding widgets and applying preset layouts.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="widgets" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="widgets" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Widget Visibility
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Layout Presets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="widgets" className="mt-4 overflow-y-auto max-h-[60vh]">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Widget Visibility</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose which widgets to display on your dashboard
                  </p>
                </div>
                <Badge variant="outline">
                  {visibleWidgets.length} of {availableWidgets.length} visible
                </Badge>
              </div>

              {Object.entries(widgetsByCategory).map(([category, widgets]) => {
                const CategoryIcon = getCategoryIcon(category);
                const visibleInCategory = widgets.filter(w => visibleWidgets.includes(w.id)).length;

                return (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CategoryIcon className="h-4 w-4" />
                        {category.charAt(0).toUpperCase() + category.slice(1)} Widgets
                        <Badge variant="secondary" className="ml-auto">
                          {visibleInCategory}/{widgets.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {widgets.map((widget) => {
                        const isVisible = visibleWidgets.includes(widget.id);
                        const WidgetIcon = getWidgetIcon(widget.id);

                        return (
                          <div
                            key={widget.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-primary/10 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <WidgetIcon className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <Label
                                  htmlFor={`widget-${widget.id}`}
                                  className="font-medium cursor-pointer"
                                >
                                  {widget.title}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {widget.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isVisible ? (
                                <Eye className="h-4 w-4 text-green-500" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                              <Switch
                                id={`widget-${widget.id}`}
                                checked={isVisible}
                                onCheckedChange={() => onToggleWidget(widget.id)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="presets" className="mt-4 overflow-y-auto max-h-[60vh]">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Layout Presets</h3>
                <p className="text-sm text-muted-foreground">
                  Apply pre-configured dashboard layouts optimized for different use cases
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {availablePresets.map((preset) => {
                  const isCurrentPreset = currentPreset === preset.id;
                  const isSelected = selectedPreset === preset.id;

                  return (
                    <Card 
                      key={preset.id} 
                      className={`cursor-pointer transition-all ${
                        isCurrentPreset 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : isSelected 
                            ? 'ring-2 ring-primary/50 bg-primary/2' 
                            : 'hover:bg-primary/10'
                      }`}
                      onClick={() => handlePresetPreview(preset.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <LayoutGrid className="h-4 w-4" />
                            {preset.name}
                            {isCurrentPreset && (
                              <Badge variant="default" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {preset.visibleWidgets.length} widgets
                            </Badge>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                        <CardDescription className="text-sm">{preset.description}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="mb-4">
                          <PresetPreview 
                            preset={preset} 
                            availableWidgets={availableWidgets}
                          />
                        </div>
                        
                        {isSelected && (
                          <>
                            <Separator className="mb-3" />
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium">All Widgets:</h4>
                              <div className="flex flex-wrap gap-2">
                                {preset.visibleWidgets.map((widgetId) => {
                                  const widget = availableWidgets.find(w => w.id === widgetId);
                                  if (!widget) return null;
                                  
                                  return (
                                    <Badge key={widgetId} variant="secondary" className="text-xs">
                                      {widget.title}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                          
                        <div className="flex gap-2 pt-3">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyPreset(preset);
                            }}
                            disabled={isCurrentPreset}
                            className="flex-1"
                          >
                            {isCurrentPreset ? 'Currently Applied' : 'Apply Layout'}
                          </Button>
                          {isSelected && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPreset(null);
                              }}
                            >
                              Close
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {availablePresets.length === 0 && (
                <div className="text-center py-8">
                  <LayoutGrid className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No presets available for your role</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RotateCcw className="h-4 w-4" />
            Changes are saved automatically
          </div>
          <div className="flex items-center gap-2">
            {onReset && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  onReset();
                  onOpenChange(false);
                }}
                className="text-destructive hover:text-destructive"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All
              </Button>
            )}
            <Button onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}