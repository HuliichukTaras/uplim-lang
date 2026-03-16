# Global 18+ Content Detection System

## Overview
Telloos uses Google Vision SafeSearch API for automatic detection of sensitive content. This system is global, consistent, and mandatory across all platform areas.

## Detection Rules (MANDATORY)

### Content Marked as 18+ ONLY if:
- **adult** = LIKELY or VERY_LIKELY (≥0.7 score)
- **racy** = LIKELY or VERY_LIKELY (≥0.7 score)  
- **Explicit nudity** is present

### Content NOT Marked as 18+:
- Swimwear
- Lingerie
- Fitness/workout photos
- Glamour photography
- Anything allowed on Instagram

## Blur System (MANDATORY)

### Visual Treatment:
- **Opacity**: 30% (black overlay)
- **Blur**: blur-lg (medium blur showing silhouettes)
- **Scale**: 105% (slight zoom for edge softening)
- **Style**: Frosted glass effect with visible silhouettes

### Applied Globally On:
- Feed
- Profile grid
- Explore/Discover
- Reels
- Post detail view
- Search results
- Hashtag pages

## Unlock System (DEFAULT, NOT EDITABLE)

### Three Unlock Methods:

#### A) Quest Unlock (FREE)
User must complete ALL:
1. Like the post
2. Share the post
3. Be subscribed to creator (free or paid)

#### B) Micro-transaction
- **Fixed Price**: €1.50
- **Non-negotiable** by creators
- Instant unlock after payment

#### C) Subscription
- Monthly subscription to creator
- Unlocks ALL content from that creator
- Includes all 18+ posts

### Important Notes:
- **All 3 methods** are available for every 18+ post
- Creators **cannot** disable or change these options
- Prices are **fixed** and consistent everywhere
- Quest requirements are **universal**

## Consistency Requirements (MANDATORY)

### Same Everywhere:
✅ Blur style (30% opacity, blur-lg, scale-105)  
✅ Price (€1.50)  
✅ Unlock logic (Quest + Pay + Sub)  
✅ Visual treatment (frosted glass)  
✅ Detection threshold (≥0.7 = LIKELY)

### Never Different:
❌ No per-profile blur settings  
❌ No custom prices for 18+ content  
❌ No disabling quest unlock  
❌ No different behavior between pages

## Periodic Rechecking (MANDATORY)

### Background Job Schedule:
- **Frequency**: Every 12-24 hours
- **Scope**: All content from last 7 days
- **Purpose**: Revalidate borderline content
- **Action**: Update flags if threshold crossed

### What Gets Rechecked:
- Posts marked as borderline (confidence 0.5-0.7)
- Recently uploaded content (< 7 days)
- Content with user reports

### Script Location:
`scripts/recheck-content-moderation.ts`

## Technical Implementation

### Moderation Service:
- **Provider**: Google Cloud Vision API
- **Endpoint**: SafeSearch Detection
- **Threshold**: 0.7 (LIKELY or higher)

### Database Fields:
```typescript
posts {
  is_nsfw: boolean
  is_adult: boolean
  adult_confidence: float
  blur_required: boolean
  blur_level: integer (always 3 for 18+)
  ppv_price_cents: integer (always 150 for 18+)
  unlock_via_ppv: boolean
  unlock_via_quest: boolean
  unlock_via_subscription: boolean
  unlock_methods: string[] // ['microtransaction', 'subscription', 'quest']
}
```

### UI Components:
- `lib/moderation.ts` - Detection logic
- `components/feed/post-card.tsx` - Feed blur
- `components/profile/modern-profile-client.tsx` - Profile grid blur
- `components/unlock/combined-unlock-dialog.tsx` - Unlock UI

## User Experience

### What Users See:
1. **Blurred content** with visible silhouettes
2. **"Sensitive Content (18+)"** label
3. **Three unlock options** clearly displayed
4. **Consistent pricing** (€1.50) everywhere
5. **Quest progress** (Like + Share indicators)

### What Creators Control:
- ❌ Cannot disable 18+ detection
- ❌ Cannot change unlock prices
- ❌ Cannot remove quest option
- ✅ Can set subscription price
- ✅ Can see earnings from unlocks

## Compliance

### Legal Requirements:
- Age verification for 18+ content viewing
- Clear labeling of sensitive content
- User consent before viewing
- Parental control compatibility

### Platform Rules:
- No underage content (auto-reject)
- No extreme violence (auto-reject)
- No weapons (auto-reject)
- Instagram-safe content = NOT marked as 18+

## Support & Maintenance

### Monitoring:
- Daily check of detection accuracy
- User report review for false negatives
- API status monitoring
- Recheck job logs

### Adjustments:
- Threshold tuning based on feedback
- Blur opacity fine-tuning
- Quest requirements review
- Price adjustments (platform-wide only)

---

**Last Updated**: January 2025  
**System Version**: 2.0  
**Detection Model**: Google Vision SafeSearch  
**Default Price**: €1.50 (fixed)
