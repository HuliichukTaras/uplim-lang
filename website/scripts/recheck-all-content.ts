/**
 * Script to recheck ALL content in the database for 18+ detection
 *
 * Usage options via API:
 *
 * 1. Check last 7 days (default):
 *    GET /api/cron/recheck-moderation
 *
 * 2. Check ALL posts:
 *    GET /api/cron/recheck-moderation?all=true&limit=100
 *
 * 3. Find and fix false positives (posts incorrectly marked as 18+):
 *    GET /api/cron/recheck-moderation?fix=true&all=true&limit=100
 *
 * 4. Dry run (see what would change without updating):
 *    GET /api/cron/recheck-moderation?fix=true&all=true&dry=true&limit=100
 *
 * Parameters:
 * - all=true    - Check all posts, not just last 7 days
 * - fix=true    - Only check posts currently marked as NSFW (find false positives)
 * - dry=true    - Don't actually update, just report what would change
 * - limit=N     - Number of posts to process (default 50)
 *
 * Run in production:
 * curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
 *      "https://telloos.com/api/cron/recheck-moderation?all=true&fix=true&limit=100"
 */

console.log(`
=====================================
CONTENT MODERATION RECHECK SCRIPT
=====================================

This script rechecks all content using the updated 18+ detection logic.

The new logic only marks content as 18+ if:
- Google Vision returns adult = VERY_LIKELY (explicit nudity)

Previously marked content that is NOT explicit will be UNMARKED.

To run:
1. Go to: https://telloos.com/api/cron/recheck-moderation?all=true&fix=true&dry=true&limit=100
2. Check the results in dry run mode first
3. If looks good, remove &dry=true to apply changes

=====================================
`)
