/**
 * Script to manually trigger content re-moderation
 *
 * Usage examples:
 *
 * 1. Dry run - check last 50 posts without making changes:
 *    npx tsx scripts/run-recheck-moderation.ts
 *
 * 2. Fix false positives - recheck posts marked as NSFW:
 *    npx tsx scripts/run-recheck-moderation.ts --fix
 *
 * 3. Check all posts (not just last 7 days):
 *    npx tsx scripts/run-recheck-moderation.ts --all
 *
 * 4. Apply changes (not dry run):
 *    npx tsx scripts/run-recheck-moderation.ts --apply
 *
 * 5. Full recheck with fixes applied:
 *    npx tsx scripts/run-recheck-moderation.ts --all --fix --apply --limit=100
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://fantikx.com"
const CRON_SECRET = process.env.CRON_SECRET

async function runRecheck() {
  const args = process.argv.slice(2)

  const params = new URLSearchParams()

  // Parse arguments
  if (args.includes("--all")) {
    params.set("all", "true")
  }

  if (args.includes("--fix")) {
    params.set("fix", "true")
  }

  if (!args.includes("--apply")) {
    params.set("dry", "true") // Default to dry run
  }

  const limitArg = args.find((a) => a.startsWith("--limit="))
  if (limitArg) {
    params.set("limit", limitArg.split("=")[1])
  } else {
    params.set("limit", "50")
  }

  const url = `${BASE_URL}/api/cron/recheck-moderation?${params.toString()}`

  console.log("\n🔍 Starting content re-moderation...")
  console.log("URL:", url)
  console.log("Options:", Object.fromEntries(params.entries()))
  console.log("")

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (CRON_SECRET) {
      headers["Authorization"] = `Bearer ${CRON_SECRET}`
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.error("❌ Error:", response.status, response.statusText)
      const text = await response.text()
      console.error(text)
      return
    }

    const result = await response.json()

    console.log("✅ Re-moderation complete!\n")
    console.log("📊 Summary:")
    console.log(`   Scanned: ${result.scanned} posts`)
    console.log(`   Updated: ${result.updated} posts`)
    console.log(`   False positives fixed: ${result.falsePositivesFixed}`)
    console.log(`   New NSFW detected: ${result.newNsfwDetected}`)
    console.log(`   Errors: ${result.errors}`)

    if (result.dryRun) {
      console.log("\n⚠️  DRY RUN - no changes were made")
      console.log("   Run with --apply to make changes")
    }

    if (result.details && result.details.length > 0) {
      console.log("\n📝 Details:")
      for (const detail of result.details) {
        const emoji = detail.action === "false_positive_fixed" ? "🔓" : detail.action === "nsfw_detected" ? "🔞" : "❗"
        console.log(`   ${emoji} Post ${detail.id}: ${detail.action}`)
        if (detail.confidence) {
          console.log(`      Confidence: ${(detail.confidence * 100).toFixed(1)}%`)
        }
      }
    }
  } catch (error) {
    console.error("❌ Failed to run re-moderation:", error)
  }
}

runRecheck()
