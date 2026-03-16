import { createClient } from "@/lib/supabase/client"

export interface HandleValidation {
  valid: boolean
  error?: string
}

/**
 * Validates handle format
 * - 3-30 characters
 * - Only lowercase letters, numbers, dots, underscores, hyphens
 * - Cannot start/end with special characters
 */
export function validateHandleFormat(handle: string): HandleValidation {
  if (!handle || handle.length < 3) {
    return { valid: false, error: "Handle must be at least 3 characters" }
  }

  if (handle.length > 30) {
    return { valid: false, error: "Handle must be 30 characters or less" }
  }

  if (!/^[a-z0-9._-]+$/.test(handle)) {
    return { valid: false, error: "Handle can only contain lowercase letters, numbers, dots, underscores, and hyphens" }
  }

  if (/^[._-]|[._-]$/.test(handle)) {
    return { valid: false, error: "Handle cannot start or end with special characters" }
  }

  return { valid: true }
}

/**
 * Generates a clean handle from display name
 */
export function generateHandleFromName(displayName: string): string {
  // Convert to lowercase and remove special characters except ._-
  let handle = displayName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "") // Remove leading/trailing special chars

  // If empty or too short, use 'user'
  if (!handle || handle.length < 3) {
    handle = "user"
  }

  // Limit to 30 characters
  return handle.substring(0, 30)
}

/**
 * Checks if handle is available
 */
export async function isHandleAvailable(handle: string, currentUserId?: string): Promise<boolean> {
  const supabase = createClient()

  const query = supabase.from("profiles").select("id").eq("handle", handle)

  if (currentUserId) {
    query.neq("id", currentUserId)
  }

  const { data } = await query.maybeSingle()

  if (data) {
    return false
  }

  const { data: historyData } = await supabase
    .from("handle_history")
    .select("id")
    .eq("old_handle", handle)
    .maybeSingle()

  if (historyData) {
    return false
  }

  return true
}

/**
 * Generates a unique handle by adding numbers if needed
 */
export async function generateUniqueHandle(baseName: string, currentUserId?: string): Promise<string> {
  let handle = generateHandleFromName(baseName)
  let counter = 1

  while (!(await isHandleAvailable(handle, currentUserId))) {
    counter++
    const baseHandle = generateHandleFromName(baseName)
    handle = `${baseHandle}${counter}`

    // Ensure it doesn't exceed 30 chars
    if (handle.length > 30) {
      handle = `${baseHandle.substring(0, 30 - counter.toString().length)}${counter}`
    }
  }

  return handle
}

/**
 * Server-side generation of unique handle.
 * This is an alias for generateUniqueHandle to be used in server routes.
 */
export const generateUniqueHandleServer = generateUniqueHandle

/**
 * Checks if user can change handle (30-day limit)
 * First manual change is always allowed (auto-generated handles don't count)
 */
export async function canChangeHandle(
  userId: string,
): Promise<{ canChange: boolean; nextChangeDate?: Date; isFirstChange?: boolean }> {
  const supabase = createClient()

  const { data: history } = await supabase
    .from("handle_history")
    .select("changed_at")
    .eq("user_id", userId)
    .order("changed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // If no history exists, this is the first manual change - allow it for free
  if (!history) {
    return { canChange: true, isFirstChange: true }
  }

  // If history exists, check 30-day restriction from last change
  const lastChange = new Date(history.changed_at)
  const thirtyDaysLater = new Date(lastChange)
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

  const now = new Date()
  const canChange = now >= thirtyDaysLater

  return {
    canChange,
    nextChangeDate: canChange ? undefined : thirtyDaysLater,
    isFirstChange: false,
  }
}

/**
 * Changes user handle with validation and history tracking
 */
export async function changeHandle(userId: string, newHandle: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // Validate format
  const formatValidation = validateHandleFormat(newHandle)
  if (!formatValidation.valid) {
    return { success: false, error: formatValidation.error }
  }

  // Check 30-day limit
  const { canChange, nextChangeDate, isFirstChange } = await canChangeHandle(userId)
  if (!canChange && nextChangeDate) {
    return {
      success: false,
      error: `You can change your handle again on ${nextChangeDate.toLocaleDateString()}`,
    }
  }

  // Check availability
  const available = await isHandleAvailable(newHandle, userId)
  if (!available) {
    return { success: false, error: "This handle is already taken" }
  }

  // Get current handle
  const { data: profile } = await supabase.from("profiles").select("handle").eq("id", userId).maybeSingle()

  if (!profile) {
    return { success: false, error: "Profile not found" }
  }

  const oldHandle = profile.handle

  // Save to history
  await supabase.from("handle_history").insert({
    user_id: userId,
    old_handle: oldHandle,
    new_handle: newHandle,
    changed_at: new Date().toISOString(), // Ensure changed_at is recorded
  })

  // Update profile
  const { error } = await supabase
    .from("profiles")
    .update({
      handle: newHandle,
      handle_updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
