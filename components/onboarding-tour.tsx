"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, X, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface OnboardingStep {
  id: string
  title: string
  content: React.ReactNode
  target: string // CSS selector for the target element
  placement?: "top" | "bottom" | "left" | "right"
  offset?: { x: number; y: number }
  spotlight?: boolean
  optional?: boolean
}

interface OnboardingTourProps {
  steps: OnboardingStep[]
  tourId: string
  autoStart?: boolean
  onComplete?: () => void
  onSkip?: () => void
  className?: string
}

const STORAGE_KEY_PREFIX = "onboarding-tour-"

export function OnboardingTour({
  steps,
  tourId,
  autoStart = false,
  onComplete,
  onSkip,
  className
}: OnboardingTourProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}${tourId}`
  
  // Check if tour has been completed (initialize once)
  const [tourCompleted] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(storageKey) === "completed"
  })
  
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Check if tour has been completed
  const isTourCompleted = () => {
    return tourCompleted
  }

  // Mark tour as completed
  const markTourCompleted = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "completed")
    }
  }

  // Start the tour
  const startTour = () => {
    if (steps.length === 0) return
    setCurrentStep(0)
    setIsActive(true)
  }

  // End the tour
  const endTour = (completed = false) => {
    setIsActive(false)
    setCurrentStep(0)
    setTargetElement(null)
    
    if (completed) {
      markTourCompleted()
      onComplete?.()
    } else {
      onSkip?.()
    }
  }

  // Navigate to next step
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      endTour(true)
    }
  }

  // Navigate to previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Skip the tour
  const skipTour = () => {
    markTourCompleted() // Mark as completed even when skipped
    endTour(false)
  }

  // Calculate tooltip position
  const calculateTooltipPosition = (target: HTMLElement, placement: string = "bottom") => {
    const targetRect = target.getBoundingClientRect()
    const tooltipRect = tooltipRef.current?.getBoundingClientRect()
    
    if (!tooltipRect) return { x: 0, y: 0 }

    let x = 0
    let y = 0

    switch (placement) {
      case "top":
        x = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
        y = targetRect.top - tooltipRect.height - 10
        break
      case "bottom":
        x = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
        y = targetRect.bottom + 10
        break
      case "left":
        x = targetRect.left - tooltipRect.width - 10
        y = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
        break
      case "right":
        x = targetRect.right + 10
        y = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
        break
    }

    // Keep tooltip within viewport
    const padding = 10
    x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding))
    y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding))

    return { x, y }
  }

  // Update target element and position
  useEffect(() => {
    if (!isActive || currentStep >= steps.length) return

    const step = steps[currentStep]
    const element = document.querySelector(step.target) as HTMLElement

    if (element) {
      setTargetElement(element)
      
      // Scroll element into view
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center"
      })

      // Calculate position after a short delay to ensure scrolling is complete
      setTimeout(() => {
        const position = calculateTooltipPosition(element, step.placement)
        setTooltipPosition(position)
      }, 300)
    }
  }, [isActive, currentStep, steps])

  // Auto-start tour if enabled and not completed
  useEffect(() => {
    if (autoStart && !tourCompleted && steps.length > 0) {
      // Delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startTour()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [autoStart, tourCompleted, steps.length])

  // Handle window resize
  useEffect(() => {
    if (!isActive || !targetElement) return

    const handleResize = () => {
      const step = steps[currentStep]
      const position = calculateTooltipPosition(targetElement, step.placement)
      setTooltipPosition(position)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isActive, targetElement, currentStep, steps])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isActive) {
        skipTour()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isActive])

  if (!isActive || currentStep >= steps.length) {
    return null
  }

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/50"
        onClick={skipTour}
      />

      {/* Spotlight */}
      {step.spotlight && targetElement && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: targetElement.getBoundingClientRect().left - 4,
            top: targetElement.getBoundingClientRect().top - 4,
            width: targetElement.getBoundingClientRect().width + 8,
            height: targetElement.getBoundingClientRect().height + 8,
            boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5)",
            borderRadius: "8px",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-50 w-80 max-w-sm",
          className
        )}
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
        }}
      >
        <Card className="shadow-lg border-2 border-primary/20">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <Badge variant="outline" className="text-xs">
                  {currentStep + 1} of {steps.length}
                </Badge>
                {step.optional && (
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTour}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress */}
            <Progress value={progress} className="mb-4 h-1" />

            {/* Content */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">{step.title}</h3>
              <div className="text-sm text-muted-foreground">
                {step.content}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTour}
                className="text-xs"
              >
                Skip Tour
              </Button>
              
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    Back
                  </Button>
                )}
                
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="gap-1"
                >
                  {currentStep === steps.length - 1 ? (
                    "Finish"
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// Hook to trigger onboarding tour
export function useOnboardingTour(tourId: string) {
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tourId}`) === "completed"
      setIsCompleted(completed)
    }
  }, [tourId])

  const resetTour = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${tourId}`)
      setIsCompleted(false)
    }
  }

  const markCompleted = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${tourId}`, "completed")
      setIsCompleted(true)
    }
  }

  return {
    isCompleted,
    resetTour,
    markCompleted
  }
}

export { type OnboardingStep, type OnboardingTourProps }