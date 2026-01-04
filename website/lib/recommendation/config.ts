// Recommendation Engine Configuration

export const RECOMMENDATION_CONFIG = {
  // Signal Weights
  weights: {
    unlock: 30,
    subscribe: 20,
    share: 10,
    comment: 8,
    like: 6,
    unlike: -4,
    watch_full: 5,
    rewatch: 4,
    watch: 3,
    save: 7,
    follow: 15,
    profile_visit: 2,
    search_click: 2,
    scroll_pause: 1,
    scroll_skip: -5,
    report: -20,
    block: -100,
  },

  // Ranking Formula Weights
  ranking: {
    user_signal: 0.55,
    content_similarity: 0.25,
    creator_affinity: 0.15,
    trending: 0.05,
  },

  // Cold Start Settings
  coldStart: {
    minInteractions: 20, // Switch to personalized after 20 interactions
    showTrending: true,
    showPopular: true,
    avoidAdult: true,
  },

  // Queue Settings
  queue: {
    size: 50, // Pre-generate 50 posts
    refreshInterval: 3600000, // 1 hour in ms
    expiryTime: 3600, // 1 hour in seconds
  },

  // Content Filtering
  filtering: {
    maxAdultPostsInFeed: 3, // Max adult posts in 20 items
    minDistanceBetweenAdult: 5, // Min posts between adult content
    blockDuplicateCreators: 3, // Max posts from same creator in 20 items
  },

  // Velocity Scoring (engagement in first N minutes)
  velocity: {
    timeWindow: 60, // minutes
    minEngagement: 10, // min interactions to calculate
  },

  // Watch Time Thresholds
  watchTime: {
    fullWatchThreshold: 0.9, // 90% = full watch
    skipThreshold: 0.1, // Skip if < 10% watched
  },
}

export type SignalEvent =
  | "like"
  | "unlike"
  | "share"
  | "comment"
  | "watch"
  | "watch_full"
  | "rewatch"
  | "scroll_pause"
  | "scroll_skip"
  | "profile_visit"
  | "unlock"
  | "subscribe"
  | "follow"
  | "save"
  | "report"
  | "block"
  | "search_click"
