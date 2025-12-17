import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables. Make sure .env.local exists and is loaded.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log("Checking post data...")

  // Try to get the most recent post instead of a hardcoded ID
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) {
    console.error("Error fetching posts:", error)
    return
  }

  if (!posts || posts.length === 0) {
    console.log("No posts found in the database.")
    return
  }

  const post = posts[0]
  console.log("Most recent post found:")
  console.log(JSON.stringify(post, null, 2))

  // Check moderation status specific fields
  console.log("\nModeration Status:")
  console.log(`ID: ${post.id}`)
  console.log(`NSFW: ${post.is_nsfw}`)
  console.log(`Adult Confidence: ${post.adult_confidence}`)
  console.log(`Blur Level: ${post.blur_level}`)
}

main().catch(console.error)
