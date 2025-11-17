"use client"

import * as React from "react"
import { ChevronDown, ChevronRight, HelpCircle, ExternalLink, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface InlineHelpProps {
  title: string
  children: React.ReactNode
  variant?: "default" | "info" | "warning" | "success"
  collapsible?: boolean
  defaultOpen?: boolean
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
  links?: Array<{
    text: string
    href: string
    external?: boolean
  }>
}

export function InlineHelp({
  title,
  children,
  variant = "default",
  collapsible = false,
  defaultOpen = true,
  dismissible = false,
  onDismiss,
  className,
  links
}: InlineHelpProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const [isDismissed, setIsDismissed] = React.useState(false)

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  if (isDismissed) {
    return null
  }

  const variantStyles = {
    default: "border-border bg-muted/50",
    info: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20",
    warning: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20",
    success: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
  }

  const iconStyles = {
    default: "text-muted-foreground",
    info: "text-blue-600 dark:text-blue-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    success: "text-green-600 dark:text-green-400"
  }

  const content = (
    <Card className={cn(variantStyles[variant], "border", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <HelpCircle className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconStyles[variant])} />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{title}</h4>
              <div className="flex items-center gap-1">
                {collapsible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-6 w-6 p-0"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
                {dismissible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {(!collapsible || isOpen) && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {children}
                </div>
                
                {links && links.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {links.map((link, index) => (
                      <a
                        key={index}
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                      >
                        {link.text}
                        {link.external && <ExternalLink className="h-3 w-3" />}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (collapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {content}
      </Collapsible>
    )
  }

  return content
}

export { type InlineHelpProps }