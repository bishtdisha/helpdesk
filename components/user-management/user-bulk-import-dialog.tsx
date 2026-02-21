"use client"

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  users: Array<{ name: string; email: string; role: string; team: string }>;
  failedRows?: any[];
}

interface UserBulkImportDialogProps {
  onImportComplete?: () => void;
}

export function UserBulkImportDialog({ onImportComplete }: UserBulkImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith('.xlsx') && !selectedFile.name.toLowerCase().endsWith('.xls')) {
        toast.error('Invalid file type. Please upload an Excel file (.xlsx or .xls)');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/users/bulk-import');
      if (!response.ok) throw new Error('Failed to download template');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user-import-template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/users/bulk-import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to import users');
      }

      setResult(data.result);
      
      if (data.result.success > 0) {
        toast.success(`Successfully imported ${data.result.success} user(s)`);
        if (onImportComplete) {
          onImportComplete();
        }
      }
      
      if (data.result.failed > 0) {
        toast.error(`Failed to import ${data.result.failed} user(s)`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import users');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportErrors = async () => {
    if (!result?.failedRows || result.failedRows.length === 0) {
      toast.error('No failed rows to export');
      return;
    }

    try {
      const response = await fetch('/api/users/bulk-import/export-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ failedRows: result.failedRows }),
      });

      if (!response.ok) {
        throw new Error('Failed to export errors');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-import-errors-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Failed rows exported successfully');
    } catch (error) {
      console.error('Error exporting failed rows:', error);
      toast.error('Failed to export errors');
    }
  };

  const handleClose = () => {
    handleReset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Import Users
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Import Users
          </DialogTitle>
          <DialogDescription>
            Import multiple users from an Excel file. Download the template to get started.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Template Download */}
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Download the Excel template to get started</span>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Excel files only (.xlsx, .xls) - Maximum 500 users
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    disabled={uploading}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <Progress value={undefined} className="w-full" />
                    <p className="text-sm text-center text-muted-foreground">
                      Importing users...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Import Results */}
          {result && (
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Success
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {result.success}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      Failed
                    </p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {result.failed}
                    </p>
                  </div>
                </div>
              </div>

              {/* Successfully Imported Users - Removed detailed list */}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="space-y-3">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-2">
                        {result.errors.length} row(s) failed to import due to validation errors.
                      </p>
                      <p className="text-sm">
                        Download the error report below to see detailed information about each failed row and fix the issues.
                      </p>
                    </AlertDescription>
                  </Alert>
                  
                  <Button
                    variant="outline"
                    onClick={handleExportErrors}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Error Report (Excel)
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {!result && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Excel Format Requirements:</p>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  <li><strong>Name</strong> (required): Full name of the user</li>
                  <li><strong>Email</strong> (required): Valid email address</li>
                  <li><strong>Password</strong> (required): Minimum 8 characters</li>
                  <li><strong>Role Name</strong> (optional): Must match existing role name exactly</li>
                  <li><strong>Team Name</strong> (optional): Must match existing team name exactly</li>
                  <li><strong>Is Active</strong> (optional): YES or NO (default: YES)</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && file && (
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Users
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
