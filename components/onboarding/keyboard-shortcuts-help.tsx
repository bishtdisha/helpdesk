'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useShortcutRegistry, formatShortcutKey, KeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcuts';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Component to display a visual keyboard key
 */
function KeyboardKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 text-sm font-semibold text-foreground bg-muted border border-border rounded shadow-sm">
      {children}
    </kbd>
  );
}

/**
 * Component to display a keyboard shortcut
 */
function ShortcutItem({ shortcut }: { shortcut: KeyboardShortcut }) {
  const formattedKey = formatShortcutKey(shortcut);
  const keys = formattedKey.split(' + ');

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            <KeyboardKey>{key}</KeyboardKey>
            {index < keys.length - 1 && (
              <span className="text-muted-foreground mx-1">+</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/**
 * Keyboard shortcuts help dialog component
 */
export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const { getByCategory } = useShortcutRegistry();
  const shortcutsByCategory = getByCategory();
  const categories = Object.keys(shortcutsByCategory).sort();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and perform actions quickly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No keyboard shortcuts registered
            </div>
          ) : (
            categories.map((category) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {shortcutsByCategory[category].map((shortcut, index) => (
                      <React.Fragment key={index}>
                        <ShortcutItem shortcut={shortcut} />
                        {index < shortcutsByCategory[category].length - 1 && (
                          <Separator className="my-2" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Additional tips */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    Most shortcuts work globally, but some are context-specific
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    Shortcuts are disabled when typing in input fields (except <KeyboardKey>/</KeyboardKey> and <KeyboardKey>Escape</KeyboardKey>)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    Press <KeyboardKey>?</KeyboardKey> anytime to view this help dialog
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
