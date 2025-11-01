"use client"

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { PermissionGate } from './permission-gate';
import type { RoleType, PermissionScope } from '@/lib/types/rbac';

interface ActionButtonProps {
  children: ReactNode;
  action: string;
  resource: string;
  scope?: PermissionScope;
  requireRole?: RoleType;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * ActionButton component with permission-based visibility
 * Only renders the button if the user has the required permission
 */
export function ActionButton({
  children,
  action,
  resource,
  scope,
  requireRole,
  onClick,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
  type = 'button',
}: ActionButtonProps) {
  return (
    <PermissionGate
      action={action}
      resource={resource}
      scope={scope}
      requireRole={requireRole}
    >
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
        onClick={onClick}
        type={type}
      >
        {children}
      </Button>
    </PermissionGate>
  );
}