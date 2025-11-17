"use client"

import * as React from "react"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface FormFieldWithHelpProps {
  label: string
  helpText?: string
  helpTooltip?: string
  required?: boolean
  error?: string
  example?: string
  children: React.ReactNode
  className?: string
}

export function FormFieldWithHelp({
  label,
  helpText,
  helpTooltip,
  required = false,
  error,
  example,
  children,
  className
}: FormFieldWithHelpProps) {
  const fieldId = React.useId()

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {helpTooltip && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-sm">{helpTooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <div className="space-y-1">
        {React.cloneElement(children as React.ReactElement, { 
          id: fieldId,
          'aria-describedby': helpText || example || error ? `${fieldId}-help` : undefined,
          'aria-invalid': error ? 'true' : undefined
        })}
        
        <div id={`${fieldId}-help`} className="space-y-1">
          {helpText && (
            <p className="text-xs text-muted-foreground">{helpText}</p>
          )}
          {example && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Example:</span> {example}
            </p>
          )}
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export { type FormFieldWithHelpProps }