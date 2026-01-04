import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * Handle Redirect API
 * 
 * Checks if an old handle exists in history and redirects to the new profile.
 * This preserves SEO link mass when users change handles.
 * 
 * Usage: Called by middleware or profile page when handle not found
 */
export async function GET(request: Request) {
    try {
        const url = new URL(request.url)
        const oldHandle = url.searchParams.get("handle")

        if (!oldHandle) {
            return NextResponse.json({ error: "Handle is required" }, { status: 400 })
        }

        const supabase = await createClient()

        // Check if this handle exists in history
        const { data: history } = await supabase
            .from("handle_history")
            .select(`
        new_handle,
        user_id,
        profiles!handle_history_user_id_fkey (
          handle
        )
      `)
            .eq("old_handle", oldHandle)
            .order("changed_at", { ascending: false })
            .limit(1)
            .maybeSingle()

        if (!history) {
            return NextResponse.json({
                found: false,
                message: "No redirect found for this handle"
            }, { status: 404 })
        }

        // Get the user's current handle
        const profile = history.profiles as any
        const currentHandle = profile?.handle || history.new_handle

        return NextResponse.json({
            found: true,
            oldHandle,
            currentHandle,
            redirectUrl: `/profile/${currentHandle}`,
        })
    } catch (error) {
        console.error("Error checking handle redirect:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
