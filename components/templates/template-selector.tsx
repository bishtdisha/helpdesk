'use client';

import React, { useState } from 'react';
import { useTemplates, TicketTemplate } from '@/lib/hooks/use-templates';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Globe, User } from 'lucide-react';

interface TemplateSelectorProps {
  value?: string;
  onValueChange?: (templateId: string | undefined, template?: TicketTemplate) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TemplateSelector({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select a template (optional)",
}: TemplateSelectorProps) {
  const { templates, isLoading, error } = useTemplates();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Group templates by category
  const categorizedTemplates = React.useMemo(() => {
    const categories: Record<string, TicketTemplate[]> = {
      'No Category': [],
    };

    templates.forEach((template) => {
      const category = template.category || 'No Category';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(template);
    });

    return categories;
  }, [templates]);

  const handleValueChange = (templateId: string) => {
    if (templateId === 'none') {
      onValueChange?.(undefined, undefined);
      return;
    }

    const template = templates.find(t => t.id === templateId);
    onValueChange?.(templateId, template);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded-md">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 border rounded-md border-destructive/20 bg-destructive/5">
        <span className="text-sm text-destructive">Failed to load templates</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Select
        value={value || 'none'}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              No template
            </div>
          </SelectItem>
          
          {Object.entries(categorizedTemplates).map(([category, categoryTemplates]) => (
            <React.Fragment key={category}>
              {categoryTemplates.length > 0 && (
                <>
                  {/* Category header */}
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b">
                    {category}
                  </div>
                  
                  {/* Templates in category */}
                  {categoryTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          {template.isGlobal ? (
                            <Globe className="h-4 w-4 text-blue-500" />
                          ) : (
                            <User className="h-4 w-4 text-gray-500" />
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium">{template.name}</span>
                            {template.description && (
                              <span className="text-xs text-muted-foreground">
                                {template.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {template.isGlobal && (
                            <Badge variant="secondary" className="text-xs">
                              Global
                            </Badge>
                          )}
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              template.priority === 'URGENT' ? 'border-red-500 text-red-700' :
                              template.priority === 'HIGH' ? 'border-orange-500 text-orange-700' :
                              template.priority === 'MEDIUM' ? 'border-yellow-500 text-yellow-700' :
                              'border-green-500 text-green-700'
                            }`}
                          >
                            {template.priority}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
            </React.Fragment>
          ))}
          
          {templates.length === 0 && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No templates available
            </div>
          )}
        </SelectContent>
      </Select>
      
      {/* Show template count */}
      {templates.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {templates.length} template{templates.length !== 1 ? 's' : ''} available
        </div>
      )}
    </div>
  );
}