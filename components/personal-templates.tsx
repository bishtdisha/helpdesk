'use client';

import React, { useState } from 'react';
import { useTemplates, useTemplateMutations, TicketTemplate } from '@/lib/hooks/use-templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, MoreHorizontal, Edit, Trash2, FileText, Globe, User } from 'lucide-react';
import { toast } from 'sonner';
import { TemplateForm } from '@/components/template-form';

export function PersonalTemplates() {
  const { templates, isLoading, error, refresh } = useTemplates();
  const { deleteTemplate } = useTemplateMutations();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<TicketTemplate | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<TicketTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter to show only personal templates and global templates
  const personalTemplates = templates.filter(template => !template.isGlobal);
  const globalTemplates = templates.filter(template => template.isGlobal);

  const handleDeleteClick = (template: TicketTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (template: TicketTemplate) => {
    setTemplateToEdit(template);
    setEditDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    setIsDeleting(true);
    try {
      await deleteTemplate(templateToDelete.id);
      toast.success('Template deleted successfully');
      refresh();
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    refresh();
    toast.success('Template created successfully');
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setTemplateToEdit(null);
    refresh();
    toast.success('Template updated successfully');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'border-red-500 text-red-700 bg-red-50';
      case 'HIGH':
        return 'border-orange-500 text-orange-700 bg-orange-50';
      case 'MEDIUM':
        return 'border-yellow-500 text-yellow-700 bg-yellow-50';
      case 'LOW':
        return 'border-green-500 text-green-700 bg-green-50';
      default:
        return 'border-gray-500 text-gray-700 bg-gray-50';
    }
  };

  const renderTemplateTable = (templateList: TicketTemplate[], title: string, showActions: boolean = true) => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>
              {templateList.length} template{templateList.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          {showActions && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <TemplateForm
                  onSuccess={handleCreateSuccess}
                  onCancel={() => setCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {templateList.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No {title.toLowerCase()} found</p>
            {showActions && <p>Create your first template to get started</p>}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                {showActions && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {templateList.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      {template.description && (
                        <div className="text-sm text-muted-foreground">
                          {template.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {template.category ? (
                      <Badge variant="outline">{template.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getPriorityColor(template.priority)}>
                      {template.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(template)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Failed to load templates</p>
            <Button variant="outline" onClick={refresh} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Templates</h2>
        <p className="text-muted-foreground">
          Manage your personal ticket templates and view available global templates.
        </p>
      </div>

      {/* Personal Templates */}
      {renderTemplateTable(personalTemplates, 'Personal Templates', true)}

      {/* Global Templates */}
      {globalTemplates.length > 0 && renderTemplateTable(globalTemplates, 'Global Templates', false)}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          {templateToEdit && (
            <TemplateForm
              template={templateToEdit}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setEditDialogOpen(false);
                setTemplateToEdit(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template "{templateToDelete?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}