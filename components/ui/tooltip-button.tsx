"use client"

import * as React from "react"
import { Button, ButtonProps } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface TooltipButtonProps extends ButtonProps {
  tooltip: string
  shortcut?: string
  side?: "top" | "right" | "bottom" | "left"
  delayDuration?: number
}

const TooltipButton = React.forwardRef<HTMLButtonElement, TooltipButtonProps>(
  ({ tooltip, shortcut, side = "top", delayDuration = 300, children, className, ...props }, ref) => {
    return (
      <TooltipProvider delayDuration={delayDuration}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button ref={ref} className={className} {...props}>
              {children}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={side}>
            <div className="flex items-center gap-2">
              <span>{tooltip}</span>
              {shortcut && (
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  {shortcut}
                </kbd>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
)

TooltipButton.displayName = "TooltipButton"

export { TooltipButton, type TooltipButtonProps }