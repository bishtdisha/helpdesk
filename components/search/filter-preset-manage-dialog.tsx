'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { FilterPreset } from '@/lib/hooks/use-filter-presets';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FilterPresetManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presets: FilterPreset[];
  onRename: (presetId: string, newName: string) => void;
  onDelete: (presetId: string) => void;
}

export function FilterPresetManageDialog({
  open,
  onOpenChange,
  presets,
  onRename,
  onDelete,
}: FilterPresetManageDialogProps) {
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmPresetId, setDeleteConfirmPresetId] = useState<string | null>(null);

  const handleStartEdit = (preset: FilterPreset) => {
    setEditingPresetId(preset.id);
    setEditingName(preset.name);
  };

  const handleCancelEdit = () => {
    setEditingPresetId(null);
    setEditingName('');
  };

  const handleSaveEdit = (presetId: string) => {
    if (!editingName.trim()) {
      toast.error('Preset name cannot be empty');
      return;
    }

    onRename(presetId, editingName.trim());
    setEditingPresetId(null);
    setEditingName('');
    toast.success('Preset renamed successfully');
  };

  const handleDeleteClick = (presetId: string) => {
    setDeleteConfirmPresetId(presetId);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmPresetId) {
      onDelete(deleteConfirmPresetId);
      setDeleteConfirmPresetId(null);
      toast.success('Preset deleted successfully');
    }
  };

  const getFilterSummary = (preset: FilterPreset): string => {
    const parts: string[] = [];
    
    if (preset.filters.search) {
      parts.push(`Search: "${preset.filters.search}"`);
    }
    if (preset.filters.status && preset.filters.status.length > 0) {
      parts.push(`Status: ${preset.filters.status.join(', ')}`);
    }
    if (preset.filters.priority && preset.filters.priority.length > 0) {
      parts.push(`Priority: ${preset.filters.priority.join(', ')}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'No filters';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Filter Presets</DialogTitle>
            <DialogDescription>
              Rename or delete your saved filter presets.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {presets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No saved presets yet.</p>
                <p className="text-sm mt-2">
                  Apply filters and click &quot;Save Filter&quot; to create a preset.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {presets.map((preset, index) => (
                  <div key={preset.id}>
                    {index > 0 && <Separator className="my-3" />}
                    <div className="space-y-2">
                      {editingPresetId === preset.id ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEdit(preset.id);
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              placeholder="Preset name"
                              autoFocus
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveEdit(preset.id)}
                            disabled={!editingName.trim()}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">{preset.name}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {getFilterSummary(preset)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Created {new Date(preset.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(preset)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteClick(preset.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirmPresetId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmPresetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Filter Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this filter preset? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
