'use client';

import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentInputProps {
  value: string;
  onChange: (value: string) => void;
  isInternal?: boolean;
  onIsInternalChange?: (isInternal: boolean) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  showInternalOption?: boolean;
  id?: string;
}

export function CommentInput({
  value,
  onChange,
  isInternal = false,
  onIsInternalChange,
  placeholder = 'Add a comment...',
  maxLength = 5000,
  disabled = false,
  className,
  showInternalOption = true,
  id,
}: CommentInputProps) {
  const characterCount = value.length;
  const isNearLimit = maxLength && characterCount > maxLength * 0.9;
  const isOverLimit = maxLength && characterCount > maxLength;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={cn(
            'min-h-[120px] resize-y',
            isOverLimit && 'border-destructive focus-visible:border-destructive'
          )}
          aria-label="Comment text"
          aria-describedby={maxLength ? `${id ? id + '-' : ''}comment-character-count` : undefined}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        {showInternalOption && onIsInternalChange && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="comment-internal"
              checked={isInternal}
              onCheckedChange={onIsInternalChange}
              disabled={disabled}
              aria-label="Mark as internal comment"
            />
            <Label
              htmlFor="comment-internal"
              className="text-sm font-normal cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="h-3.5 w-3.5" />
              Internal Note
            </Label>
          </div>
        )}

        {maxLength && (
          <div
            id={`${id ? id + '-' : ''}comment-character-count`}
            className={cn(
              'text-xs text-muted-foreground ml-auto',
              isNearLimit && !isOverLimit && 'text-yellow-600 dark:text-yellow-500',
              isOverLimit && 'text-destructive font-medium'
            )}
            aria-live="polite"
          >
            {characterCount} / {maxLength}
          </div>
        )}
      </div>
    </div>
  );
}
