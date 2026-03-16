"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Lock, User, Sparkles, Calendar } from "lucide-react"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [is18Plus, setIs18Plus] = useState(false)
  const [ageError, setAgeError] = useState("")

  const calculateAge = (dob: string) => {
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAgeError("")

    if (!dateOfBirth) {
      setAgeError("Please enter your date of birth")
      return
    }

    const age = calculateAge(dateOfBirth)
    if (age < 18) {
      setAgeError("You must be 18 years or older to create an account")
      return
    }

    if (!is18Plus) {
      setAgeError("You must confirm that you are 18+ and legally allowed to view adult content")
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      onOpenChange(false)
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glow-border-purple neuro-raised bg-white/95 backdrop-blur-xl border-0 rounded-3xl p-8">
        <DialogHeader className="text-center">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-[#00d4ff] via-[#a855f7] to-[#ec4899] bg-clip-text text-transparent mb-2">
            Welcome to Fantikx
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-pretty">
            Join the future of social connection
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="signup" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 neuro-inset rounded-2xl p-1 bg-muted/50">
            <TabsTrigger
              value="signup"
              className="rounded-xl data-[state=active]:neuro-raised data-[state=active]:bg-white data-[state=active]:glow-cyan transition-all duration-300"
            >
              Sign Up
            </TabsTrigger>
            <TabsTrigger
              value="login"
              className="rounded-xl data-[state=active]:neuro-raised data-[state=active]:bg-white data-[state=active]:glow-purple transition-all duration-300"
            >
              Log In
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signup" className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-medium">
                  Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Your name"
                    className="pl-10 neuro-inset rounded-xl border-0 bg-muted/30 focus:glow-cyan transition-all duration-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 neuro-inset rounded-xl border-0 bg-muted/30 focus:glow-cyan transition-all duration-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob" className="text-foreground font-medium">
                  Date of Birth
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="dob"
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="pl-10 neuro-inset rounded-xl border-0 bg-muted/30 focus:glow-cyan transition-all duration-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 neuro-inset rounded-xl border-0 bg-muted/30 focus:glow-cyan transition-all duration-300"
                  />
                </div>
              </div>
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="age-confirm"
                  checked={is18Plus}
                  onCheckedChange={(checked) => setIs18Plus(checked as boolean)}
                  required
                />
                <Label htmlFor="age-confirm" className="text-sm text-foreground leading-relaxed cursor-pointer">
                  I confirm that I am 18+ and legally allowed to view adult content.
                </Label>
              </div>
              {ageError && <p className="text-sm text-red-600 font-medium">{ageError}</p>}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full glow-border-cyan neuro-raised rounded-xl py-6 text-base font-semibold bg-gradient-to-r from-[#00d4ff] to-[#38bdf8] text-white hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 animate-spin" />
                    Creating your account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Create Account
                  </span>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="login" className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-foreground font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 neuro-inset rounded-xl border-0 bg-muted/30 focus:glow-purple transition-all duration-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-foreground font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 neuro-inset rounded-xl border-0 bg-muted/30 focus:glow-purple transition-all duration-300"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full glow-border-purple neuro-raised rounded-xl py-6 text-base font-semibold bg-gradient-to-r from-[#a855f7] to-[#ec4899] text-white hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Sign In
                  </span>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-center text-muted-foreground mt-6 text-pretty">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </DialogContent>
    </Dialog>
  )
}
