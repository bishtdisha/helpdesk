import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles with strong border and shadow
        'flex h-11 w-full min-w-0 rounded-xl border-[3px] border-input bg-transparent px-4 py-3 text-base font-medium shadow-md',
        // Darker text color
        'text-foreground/90',
        // Placeholder and selection
        'placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground',
        // Transition for smooth effects
        'transition-all duration-200',
        // Hover state with stronger effects
        'hover:border-ring/50 hover:shadow-lg hover:shadow-black/10',
        // Focus state with prominent shadow
        'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/25 focus-visible:shadow-xl focus-visible:shadow-black/15',
        // Invalid/error state
        'aria-invalid:border-destructive aria-invalid:ring-destructive/25',
        // Disabled state
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
        // File input specific
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        // Dark mode
        'dark:bg-input/30',
        // Larger text on all screens
        'text-[15px]',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
