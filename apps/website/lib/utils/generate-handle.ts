export function generateHandleFromEmail(email: string): string {
  // Extract username part before @
  const username = email.split("@")[0]

  // Remove special characters and convert to lowercase
  const cleanHandle = username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20) // Limit length

  return cleanHandle || "user"
}

export function generateRandomHandle(): string {
  const randomNum = Math.floor(Math.random() * 10000)
  return `user${randomNum}`
}

export async function generateUniqueHandle(supabase: any, baseHandle: string): Promise<string> {
  let handle = baseHandle
  let counter = 1

  // Check if handle exists
  while (true) {
    const { data, error } = await supabase.from("profiles").select("id").eq("handle", handle).maybeSingle()

    if (error) {
      console.error("Error checking handle:", error)
      // If error, just return the handle and let the database handle it
      return handle
    }

    if (!data) {
      // Handle is available
      return handle
    }

    // Handle exists, try with counter
    handle = `${baseHandle}${counter}`
    counter++

    // Safety limit
    if (counter > 100) {
      // Generate random handle as fallback
      handle = `${baseHandle}${Math.floor(Math.random() * 10000)}`
      break
    }
  }

  return handle
}
