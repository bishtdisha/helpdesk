'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookmarkIcon, Settings } from 'lucide-react';
import { FilterPreset } from '@/lib/hooks/use-filter-presets';

interface FilterPresetDropdownProps {
  presets: FilterPreset[];
  activePresetId?: string | null;
  onSelectPreset: (preset: FilterPreset) => void;
  onManagePresets: () => void;
}

export function FilterPresetDropdown({
  presets,
  activePresetId,
  onSelectPreset,
  onManagePresets,
}: FilterPresetDropdownProps) {
  const [open, setOpen] = useState(false);

  const handleSelectPreset = (preset: FilterPreset) => {
    onSelectPreset(preset);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BookmarkIcon className="h-4 w-4" />
          Presets
          {presets.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {presets.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Saved Filter Presets</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {presets.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            No saved presets yet
          </div>
        ) : (
          <>
            {presets.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{preset.name}</span>
                  {activePresetId === preset.id && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={() => {
            onManagePresets();
            setOpen(false);
          }}
          className="cursor-pointer"
        >
          <Settings className="h-4 w-4 mr-2" />
          Manage Presets
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
