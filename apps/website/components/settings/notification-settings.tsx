"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Bell, Mail, Heart, MessageCircle, Users, DollarSign, Newspaper } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NotificationPreferences {
  email_new_follower: boolean
  email_new_like: boolean
  email_new_comment: boolean
  email_new_message: boolean
  email_new_post_from_following: boolean
  email_purchase_notification: boolean
  email_weekly_digest: boolean
  email_frequency: "instant" | "daily" | "weekly"
}

const defaultPreferences: NotificationPreferences = {
  email_new_follower: true,
  email_new_like: true,
  email_new_comment: true,
  email_new_message: true,
  email_new_post_from_following: true,
  email_purchase_notification: true,
  email_weekly_digest: true,
  email_frequency: "instant",
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch("/api/notification-preferences")
        if (res.ok) {
          const data = await res.json()
          setPreferences({ ...defaultPreferences, ...data })
        }
      } catch (error) {
        console.error("[v0] Error loading notification preferences:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch("/api/notification-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error("[v0] Error saving notification preferences:", error)
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Email Notifications</h3>
      </div>

      <div className="space-y-4">
        {/* Frequency setting */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div>
            <Label className="font-medium">Email Frequency</Label>
            <p className="text-sm text-muted-foreground">How often do you want to receive emails?</p>
          </div>
          <Select
            value={preferences.email_frequency}
            onValueChange={(value) => updatePreference("email_frequency", value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instant">Instant</SelectItem>
              <SelectItem value="daily">Daily Digest</SelectItem>
              <SelectItem value="weekly">Weekly Digest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notification toggles */}
        <div className="space-y-1">
          <NotificationToggle
            icon={<Users className="h-4 w-4" />}
            label="New Followers"
            description="When someone starts following you"
            checked={preferences.email_new_follower}
            onCheckedChange={(checked) => updatePreference("email_new_follower", checked)}
          />

          <NotificationToggle
            icon={<Heart className="h-4 w-4" />}
            label="New Likes"
            description="When someone likes your post"
            checked={preferences.email_new_like}
            onCheckedChange={(checked) => updatePreference("email_new_like", checked)}
          />

          <NotificationToggle
            icon={<MessageCircle className="h-4 w-4" />}
            label="New Comments"
            description="When someone comments on your post"
            checked={preferences.email_new_comment}
            onCheckedChange={(checked) => updatePreference("email_new_comment", checked)}
          />

          <NotificationToggle
            icon={<Mail className="h-4 w-4" />}
            label="New Messages"
            description="When someone sends you a message"
            checked={preferences.email_new_message}
            onCheckedChange={(checked) => updatePreference("email_new_message", checked)}
          />

          <NotificationToggle
            icon={<Newspaper className="h-4 w-4" />}
            label="New Posts from Following"
            description="When creators you follow post new content"
            checked={preferences.email_new_post_from_following}
            onCheckedChange={(checked) => updatePreference("email_new_post_from_following", checked)}
          />

          <NotificationToggle
            icon={<DollarSign className="h-4 w-4" />}
            label="Purchase Notifications"
            description="When someone purchases your content"
            checked={preferences.email_purchase_notification}
            onCheckedChange={(checked) => updatePreference("email_purchase_notification", checked)}
          />

          <NotificationToggle
            icon={<Bell className="h-4 w-4" />}
            label="Weekly Digest"
            description="Weekly summary of your activity"
            checked={preferences.email_weekly_digest}
            onCheckedChange={(checked) => updatePreference("email_weekly_digest", checked)}
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : saved ? (
          "Saved!"
        ) : (
          "Save Preferences"
        )}
      </Button>
    </div>
  )
}

interface NotificationToggleProps {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function NotificationToggle({ icon, label, description, checked, onCheckedChange }: NotificationToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/20 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <Label className="font-medium cursor-pointer">{label}</Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
