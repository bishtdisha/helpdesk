"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react"
import { validateRegistrationData, validatePassword } from "@/lib/validation"

interface Team {
  id: string
  name: string
}

interface FormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  teamId: string
}

interface FormErrors {
  name?: string[]
  email?: string[]
  password?: string[]
  confirmPassword?: string[]
  general?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    teamId: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  
  // Password requirements validation state
  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasLowercase: /[a-z]/.test(formData.password),
    hasUppercase: /[A-Z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password),
  }

  // Fetch teams on component mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setTeamsLoading(true)
        const response = await fetch('/api/teams/public')
        if (response.ok) {
          const data = await response.json()
          setTeams(data.teams || [])
        }
      } catch (error) {
        console.error('Error fetching teams:', error)
      } finally {
        setTeamsLoading(false)
      }
    }

    fetchTeams()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear field-specific errors when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validate using the existing validation utility
    const validation = validateRegistrationData({
      email: formData.email,
      password: formData.password,
      name: formData.name,
    })

    if (!validation.isValid) {
      newErrors.email = validation.errors.email
      newErrors.password = validation.errors.password
      newErrors.name = validation.errors.name
    }

    // Additional client-side validation for confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = ["Please confirm your password"]
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = ["Passwords do not match"]
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          teamId: formData.teamId || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage("Registration successful! Redirecting to login...")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        // Handle API validation errors
        if (data.details) {
          setErrors(data.details)
        } else {
          setErrors({ general: data.message || "Registration failed" })
        }
      }
    } catch (error) {
      console.error("Registration error:", error)
      setErrors({ general: "An unexpected error occurred. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  if (successMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-green-600 text-lg font-semibold mb-2">
                ✓ {successMessage}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Enter your information to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-md text-sm">
                {errors.general}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <div className="text-destructive text-sm">
                  {errors.name.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                aria-invalid={!!errors.email}
                required
              />
              {errors.email && (
                <div className="text-destructive text-sm">
                  {errors.email.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamId">Team (Optional)</Label>
              <Select
                value={formData.teamId || undefined}
                onValueChange={(value) => setFormData(prev => ({ ...prev, teamId: value === "none" ? "" : value }))}
                disabled={teamsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={teamsLoading ? "Loading teams..." : "Select a team (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                You can join a team now or later
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  aria-invalid={!!errors.password}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {/* Password Requirements Indicator */}
              <div className="mt-2 p-3 bg-muted/50 rounded-md border">
                <p className="text-xs font-medium mb-2">Password must contain:</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2 text-xs">
                    {passwordRequirements.minLength ? (
                      <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={passwordRequirements.minLength ? "text-green-600" : "text-muted-foreground"}>
                      At least 8 characters
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    {passwordRequirements.hasLowercase ? (
                      <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={passwordRequirements.hasLowercase ? "text-green-600" : "text-muted-foreground"}>
                      One lowercase letter (a-z)
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    {passwordRequirements.hasUppercase ? (
                      <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={passwordRequirements.hasUppercase ? "text-green-600" : "text-muted-foreground"}>
                      One uppercase letter (A-Z)
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    {passwordRequirements.hasNumber ? (
                      <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={passwordRequirements.hasNumber ? "text-green-600" : "text-muted-foreground"}>
                      One number (0-9)
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    {passwordRequirements.hasSpecialChar ? (
                      <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={passwordRequirements.hasSpecialChar ? "text-green-600" : "text-muted-foreground"}>
                      One special character (!@#$...)
                    </span>
                  </li>
                </ul>
              </div>
              
              {errors.password && (
                <div className="text-destructive text-sm">
                  {errors.password.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  aria-invalid={!!errors.confirmPassword}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="text-destructive text-sm">
                  {errors.confirmPassword.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}