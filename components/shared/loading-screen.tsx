import { Loader2 } from "lucide-react"

interface LoadingScreenProps {
  message?: string
  submessage?: string
}

export function LoadingScreen({ 
  message = "Loading", 
  submessage = "Please wait..." 
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <div className="space-y-2">
          <p className="text-lg font-medium">{message}</p>
          <p className="text-sm text-muted-foreground">{submessage}</p>
        </div>
      </div>
    </div>
  )
}
