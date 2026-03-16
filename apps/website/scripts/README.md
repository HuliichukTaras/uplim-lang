# Telloos Database Scripts

This folder contains SQL migration scripts for the Telloos platform. Scripts are executed in numerical order.

## Script Execution Order

1. **001_create_users_and_profiles.sql** - Core user profiles table with RLS policies
2. **002_create_posts_and_interactions.sql** - Posts, likes, comments, follows with triggers
3. **003_create_payments_tables.sql** - Subscriptions, transactions, creator settings
4. **004_create_storage_bucket.sql** - Supabase storage bucket for post media
5. **005_add_curiosity_unlocks.sql** - Curiosity unlock feature + blur/age verification
6. **006_add_view_tracking_function.sql** - RPC function for atomic view counting
7. **006_enhance_profiles.sql** - Additional profile fields (handle, link_in_bio, country)
8. **007_create_wallet_system.sql** - Complete wallet system with transactions
9. **008_add_payment_and_verification.sql** - Payment card verification + public RLS policies
10. **009_add_video_support.sql** - Video URL support for posts
11. **010_add_moderation_fields.sql** - AI moderation metadata and status
12. **011_enhance_google_oauth.sql** - Google OAuth integration fields

## Database Schema Overview

### Core Tables
- **profiles** - User profiles (username, bio, avatar, creator status)
- **posts** - Content posts (media, captions, pricing, NSFW flags)
- **likes** - Post likes with automatic count triggers
- **comments** - Post comments with automatic count triggers
- **follows** - User follow relationships

### Monetization
- **wallets** - User wallet balances (available, pending, earned, withdrawn)
- **wallet_transactions** - Immutable transaction ledger
- **payout_requests** - Withdrawal requests
- **transactions** - Stripe payment records
- **subscriptions** - Creator subscriptions
- **post_unlocks** - Pay-per-post unlocks
- **curiosity_unlocks** - "Like 3 to unlock" feature

### Features
- **creator_settings** - Stripe Connect settings for creators
- **moderation_meta** - AI moderation results (Google Vision API)

## Key Functions

- `handle_new_user()` - Auto-creates profile on signup
- `increment_post_views(post_id)` - Atomic view counter
- `record_wallet_transaction()` - Wallet transaction ledger
- `increment_likes_count()` / `decrement_likes_count()` - Auto-update post stats
- `increment_comments_count()` / `decrement_comments_count()` - Auto-update post stats

## RLS Policies

All tables have Row Level Security enabled:
- **Public read** - Posts, profiles, likes, comments (for discovery)
- **Authenticated write** - Users can only modify their own data
- **Private data** - Wallets, transactions visible only to owner

## Supabase Integration

All scripts are synchronized with Supabase and actively used in:
- Authentication (Google OAuth, email/password)
- Storage (post media uploads)
- Real-time subscriptions (likes, comments)
- RPC functions (views, wallet transactions)
- Stripe webhooks (payments, subscriptions)

## Running Scripts

Scripts can be executed via:
1. Supabase Dashboard SQL Editor
2. v0 Code Project execution
3. Supabase CLI: `supabase db push`

**Note:** Scripts use `IF NOT EXISTS` and `DROP IF EXISTS` to be idempotent and safe to re-run.
