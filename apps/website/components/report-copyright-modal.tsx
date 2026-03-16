"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ReportCopyrightModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
}

export function ReportCopyrightModal({ isOpen, onClose, postId }: ReportCopyrightModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    copyrightedWorkLink: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const supabase = createClient()

      await supabase.from("posts").update({ under_review: true }).eq("id", postId)

      await fetch("/api/reports/copyright", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          ...formData,
        }),
      })

      console.log("[v0] Copyright report submitted for post:", postId, formData)

      setSubmitted(true)
    } catch (error) {
      console.error("[v0] Error submitting copyright report:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Copyright Violation</DialogTitle>
          <DialogDescription>
            If you believe this content violates your copyright, please fill out this form.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center">
            <h3 className="text-lg font-semibold text-green-600 mb-2">Report Submitted</h3>
            <p className="text-gray-600 mb-6">Thank you. Your report has been sent to our copyright team for review.</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                required
                placeholder="Your legal name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="Where we can contact you"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link to Copyrighted Work</Label>
              <Input
                id="link"
                required
                placeholder="URL to the copyrighted work"
                value={formData.copyrightedWorkLink}
                onChange={(e) => handleChange("copyrightedWorkLink", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description of Infringement</Label>
              <Textarea
                id="description"
                required
                placeholder="Please describe how your copyright is being violated..."
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Copyright Report"
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Reports are automatically sent to copyright@fantikx.com
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
