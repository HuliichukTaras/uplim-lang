"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Camera, Loader2, LogOut, AlertCircle, Check, Lock } from "lucide-react"
import { Link } from "@/i18n/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { validateHandleFormat, canChangeHandle } from "@/lib/utils/handle"
import { normalizeUrl } from "@/lib/utils"
import { NotificationSettings } from "@/components/settings/notification-settings"

interface SettingsClientProps {
  profile: any
  user: any
  isSetup?: boolean
}

type SaveStatus = "idle" | "saving" | "saved" | "error"

export function SettingsClient({ profile, user, isSetup }: SettingsClientProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name || "")
  const [handle, setHandle] = useState(profile?.handle || "")
  const [bio, setBio] = useState(profile?.bio || "")
  const [lastSavedBio, setLastSavedBio] = useState(profile?.bio || "")
  const [linkInBio, setLinkInBio] = useState(profile?.link_in_bio || "")
  const [lastSavedLink, setLastSavedLink] = useState(profile?.link_in_bio || "")
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "")
  const [isUploading, setIsUploading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [canChangeHandleNow, setCanChangeHandleNow] = useState(true)
  const [nextHandleChangeDate, setNextHandleChangeDate] = useState<Date | null>(null)
  const [handleError, setHandleError] = useState<string>("")
  const [subscriptionPrice, setSubscriptionPrice] = useState("")
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false)
  const [defaultPPVPrice, setDefaultPPVPrice] = useState("")
  const [billingProfile, setBillingProfile] = useState<any>(null)
  const [addressLine1, setAddressLine1] = useState("")
  const [addressLine2, setAddressLine2] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [country, setCountry] = useState("US")
  const [taxId, setTaxId] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordStatus, setPasswordStatus] = useState<SaveStatus>("idle")
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const COUNTRIES = [
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "ES", name: "Spain" },
    { code: "IT", name: "Italy" },
    { code: "NL", name: "Netherlands" },
    { code: "UA", name: "Ukraine" },
    { code: "PL", name: "Poland" },
    // Add more as needed
  ]

  useEffect(() => {
    async function checkHandleChange() {
      if (!user?.id) return

      const result = await canChangeHandle(user.id)
      setCanChangeHandleNow(result.canChange)
      setNextHandleChangeDate(result.nextChangeDate || null)
    }

    checkHandleChange()
  }, [user?.id])

  useEffect(() => {
    async function loadCreatorSettings() {
      if (!user?.id) return

      const { data } = await supabase
        .from("creator_settings")
        .select("subscription_price, subscription_enabled, default_ppv_price")
        .eq("id", user.id)
        .single()

      if (data) {
        setSubscriptionPrice(data.subscription_price?.toString() || "")
        setSubscriptionEnabled(data.subscription_enabled || false)
        setDefaultPPVPrice(data.default_ppv_price?.toString() || "5.00")
      }
    }

    loadCreatorSettings()
  }, [user?.id])

  useEffect(() => {
    async function loadBillingProfile() {
      if (!user?.id) return

      const { data } = await supabase.from("billing_profiles").select("*").eq("user_id", user.id).single()

      if (data) {
        setBillingProfile(data)
        setAddressLine1(data.address_line1 || "")
        setAddressLine2(data.address_line2 || "")
        setCity(data.city || "")
        setState(data.state || "")
        setPostalCode(data.postal_code || "")
        setCountry(data.country || "US")
        setTaxId(data.tax_id || "")
      }
    }

    loadBillingProfile()
  }, [user?.id])

  const autoSave = useCallback(
    async (field: string, value: string) => {
      if (!user?.id) return

      setSaveStatus("saving")
      setError(null)

      try {
        // Special handling for handle changes
        if (field === "handle") {
          if (value === profile?.handle) {
            setSaveStatus("idle")
            return
          }

          const validation = validateHandleFormat(value)
          if (!validation.valid) {
            setHandleError(validation.error || "")
            setSaveStatus("error")
            return
          }

          if (!canChangeHandleNow) {
            setHandleError(`You can change your handle again on ${nextHandleChangeDate?.toLocaleDateString()}`)
            setSaveStatus("error")
            return
          }

          const response = await fetch("/api/handle/change", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newHandle: value }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || "Failed to change handle")
          }

          setHandleError("")
        } else if (field === "subscription_price" || field === "subscription_enabled") {
          const price = Number.parseFloat(subscriptionPrice)
          if (isNaN(price) || price < 4.99 || price > 49.99) return

          await supabase.from("creator_settings").upsert({
            id: user.id,
            subscription_price: price,
            subscription_enabled: subscriptionEnabled,
            updated_at: new Date().toISOString(),
          })
        } else if (field === "default_ppv_price") {
          const price = Number.parseFloat(defaultPPVPrice)
          if (isNaN(price) || price < 0.5 || price > 99.99) return

          await supabase.from("creator_settings").upsert({
            id: user.id,
            default_ppv_price: price,
            updated_at: new Date().toISOString(),
          })
        } else {
          // Auto-save other fields
          let valueToSave = value

          if (field === "link_in_bio" && value) {
            valueToSave = normalizeUrl(value)
          }

          const { error: updateError } = await supabase
            .from("profiles")
            .update({ [field]: valueToSave })
            .eq("id", user.id)

          if (updateError) throw updateError

          if (field === "bio") {
            setLastSavedBio(value)
          } else if (field === "link_in_bio") {
            setLastSavedLink(value) // Keep local state as user typed, but saved version is sanitized
          }
        }

        setSaveStatus("saved")
        setTimeout(() => setSaveStatus("idle"), 2000)
      } catch (err: any) {
        setError(err.message)
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 3000)
      }
    },
    [
      user?.id,
      profile?.handle,
      canChangeHandleNow,
      nextHandleChangeDate,
      supabase,
      subscriptionPrice,
      subscriptionEnabled,
      defaultPPVPrice,
    ],
  )

  const saveBillingInfo = useCallback(async () => {
    if (!user?.id) return

    setSaveStatus("saving")
    try {
      const { error } = await supabase.from("billing_profiles").upsert(
        {
          user_id: user.id,
          address_line1: addressLine1,
          address_line2: addressLine2,
          city,
          state,
          postal_code: postalCode,
          country,
          tax_id: taxId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )

      if (error) throw error
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (err: any) {
      console.error("Error saving billing info:", err)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }, [user?.id, addressLine1, addressLine2, city, state, postalCode, country, taxId, supabase])

  useEffect(() => {
    const syncedBio = profile?.bio || ""
    setBio(syncedBio)
    setLastSavedBio(syncedBio)
  }, [profile?.bio])

  useEffect(() => {
    const syncedLink = profile?.link_in_bio || ""
    setLinkInBio(syncedLink)
    setLastSavedLink(syncedLink)
  }, [profile?.link_in_bio])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (displayName !== profile?.display_name && displayName !== "") {
        autoSave("display_name", displayName)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [displayName, profile?.display_name, autoSave])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (bio !== lastSavedBio) {
        autoSave("bio", bio)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [bio, lastSavedBio, autoSave])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (linkInBio !== lastSavedLink) {
        autoSave("link_in_bio", linkInBio)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [linkInBio, lastSavedLink, autoSave])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (handle !== profile?.handle && handle !== "") {
        autoSave("handle", handle)
      }
    }, 1500) // Longer delay for handle
    return () => clearTimeout(timer)
  }, [handle, profile?.handle, autoSave])

  useEffect(() => {
    if (avatarUrl !== profile?.avatar_url && avatarUrl !== "") {
      autoSave("avatar_url", avatarUrl)
    }
  }, [avatarUrl, profile?.avatar_url, autoSave])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!user?.id || subscriptionPrice === "") return

      const price = Number.parseFloat(subscriptionPrice)
      if (isNaN(price) || price < 4.99 || price > 49.99) return

      await supabase.from("creator_settings").upsert({
        id: user.id,
        subscription_price: price,
        subscription_enabled: subscriptionEnabled,
        updated_at: new Date().toISOString(),
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [subscriptionPrice, subscriptionEnabled, user?.id, supabase])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!user?.id || defaultPPVPrice === "") return

      const price = Number.parseFloat(defaultPPVPrice)
      if (isNaN(price) || price < 0.5 || price > 99.99) return

      await supabase.from("creator_settings").upsert({
        id: user.id,
        default_ppv_price: price,
        updated_at: new Date().toISOString(),
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [defaultPPVPrice, user?.id, supabase])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (billingProfile) {
        // Only auto-save if we've loaded (or attempted to load)
        saveBillingInfo()
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [addressLine1, addressLine2, city, state, postalCode, country, taxId, saveBillingInfo, billingProfile])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      setAvatarUrl(data.url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) return

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      return
    }

    setPasswordStatus("saving")
    setPasswordError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setPasswordStatus("saved")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setPasswordStatus("idle"), 2000)
    } catch (err: any) {
      setPasswordError(err.message)
      setPasswordStatus("error")
    }
  }

  const handleHandleChange = (value: string) => {
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9._-]/g, "")
    setHandle(cleanValue)

    const validation = validateHandleFormat(cleanValue)
    if (!validation.valid) {
      setHandleError(validation.error || "")
    } else {
      setHandleError("")
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: "global" })
      // Use window.location for hard redirect to clear all cached state
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
      // Force redirect even if signOut fails
      window.location.href = "/"
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/feed">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Edit Profile</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Saving...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Saved</span>
              </>
            )}
            {saveStatus === "error" && <span className="text-red-600">Error saving</span>}
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {isSetup && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">Complete Your Profile</h3>
              <p className="text-sm text-amber-700 mt-1">Please set a handle to access your profile page.</p>
            </div>
          </div>
        )}

        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <Image
                  src={avatarUrl || "/placeholder.svg"}
                  alt="Avatar"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-white font-bold text-3xl">
                  {displayName?.[0]?.toUpperCase() || handle?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-sm text-muted-foreground">Click the camera icon to change your profile photo</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="handle">Handle {isSetup && <span className="text-red-500">*</span>}</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="handle"
                value={handle}
                onChange={(e) => handleHandleChange(e.target.value)}
                placeholder="handle"
                className="pl-8"
                disabled={!canChangeHandleNow && !isSetup}
              />
            </div>
            {handleError && <p className="text-sm text-red-600 mt-1">{handleError}</p>}
            {!canChangeHandleNow && nextHandleChangeDate && !isSetup && (
              <p className="text-sm text-amber-600 mt-1">
                You can change your handle again on {nextHandleChangeDate.toLocaleDateString()}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Your profile URL will be /profile/{handle || "handle"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Only lowercase letters, numbers, dots, underscores, and hyphens. Can be changed once every 30 days.
            </p>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={150}
              className="mt-1 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{bio.length}/150 characters</p>
          </div>

          <div>
            <Label htmlFor="link">Link in Bio</Label>
            <Input
              id="link"
              type="url"
              value={linkInBio}
              onChange={(e) => setLinkInBio(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="mt-1"
            />
          </div>
        </div>

        {/* Creator Monetization Settings Section */}
        <div className="pt-6 border-t">
          <h2 className="text-lg font-semibold mb-4">Creator Monetization</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl neuro-inset">
              <div>
                <Label htmlFor="subscription-enabled">Enable Subscriptions</Label>
                <p className="text-sm text-gray-500">Allow fans to subscribe to your content</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={subscriptionEnabled}
                  onChange={(e) => setSubscriptionEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00d4ff]/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00d4ff]"></div>
              </label>
            </div>

            {subscriptionEnabled && (
              <div>
                <Label htmlFor="subscription-price">Monthly Subscription Price (USD)</Label>
                <Input
                  id="subscription-price"
                  type="number"
                  step="0.01"
                  min="4.99"
                  max="49.99"
                  value={subscriptionPrice}
                  onChange={(e) => setSubscriptionPrice(e.target.value)}
                  placeholder="9.99"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Set your monthly subscription price ($4.99 - $49.99). All 18+ content requires subscription.
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="default-ppv-price">Default PPV Price for Auto-Detected NSFW (USD)</Label>
              <Input
                id="default-ppv-price"
                type="number"
                step="0.50"
                min="0.50"
                max="99.99"
                value={defaultPPVPrice}
                onChange={(e) => setDefaultPPVPrice(e.target.value)}
                placeholder="5.00"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                When AI detects NSFW content, it will automatically set this price ($0.50 - $99.99)
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t">
          <h2 className="text-lg font-semibold mb-4">Billing Information</h2>
          <p className="text-sm text-muted-foreground mb-4">Required for tax calculation and invoices.</p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="address1">Address Line 1</Label>
              <Input
                id="address1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="123 Main St"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address2">Address Line 2 (Optional)</Label>
              <Input
                id="address2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Apt 4B"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New York"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="state">State / Province</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="NY"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode">Postal / Zip Code</Label>
                <Input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="10001"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="taxId">Tax ID (Optional)</Label>
              <Input
                id="taxId"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="VAT / GST / TIN"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Used for tax invoices where applicable.</p>
            </div>
          </div>
        </div>

        {/* Notification Settings Section */}
        <div className="pt-6 border-t">
          <NotificationSettings />
        </div>

        {/* Security Section */}
        <div className="pt-6 border-t">
          <h2 className="text-lg font-semibold mb-4">Security</h2>

          <div className="space-y-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-medium">Change Password</h3>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="mt-1"
                />
              </div>

              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}

              <Button type="submit" disabled={passwordStatus === "saving" || !newPassword} className="w-full sm:w-auto">
                {passwordStatus === "saving" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : passwordStatus === "saved" ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Password Updated
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Account Actions */}
        <div className="pt-6 border-t">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
