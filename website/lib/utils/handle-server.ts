/**
 * Server-side Handle Utilities
 * 
 * These functions use the server Supabase client
 * and should be used in API routes and server components.
 */

import { createClient } from "@/lib/supabase/server"

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
    let handle = displayName
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "")
        .replace(/^[._-]+|[._-]+$/g, "")

    if (!handle || handle.length < 3) {
        handle = "user"
    }

    return handle.substring(0, 30)
}

/**
 * Checks if handle is available (server-side)
 */
export async function isHandleAvailableServer(handle: string, currentUserId?: string): Promise<boolean> {
    const supabase = await createClient()

    const query = supabase.from("profiles").select("id").eq("handle", handle)

    if (currentUserId) {
        query.neq("id", currentUserId)
    }

    const { data } = await query.maybeSingle()

    if (data) {
        return false
    }

    // Also check history for reserved handles
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
 * Generates a unique handle by adding numbers if needed (server-side)
 */
export async function generateUniqueHandleServer(baseName: string, currentUserId?: string): Promise<string> {
    let handle = generateHandleFromName(baseName)
    let counter = 1

    while (!(await isHandleAvailableServer(handle, currentUserId))) {
        counter++
        const baseHandle = generateHandleFromName(baseName)
        handle = `${baseHandle}${counter}`

        if (handle.length > 30) {
            handle = `${baseHandle.substring(0, 30 - counter.toString().length)}${counter}`
        }
    }

    return handle
}

/**
 * Checks if user can change handle (30-day limit) - server-side
 */
export async function canChangeHandleServer(userId: string): Promise<{
    canChange: boolean
    nextChangeDate?: Date
    isFirstChange?: boolean
}> {
    const supabase = await createClient()

    const { data: history } = await supabase
        .from("handle_history")
        .select("changed_at")
        .eq("user_id", userId)
        .order("changed_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    // First manual change is always allowed
    if (!history) {
        return { canChange: true, isFirstChange: true }
    }

    // Check 30-day restriction
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
 * Changes user handle with validation and history tracking (server-side)
 */
export async function changeHandleServer(userId: string, newHandle: string): Promise<{
    success: boolean
    error?: string
}> {
    const supabase = await createClient()

    // Validate format
    const formatValidation = validateHandleFormat(newHandle)
    if (!formatValidation.valid) {
        return { success: false, error: formatValidation.error }
    }

    // Check 30-day limit
    const { canChange, nextChangeDate } = await canChangeHandleServer(userId)
    if (!canChange && nextChangeDate) {
        return {
            success: false,
            error: `You can change your handle again on ${nextChangeDate.toLocaleDateString()}`,
        }
    }

    // Check availability
    const available = await isHandleAvailableServer(newHandle, userId)
    if (!available) {
        return { success: false, error: "This handle is already taken or reserved" }
    }

    // Get current handle
    const { data: profile } = await supabase
        .from("profiles")
        .select("handle")
        .eq("id", userId)
        .maybeSingle()

    if (!profile) {
        return { success: false, error: "Profile not found" }
    }

    const oldHandle = profile.handle

    // Don't save if handle is the same
    if (oldHandle === newHandle) {
        return { success: true }
    }

    // Save to history (for redirects and SEO link mass preservation)
    if (oldHandle) {
        await supabase.from("handle_history").insert({
            user_id: userId,
            old_handle: oldHandle,
            new_handle: newHandle,
            changed_at: new Date().toISOString(),
        })
    }

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
