'use client';

import React, { useState } from 'react';
import { useTemplates, useTemplateMutations, TicketTemplate } from '@/lib/hooks/use-templates';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { PermissionGuard } from '@/components/rbac/permission-guard';
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
import { Loader2, Plus, MoreHorizontal, Edit, Trash2, Globe, User, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { TemplateForm } from '@/components/template-form';

export function TemplateManagement() {
  const { templates, isLoading, error, refresh } = useTemplates();
  const { deleteTemplate } = useTemplateMutations();
  const { canManageSLA } = usePermissions(); // Using SLA permission as proxy for Admin_Manager
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<TicketTemplate | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<TicketTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  return (
    <PermissionGuard require="canManageSLA" fallback={
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>You don't have permission to manage templates.</p>
            <p className="text-sm">Only Admin_Manager users can access this feature.</p>
          </div>
        </CardContent>
      </Card>
    }>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Template Management</CardTitle>
              <CardDescription>
                Create and manage ticket templates for faster ticket creation
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
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
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading templates...</span>
            </div>
          ) : error ? (
            <div className="text-center p-8 text-destructive">
              <p>Failed to load templates</p>
              <Button variant="outline" onClick={refresh} className="mt-2">
                Try Again
              </Button>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No templates found</p>
              <p>Create your first template to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
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
                      <div className="flex items-center gap-2">
                        {template.isGlobal ? (
                          <>
                            <Globe className="h-4 w-4 text-blue-500" />
                            <Badge variant="secondary">Global</Badge>
                          </>
                        ) : (
                          <>
                            <User className="h-4 w-4 text-gray-500" />
                            <Badge variant="outline">Personal</Badge>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{template.creator.name}</div>
                        <div className="text-muted-foreground">{template.creator.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(template.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
    </PermissionGuard>
  );
}