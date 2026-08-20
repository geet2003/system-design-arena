export interface ReferenceArchitecture {
  id: string;
  label: string;
  keywords: string[];
  keyComponents: string[];
  criticalPatterns: string[];
  commonMistakes: string[];
}

export const REFERENCE_ARCHITECTURES: ReferenceArchitecture[] = [
  {
    id: 'payment-processor',
    label: 'Payment Processor',
    keywords: ['stripe', 'payment', 'paypal', 'venmo', 'upi', 'fintech'],
    keyComponents: [
      'idempotency layer',
      'fraud detection service',
      'async settlement queue',
      'payment state machine (PENDING → CAPTURED → SETTLED)',
      'audit log',
    ],
    criticalPatterns: [
      'exactly-once delivery for payment events',
      'saga vs two-phase commit for distributed transactions',
      'PCI compliance boundary isolation',
      'retry logic with exponential backoff',
    ],
    commonMistakes: [
      'no idempotency key on payment API',
      'fraud service in the synchronous critical path (should be async)',
      'no payment state machine — missing PENDING/CAPTURED/SETTLED transitions',
      'missing database sharding strategy for payments table at scale',
    ],
  },
  {
    id: 'chat-messaging',
    label: 'Chat / Messaging System',
    keywords: ['whatsapp', 'slack', 'discord', 'messenger', 'chat', 'messaging'],
    keyComponents: [
      'websocket connection layer',
      'message fan-out service',
      'presence service',
      'append-only message store',
      'push notification gateway',
      'offline message queue',
    ],
    criticalPatterns: [
      'online vs offline delivery paths',
      'message ordering guarantees per conversation',
      'fan-out on write vs fan-out on read for group messages',
      'at-least-once delivery with deduplication',
    ],
    commonMistakes: [
      'no offline message queue — messages lost if recipient is offline',
      'presence handled by DB polling instead of heartbeat + TTL',
      'no cursor-based pagination for message history',
      'fan-out on write to very large groups causes write amplification',
    ],
  },
  {
    id: 'video-streaming',
    label: 'Video Streaming Platform',
    keywords: ['netflix', 'tiktok', 'youtube', 'twitch', 'video', 'streaming', 'instagram stories'],
    keyComponents: [
      'video ingestion pipeline',
      'transcoding service (multi-bitrate)',
      'CDN for video delivery',
      'adaptive bitrate (ABR) logic',
      'metadata service',
      'recommendation engine',
    ],
    criticalPatterns: [
      'adaptive bitrate streaming (HLS / DASH)',
      'chunked upload + resumable uploads for large files',
      'CDN cache invalidation on content update',
      'separate hot vs cold storage tiers',
    ],
    commonMistakes: [
      'serving video directly from origin — no CDN',
      'no transcoding to multiple resolutions',
      'metadata and video stored in the same service',
      'no pre-warming CDN for popular content',
    ],
  },
  {
    id: 'web-search',
    label: 'Web Search Engine',
    keywords: ['google search', 'web crawler', 'indexer', 'search engine'],
    keyComponents: [
      'distributed web crawler',
      'URL frontier (priority queue)',
      'inverted index',
      'document store',
      'ranking service (PageRank / relevance)',
      'query parsing + spell correction',
    ],
    criticalPatterns: [
      'crawl politeness (robots.txt, rate limiting per domain)',
      'inverted index sharding by term vs by document',
      'incremental index updates vs full rebuilds',
      'query expansion and stemming',
    ],
    commonMistakes: [
      'no URL deduplication in crawler',
      'single monolithic index — no sharding strategy',
      'crawler ignores robots.txt',
      'no freshness policy for re-crawling updated content',
    ],
  },
  {
    id: 'local-search',
    label: 'Proximity / Local Search',
    keywords: ['yelp', 'airbnb', 'proximity', 'nearby', 'geosearch', 'location'],
    keyComponents: [
      'geospatial index (geohash or quadtree)',
      'business/listing service',
      'search service with radius filtering',
      'review and rating service',
      'CDN for static assets',
    ],
    criticalPatterns: [
      'geohash vs quadtree for spatial indexing',
      'read-heavy workload — caching strategy for popular areas',
      'ranking by distance + rating + relevance',
      'handling uneven data distribution (dense cities vs sparse areas)',
    ],
    commonMistakes: [
      'no spatial index — full table scan for proximity queries',
      'reviews stored in the same table as listings',
      'no caching for hot areas (e.g. NYC downtown)',
      'distance calculation done in application layer without DB index',
    ],
  },
  {
    id: 'social-feed',
    label: 'Social News Feed',
    keywords: ['twitter', 'instagram feed', 'linkedin feed', 'facebook feed', 'social feed', 'reddit', 'x feed'],
    keyComponents: [
      'post / tweet service',
      'follow graph service',
      'feed generation service',
      'fan-out worker',
      'timeline cache (Redis)',
      'notification service',
    ],
    criticalPatterns: [
      'fan-out on write (push) vs fan-out on read (pull)',
      'hybrid approach for celebrities (high follower count)',
      'timeline pagination with cursor-based approach',
      'eventual consistency acceptable for feed freshness',
    ],
    commonMistakes: [
      'fan-out on write for celebrities causes write amplification (millions of writes per post)',
      'no cache for user timelines — DB hit on every feed load',
      'offset-based pagination breaks when new posts arrive',
      'no separate handling for inactive users (wasted fan-out writes)',
    ],
  },
  {
    id: 'file-storage',
    label: 'File / Cloud Storage',
    keywords: ['dropbox', 'google drive', 'google photos', 's3', 'object storage', 'file storage'],
    keyComponents: [
      'metadata service',
      'block/chunk storage service',
      'sync service',
      'deduplication layer (content-addressable storage)',
      'versioning store',
      'CDN for file delivery',
    ],
    criticalPatterns: [
      'chunked upload with resumable support',
      'client-side deduplication using content hash',
      'conflict resolution for concurrent edits (last-write-wins vs CRDT)',
      'delta sync — only upload changed chunks',
    ],
    commonMistakes: [
      'uploading entire file on every change — no chunking or delta sync',
      'no deduplication — same file stored multiple times',
      'no versioning — cannot recover from accidental deletion',
      'metadata and file bytes stored in same service',
    ],
  },
  {
    id: 'ride-sharing',
    label: 'Ride Sharing / Delivery',
    keywords: ['uber', 'doordash', 'swiggy', 'zomato', 'lyft', 'ride', 'delivery'],
    keyComponents: [
      'location service (driver/rider real-time positions)',
      'matching service',
      'trip/order management service',
      'pricing service (surge)',
      'notification service',
      'geospatial index for nearby drivers',
    ],
    criticalPatterns: [
      'high-frequency location updates — write-heavy workload',
      'geospatial indexing for nearest-driver queries',
      'strong consistency required for trip assignment (no double-booking)',
      'surge pricing based on supply/demand ratio',
    ],
    commonMistakes: [
      'storing every driver location update in a relational DB — should use Redis + periodic flush',
      'no geospatial index for driver lookup',
      'matching service not idempotent — same driver assigned to two riders',
      'no rate limiting on location update endpoint',
    ],
  },
  {
    id: 'twitter-search',
    label: 'Real-Time Search',
    keywords: ['twitter search', 'real-time search', 'typeahead', 'autocomplete'],
    keyComponents: [
      'ingestion pipeline (Kafka)',
      'real-time indexer',
      'inverted index with recency scoring',
      'trie / prefix store for typeahead',
      'query service',
    ],
    criticalPatterns: [
      'real-time index updates vs batch — trade-off between freshness and cost',
      'recency-biased ranking (newer tweets ranked higher for trending)',
      'separate index for trending vs historical search',
      'typeahead trie updated asynchronously',
    ],
    commonMistakes: [
      'batch indexing only — search results stale by minutes',
      'no recency scoring — old tweets dominate results',
      'trie updated synchronously on every tweet — write bottleneck',
      'no separate handling for trending topics',
    ],
  },
  {
    id: 'distributed-cache',
    label: 'Distributed Cache / Rate Limiter',
    keywords: ['rate limiter', 'cache', 'cdn cache', 'distributed cache'],
    keyComponents: [
      'consistent hashing for key distribution',
      'eviction policy (LRU / LFU)',
      'replication for high availability',
      'TTL management',
      'token bucket / sliding window counter',
    ],
    criticalPatterns: [
      'consistent hashing minimises key remapping on node addition/removal',
      'write-through vs write-back vs write-around cache strategies',
      'thundering herd on cache miss — mutex lock or probabilistic early expiry',
      'distributed rate limiting requires atomic increment (Redis INCR + EXPIRE)',
    ],
    commonMistakes: [
      'no consistent hashing — adding a node reshuffles all keys',
      'no TTL — cache grows unboundedly',
      'cache stampede on cold start with no protection',
      'rate limiter state stored in a single node — SPOF',
    ],
  },
  {
    id: 'notification-service',
    label: 'Notification Service',
    keywords: ['notification', 'push notification', 'email service', 'alert system'],
    keyComponents: [
      'event ingestion (Kafka / SQS)',
      'user preference service (opt-in/out)',
      'template rendering service',
      'delivery adapters (APNs, FCM, SMTP, SMS)',
      'retry + dead-letter queue',
    ],
    criticalPatterns: [
      'at-least-once delivery with idempotency on delivery adapters',
      'priority queues — critical alerts vs marketing',
      'rate limiting per user to prevent notification spam',
      'delivery receipt tracking',
    ],
    commonMistakes: [
      'sending notifications synchronously in the request path',
      'no retry logic — delivery failures silently dropped',
      'no user preference check — users cannot opt out',
      'no deduplication — same notification sent twice on retry',
    ],
  },
  {
    id: 'url-shortener',
    label: 'URL Shortener',
    keywords: ['url shortener', 'bitly', 'tinyurl', 'short link'],
    keyComponents: [
      'ID generation service (base62 encoding)',
      'redirect service',
      'analytics pipeline',
      'cache (hot URLs)',
      'key-value store',
    ],
    criticalPatterns: [
      'collision-free ID generation at scale (counter vs hash)',
      'read-heavy — cache the most accessed short URLs',
      'redirect latency is critical — cache should be in-memory',
      'custom aliases require uniqueness check before write',
    ],
    commonMistakes: [
      'using random hash without collision detection',
      'no cache — DB hit on every redirect',
      'no expiry mechanism for short URLs',
      'analytics written synchronously — slows down redirect',
    ],
  },
  {
    id: 'leaderboard',
    label: 'Gaming Leaderboard / Realtime Ranking',
    keywords: ['leaderboard', 'chess.com', 'game', 'ranking', 'score', 'realtime ranking', 'sports score'],
    keyComponents: [
      'score ingestion service',
      'Redis sorted set for real-time ranking',
      'persistent score store (DB)',
      'leaderboard query service (top-N, rank of user)',
      'websocket / SSE for live updates',
    ],
    criticalPatterns: [
      'Redis ZADD / ZRANK for O(log N) score updates and rank queries',
      'global vs partitioned leaderboards (by region, time window)',
      'write-heavy during game events — batch updates vs per-event',
      'eventual consistency acceptable — leaderboard can lag by seconds',
    ],
    commonMistakes: [
      'computing rank with SELECT COUNT(*) WHERE score > X — O(N) query',
      'no partitioning — single global leaderboard does not scale',
      'no TTL for time-windowed leaderboards (daily/weekly)',
      'pushing live updates via polling instead of websockets',
    ],
  },
  {
    id: 'job-scheduler',
    label: 'Distributed Job Scheduler',
    keywords: ['job scheduler', 'task scheduler', 'cron', 'distributed scheduler', 'worker queue'],
    keyComponents: [
      'job store (DB with scheduled_at index)',
      'scheduler poller / trigger service',
      'worker pool',
      'job queue (Kafka / SQS)',
      'idempotency + exactly-once execution guard',
    ],
    criticalPatterns: [
      'at-least-once vs exactly-once execution trade-offs',
      'leader election to avoid duplicate job triggers across scheduler instances',
      'job retry with backoff + dead-letter queue',
      'long-running jobs need heartbeat to detect stuck workers',
    ],
    commonMistakes: [
      'multiple scheduler instances all trigger the same job — no leader election',
      'no idempotency key on jobs — duplicate execution on retry',
      'stuck jobs never time out — no heartbeat mechanism',
      'no dead-letter queue — failed jobs silently lost',
    ],
  },
  {
    id: 'web-crawler',
    label: 'Web Crawler',
    keywords: ['web crawler', 'crawler', 'scraper', 'indexer', 'spider'],
    keyComponents: [
      'URL frontier (priority queue)',
      'DNS resolver cache',
      'fetcher worker pool',
      'content parser',
      'URL deduplication store (bloom filter)',
      'politeness scheduler (per-domain rate limit)',
    ],
    criticalPatterns: [
      'bloom filter for visited URL deduplication at scale',
      'politeness — respect robots.txt and per-domain crawl delay',
      'priority-based crawling (PageRank estimate, freshness)',
      'distributed workers with consistent URL assignment to avoid duplicate fetches',
    ],
    commonMistakes: [
      'no URL deduplication — same page crawled multiple times',
      'ignoring robots.txt',
      'no per-domain rate limiting — hammering individual servers',
      'storing full HTML in DB without compression',
    ],
  },
];

export function retrieveReference(question: string): ReferenceArchitecture | null {
  const q = question.toLowerCase();
  return (
    REFERENCE_ARCHITECTURES.find((r) => r.keywords.some((kw) => q.includes(kw))) ?? null
  );
}
