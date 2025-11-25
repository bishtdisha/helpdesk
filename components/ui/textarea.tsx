import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base styles with strong border and shadow
        'flex field-sizing-content min-h-[140px] w-full rounded-xl border-[3px] border-input bg-transparent px-4 py-3 text-base font-medium shadow-md',
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
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
        // Dark mode
        'dark:bg-input/30',
        // Larger text on all screens
        'text-[15px] leading-relaxed',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
