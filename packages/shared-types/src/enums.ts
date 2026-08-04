export enum NodeType {
  // ── Generic infrastructure (used as fallbacks / in shared slots) ──────────
  CLIENT = 'CLIENT',
  API_GATEWAY = 'API_GATEWAY',
  LOAD_BALANCER = 'LOAD_BALANCER',
  SERVICE = 'SERVICE',
  CACHE = 'CACHE',
  DATABASE = 'DATABASE',
  QUEUE = 'QUEUE',
  CDN = 'CDN',
  OBJECT_STORAGE = 'OBJECT_STORAGE',
  AUTH_SERVICE = 'AUTH_SERVICE',
  SEARCH_SERVICE = 'SEARCH_SERVICE',

  // ── Typed storage ─────────────────────────────────────────────────────────
  RELATIONAL_DB = 'RELATIONAL_DB',
  NON_RELATIONAL_DB = 'NON_RELATIONAL_DB',
  REDIS_CACHE = 'REDIS_CACHE',

  // ── URL Shortener ─────────────────────────────────────────────────────────
  URL_WRITE_SERVICE = 'URL_WRITE_SERVICE',
  URL_READ_SERVICE = 'URL_READ_SERVICE',
  ID_GENERATOR = 'ID_GENERATOR',
  ANALYTICS_SERVICE = 'ANALYTICS_SERVICE',

  // ── Rate Limiter ──────────────────────────────────────────────────────────
  RATE_LIMITER_SERVICE = 'RATE_LIMITER_SERVICE',
  APP_SERVICE = 'APP_SERVICE',

  // ── Twitter Feed ──────────────────────────────────────────────────────────
  POST_SERVICE = 'POST_SERVICE',
  FEED_SERVICE = 'FEED_SERVICE',
  USER_SERVICE = 'USER_SERVICE',
  MEDIA_SERVICE = 'MEDIA_SERVICE',
  TIMELINE_WORKER = 'TIMELINE_WORKER',

  // ── YouTube ───────────────────────────────────────────────────────────────
  UPLOAD_SERVICE = 'UPLOAD_SERVICE',
  STREAMING_SERVICE = 'STREAMING_SERVICE',
  METADATA_SERVICE = 'METADATA_SERVICE',
  RECOMMENDATION_SERVICE = 'RECOMMENDATION_SERVICE',
  TRANSCODING_SERVICE = 'TRANSCODING_SERVICE',
  THUMBNAIL_SERVICE = 'THUMBNAIL_SERVICE',

  // ── Uber ──────────────────────────────────────────────────────────────────
  LOCATION_SERVICE = 'LOCATION_SERVICE',
  MATCHING_SERVICE = 'MATCHING_SERVICE',
  TRIP_SERVICE = 'TRIP_SERVICE',
  PAYMENT_SERVICE = 'PAYMENT_SERVICE',
  NOTIFICATION_SERVICE = 'NOTIFICATION_SERVICE',

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  CHAT_SERVICE = 'CHAT_SERVICE',
  PRESENCE_SERVICE = 'PRESENCE_SERVICE',
}

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export enum PromptDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}
