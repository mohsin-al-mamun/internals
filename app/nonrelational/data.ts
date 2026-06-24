export const NREL_REDIS_COMPOSE_YML = `services:
  redis:
    image: redis:7-alpine
    container_name: db-playground-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  redis_data:`;

export const NREL_MONGO_COMPOSE_YML = `services:
  mongo:
    image: mongo:7
    container_name: db-playground-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  mongo_data:`;

export const NREL_REDIS_COMMANDS = `docker compose up -d
redis-cli -h localhost
docker compose down`;

export const NREL_MONGO_COMMANDS = `docker compose up -d
mongosh "mongodb://localhost:27017"
docker compose down`;

export interface Tier {
  id: string;
  order: number;
  name: string;
  label: string;
  locked: boolean;
}

export interface NrelTopic {
  id: string;
  tier: string;
  title: string;
  html: string;
  playground?: { type: 'kv' | 'doc'; preset: string };
}

export const NREL_TIERS: Tier[] = [
  { id: 't1', order: 1, name: 'TIER 1', label: 'Surface',   locked: false },
  { id: 't2', order: 2, name: 'TIER 2', label: 'Midground', locked: false },
  { id: 't3', order: 3, name: 'TIER 3', label: 'Bedrock',   locked: false },
];

export const NREL_TOPICS: NrelTopic[] = [
  // ── SURFACE ──────────────────────────────────────────────────
  {
    id: 'nrel-1', tier: 't1',
    title: 'What "NoSQL" actually means',
    html: `<p>"NoSQL" is an umbrella term for "not a table-with-fixed-columns database." It doesn't describe one thing — it covers several different data models, the two you'll meet constantly being:</p>
<ul>
  <li><strong>Key-value</strong> (Redis) — every piece of data is just a key pointing to a value. No schema, no relationships.</li>
  <li><strong>Document</strong> (MongoDB) — every piece of data is a JSON-like blob. Related data is usually nested inside one document instead of split across tables.</li>
</ul>
<p>The mental shift coming from SQL: there's no <em>database-enforced</em> schema. That doesn't mean structure doesn't exist — it means structure is enforced at the application level instead. In practice, every document in a <code>users</code> collection will have <code>email</code>, <code>name</code>, and <code>createdAt</code>. MongoDB won't reject a document that's missing <code>email</code>, but your application code, ORM (Mongoose), or validation layer (Zod) will. Schema-flexible, not structure-free.</p>
<p>Joining across documents is either avoided by embedding or handled explicitly with <code>$lookup</code>. The database doesn't protect you from inconsistent shapes — your application layer does.</p>
<div class="callout">
  <div class="callout-label">Why this matters</div>
  Relational and non-relational aren't "old vs new" — they're different tools for different access patterns. The last topic in this tier covers exactly when to reach for each.
</div>`,
    playground: { type: 'kv', preset: `SET hello "this is a key-value store"\nGET hello` },
  },
  {
    id: 'nrel-2', tier: 't1',
    title: 'Key-value model: Redis basics',
    html: `<p>Redis stores everything as a <strong>key</strong> mapped to a <strong>value</strong>, kept in memory for speed. The console below simulates the core commands so you can get the syntax under your fingers:</p>
<pre class="codeblock">SET key value     → store a value
GET key           → read it back
DEL key           → remove it
EXPIRE key 60     → auto-delete after 60 seconds</pre>
<p>There's no concept of "table" or "schema" — you decide what a key means by convention, often with colons as namespacing: <code>user:42:name</code>, <code>session:abc123</code>.</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  This is a simplified simulation, not a real Redis instance — enough to build the muscle memory for the commands before you install Redis for real.
</div>`,
    playground: { type: 'kv', preset: `SET session:abc123 "logged_in"\nEXPIRE session:abc123 60\nGET session:abc123` },
  },
  {
    id: 'nrel-2b', tier: 't1',
    title: 'More core Redis commands',
    html: `<p>Beyond <code>SET</code>/<code>GET</code>/<code>DEL</code>/<code>EXPIRE</code>, a handful of commands cover the majority of real Redis usage:</p>
<pre class="codeblock">INCR pageviews          → increments by 1, creates at 0 if missing
INCRBY pageviews 10     → increments by a specific amount
DECR stock:42
EXISTS session:abc123   → 1 or 0, without fetching the value
KEYS user:*             → list all keys matching a pattern</pre>
<p><code>INCR</code> is genuinely one of the most-used Redis commands in production — it's atomic, meaning two concurrent requests incrementing the same counter can never race each other and lose an update. That makes it the natural choice for view counters, rate limiters, and like counts.</p>
<p><code>KEYS</code> is convenient for exploring data by hand, but real production code avoids it on a large database — it scans every key, which can block the server. <code>SCAN</code> (a paginated version) is the production-safe equivalent; this simulator's <code>KEYS</code> is fine for learning at this scale.</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  Increment a counter a few times, then check it exists, then list every key matching a pattern.
</div>`,
    playground: { type: 'kv', preset: `INCR pageviews\nINCR pageviews\nINCRBY pageviews 10\nEXISTS pageviews\nKEYS page*` },
  },
  {
    id: 'nrel-3', tier: 't1',
    title: 'Document model: MongoDB basics',
    html: `<p>MongoDB stores <strong>documents</strong> — JSON-like objects — grouped into <strong>collections</strong> (the rough equivalent of a table, except MongoDB won't reject a document for having a different shape than its neighbors).</p>
<p>Three patterns for structuring data inside a document:</p>
<pre class="codeblock">// 1. Embedded object — a nested object, one-to-one relationship
{
  name: "Tomato",
  location: { city: "Austin", zone: "8b" }
}

// 2. Array of scalars — simple values, one-to-many
{
  name: "Tomato",
  tags: ["full sun", "edible", "annual"]
}

// 3. Array of embedded documents — one-to-many with structure
{
  name: "Tomato",
  varieties: [
    { name: "Roma",         available: true,  stock: 24 },
    { name: "Cherry Tomato", available: false, stock: 0  }
  ]
}</pre>
<p>Arrays of embedded documents are powerful — you can query and filter on fields inside them (<code>{ "varieties.available": true }</code>). The trap: if the array grows unboundedly (every user event appended to a single document), you'll eventually hit MongoDB's <strong>16 MB document size limit</strong>. For continuously growing data (comments, activity logs), use a separate collection with a reference instead.</p>
<pre class="codeblock">db.plants.insertOne({
  name: "Cherry Tomato",
  sunlight: "full sun",
  varieties: ["Roma", "San Marzano"]   ← nested, not a separate table
})
db.plants.find({ sunlight: "full sun" })</pre>
<div class="callout">
  <div class="callout-label">Try it</div>
  The console below simulates <code>insertOne</code> and <code>find</code> against an in-memory collection.
</div>`,
    playground: { type: 'doc', preset: `db.plants.insertOne({ name: "Cherry Tomato", sunlight: "full sun" })\ndb.plants.find({ sunlight: "full sun" })` },
  },
  {
    id: 'nrel-s-bson', tier: 't1',
    title: 'BSON — what MongoDB actually stores',
    html: `<p>When your application sends a document to MongoDB, the driver converts it from JSON to <strong>BSON</strong> (Binary JSON) before transmission and storage. BSON is a binary-encoded format designed for efficiency — faster to parse than text JSON, and it adds types that JSON simply doesn't have.</p>
<pre class="codeblock">Application code (JSON)
        ↓
MongoDB driver (converts to BSON)
        ↓
MongoDB (stores binary on disk)</pre>
<p>Types BSON adds that JSON lacks:</p>
<ul>
  <li><strong>Date</strong> — actual date objects stored as 64-bit Unix timestamps. Sortable and comparable correctly — unlike date strings.</li>
  <li><strong>ObjectId</strong> — MongoDB's default primary key type (covered next topic).</li>
  <li><strong>Decimal128</strong> — high-precision decimal for financial values. Use this instead of JavaScript's floating-point <code>Number</code> for anything involving money.</li>
  <li><strong>Binary</strong> — raw bytes: images, encrypted fields, file data.</li>
  <li><strong>Int32 / Int64</strong> — explicitly typed integers, instead of JSON's generic "number."</li>
</ul>
<pre class="codeblock">// What you write in application code
db.orders.insertOne({
  userId: 42,
  total: Decimal128("89.99"),
  createdAt: new Date(),
  status: "pending"
})
// Driver converts Date → BSON Date, Decimal128 → BSON Decimal128 automatically</pre>
<div class="callout">
  <div class="callout-label">The most common BSON mistake: dates as strings</div>
  Storing dates as strings ("2026-01-15") instead of Date objects is the single most common MongoDB schema mistake. String dates sort alphabetically — "2026-10-01" comes before "2026-9-01". Querying ranges ($gte, $lte) produces wrong results. Always use <code>new Date()</code>; let the driver handle the conversion.
</div>`,
    playground: { type: 'doc', preset: `db.orders.insertOne({ userId: 42, status: "pending", createdAt: new Date() })\ndb.orders.find({ status: "pending" })` },
  },
  {
    id: 'nrel-s-objectid', tier: 't1',
    title: 'ObjectId — MongoDB\'s default primary key',
    html: `<p>Every MongoDB document has an <code>_id</code> field — its primary key. If you don't provide one on insert, MongoDB generates an <strong>ObjectId</strong> automatically.</p>
<pre class="codeblock">// After insertOne, the document has:
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "Tomato",
  sunlight: "full sun"
}</pre>
<p>An ObjectId is 12 bytes and encodes four pieces of information:</p>
<pre class="codeblock">507f1f77  bcf86c  d799  439011
└───┬───┘ └──┬──┘ └─┬─┘ └──┬──┘
    │        │       │       └── random counter (uniqueness within same second)
    │        │       └── process id
    │        └── machine identifier
    └── Unix timestamp (seconds) ← creation time is embedded here</pre>
<p>The timestamp component means you can extract the approximate creation time from any ObjectId without storing a separate <code>createdAt</code> field:</p>
<pre class="codeblock">ObjectId("507f1f77bcf86cd799439011").getTimestamp()
// → ISODate("2012-10-15T21:26:47Z")</pre>
<p>One common gotcha — when querying by <code>_id</code>, pass an ObjectId, not a plain string:</p>
<pre class="codeblock">// Wrong — a string will never match an ObjectId
db.plants.findOne({ _id: "507f1f77bcf86cd799439011" })   // always returns null

// Correct
db.plants.findOne({ _id: ObjectId("507f1f77bcf86cd799439011") })</pre>
<div class="callout">
  <div class="callout-label">No coordination needed</div>
  ObjectIds are generated on the client (in your application code or driver), not by the database. Multiple servers can insert documents simultaneously with zero chance of collision — there's no central counter to synchronize. This is a deliberate design choice for distributed write performance.
</div>`,
    playground: { type: 'doc', preset: `db.plants.insertOne({ name: "Tomato", sunlight: "full sun" })\ndb.plants.find({})` },
  },
  {
    id: 'nrel-3b', tier: 't1',
    title: 'Updating and deleting documents',
    html: `<p>So far this tier has only covered Create and Read. The other half of CRUD:</p>
<pre class="codeblock">db.plants.updateOne(
  { name: "Tomato" },
  { $set: { sunlight: "partial shade" } }
)</pre>
<p>The first argument is a filter (exactly like <code>find</code>'s), the second is an <strong>update operator</strong> object — never the raw replacement document. <code>$set</code> changes specific fields without touching the rest; <code>$inc</code> increments a number:</p>
<pre class="codeblock">db.plants.updateOne({ name: "Tomato" }, { $inc: { views: 1 } })
db.plants.updateMany({ sunlight: "full sun" }, { $set: { tag: "sunny" } })
db.plants.deleteOne({ name: "Fern" })
db.plants.deleteMany({ sunlight: "shade" })</pre>
<p><code>updateOne</code>/<code>deleteOne</code> only ever touch the first matching document; the <code>Many</code> variants touch every match. This is the same "did you forget WHERE" risk SQL's <code>UPDATE</code>/<code>DELETE</code> carry — an empty filter <code>{}</code> with <code>deleteMany</code> deletes the entire collection.</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  Insert a document, update one field on it with <code>$set</code>, then confirm the change with <code>find</code>.
</div>`,
    playground: { type: 'doc', preset: `db.plants.insertOne({ name: "Tomato", sunlight: "full sun" })\ndb.plants.updateOne({ name: "Tomato" }, { $set: { sunlight: "partial shade" } })\ndb.plants.find({ name: "Tomato" })` },
  },
  {
    id: 'nrel-3c', tier: 't1',
    title: 'Querying with operators',
    html: `<p><code>find</code>'s filter isn't limited to exact matches — comparison and logical operators let you express the same things SQL's <code>WHERE</code> does:</p>
<pre class="codeblock">db.plants.find({ age: { $gt: 2 } })              // greater than
db.plants.find({ age: { $gte: 2, $lte: 5 } })   // range, combined on one field
db.plants.find({ sunlight: { $in: ["full sun", "partial shade"] } })
db.plants.find({ $or: [{ sunlight: "shade" }, { age: { $lt: 1 } }] })</pre>
<p>Comparison operators (<code>$eq</code>, <code>$ne</code>, <code>$gt</code>, <code>$gte</code>, <code>$lt</code>, <code>$lte</code>, <code>$in</code>, <code>$nin</code>) live inside the field they apply to. Logical operators (<code>$or</code>, <code>$and</code>) wrap an array of separate filter conditions at the top level. <code>$exists</code> checks whether a field is present at all — useful given documents in the same collection aren't forced to share a shape.</p>
<p>You can chain <code>.sort()</code> and <code>.limit()</code> onto <code>find()</code> the same way SQL combines <code>ORDER BY</code> and <code>LIMIT</code>:</p>
<pre class="codeblock">db.plants.find({}).sort({ name: 1 }).limit(5)   // 1 = ascending, -1 = descending</pre>
<div class="callout">
  <div class="callout-label">Try it</div>
  Filters for age 2 or older, then sorts the result by age, newest first.
</div>`,
    playground: { type: 'doc', preset: `db.plants.insertOne({ name: "Tomato", age: 3 })\ndb.plants.insertOne({ name: "Basil", age: 1 })\ndb.plants.insertOne({ name: "Fern", age: 5 })\ndb.plants.find({ age: { $gte: 2 } }).sort({ age: -1 })` },
  },
  {
    id: 'nrel-4', tier: 't1',
    title: 'When to reach for which',
    html: `<p>A rough decision guide, not a law:</p>
<ul>
  <li><strong>Reach for relational (Postgres)</strong> when your data has real structure with relationships that must stay consistent — orders, inventory, anything involving money, anything where "these two facts must never disagree" matters.</li>
  <li><strong>Reach for key-value (Redis)</strong> when you need extremely fast reads/writes of simple data that doesn't need querying — sessions, rate-limit counters, caching a result you'd otherwise recompute.</li>
  <li><strong>Reach for document (MongoDB)</strong> when your data is naturally tree-shaped and doesn't need strict cross-record consistency — content with flexible/varying fields, logs, catalogs where each item can differ.</li>
</ul>
<p>Most real systems use more than one of these together — Postgres as the source of truth, Redis as a cache in front of it. That combination, not "picking one winner," is the normal shape of a backend.</p>
<div class="callout">
  <div class="callout-label">Looking ahead</div>
  Midground's caching topics cover exactly that combination — Redis sitting in front of Postgres.
</div>`,
    playground: { type: 'kv', preset: `SET cache:top_plants "[Tomato, Basil, Mint]"\nEXPIRE cache:top_plants 300\nGET cache:top_plants` },
  },

  // ── MIDGROUND ────────────────────────────────────────────────
  {
    id: 'nrel-m-fast', tier: 't2',
    title: 'Why Redis is fast',
    html: `<p>Redis handles hundreds of thousands of operations per second on a single node. Understanding why tells you when to reach for it — and where its limits are.</p>
<p><strong>Everything lives in RAM</strong></p>
<p>A read from RAM takes ~100 nanoseconds. A read from SSD takes ~100 microseconds — roughly 1,000× slower. Redis keeps its entire working dataset in memory, so every GET is a hash table lookup with no disk I/O involved.</p>
<p><strong>Simple data structures</strong></p>
<p>Redis doesn't parse SQL, plan queries, or manage a complex storage engine. GET is a hash table lookup — O(1). LPUSH prepends to a linked list — O(1). ZADD inserts into a skip list — O(log n). Every operation is a direct call into a fast, purpose-built data structure in optimized C.</p>
<p><strong>Mostly single-threaded command execution</strong></p>
<p>Redis processes commands sequentially on a single thread. That sounds like a limitation but is a strength: no lock contention, no thread synchronization overhead. INCR is atomic not because of a mutex — because the thread finishes the entire increment before touching the next command.</p>
<pre class="codeblock">Client commands queue up:
GET k1  →  INCR counter  →  SET k2 "hello"  →  ...
   ↓             ↓                ↓
 each runs to completion before the next starts</pre>
<p><strong>Persistence is asynchronous</strong></p>
<p>RDB snapshots and AOF writes happen in the background. A read never waits for disk — the persistence path is completely off the critical read/write path.</p>
<div class="callout">
  <div class="callout-label">The limit this creates</div>
  Because commands run sequentially, one slow command blocks every other client. <code>KEYS *</code> on a million-key dataset, or <code>SORT</code> on a large list, can freeze Redis for hundreds of milliseconds. This is why those commands are dangerous in production — not merely slow, but blocking every concurrent user.
</div>`,
    playground: { type: 'kv', preset: `SET counter 0\nINCR counter\nINCR counter\nINCR counter\nGET counter` },
  },
  {
    id: 'nrel-m1', tier: 't2',
    title: 'Redis beyond strings: hashes, lists, sets, sorted sets',
    html: `<p>Redis isn't just <code>SET</code>/<code>GET</code> on plain strings — it has a handful of built-in structures, each suited to a different access pattern:</p>
<ul>
  <li><strong>Hash</strong> — a flat object, good for "fields of one record": <code>HSET user:1 name "Mohsin"</code>, <code>HGET user:1 name</code></li>
  <li><strong>List</strong> — an ordered, push/pop-friendly array: <code>LPUSH</code>/<code>RPUSH</code> to add, <code>LRANGE</code> to read a slice. Good for queues, recent-activity feeds.</li>
  <li><strong>Set</strong> — unordered, no duplicates: <code>SADD</code>, <code>SMEMBERS</code>. Good for "has this user already done X" checks.</li>
  <li><strong>Sorted set</strong> — like a set, but every member has a score it's automatically kept ordered by: <code>ZADD</code>, <code>ZRANGE</code>. The natural fit for leaderboards.</li>
</ul>
<div class="callout">
  <div class="callout-label">Try it</div>
  The console below simulates all four. Try building a tiny leaderboard with <code>ZADD</code>, then read it back ordered with <code>ZRANGE</code>.
</div>`,
    playground: { type: 'kv', preset: `LPUSH recent:views "Cherry Tomato"\nLPUSH recent:views "Basil"\nLRANGE recent:views 0 -1\nZADD leaderboard 42 "Mohsin"\nZADD leaderboard 17 "guest"\nZRANGE leaderboard 0 -1` },
  },
  {
    id: 'nrel-m2', tier: 't2',
    title: 'TTL & cache invalidation',
    html: `<p><code>EXPIRE</code> sets a TTL (time-to-live) on a key — after that many seconds, Redis deletes it automatically. This is the entire mechanism behind a cache: store a value, give it a lifespan, and let it disappear on its own once it's stale enough to be worth recomputing.</p>
<pre class="codeblock">SET cache:top_plants "[...]"
EXPIRE cache:top_plants 300   ← gone in 5 minutes, no manual cleanup needed
TTL cache:top_plants          ← check how many seconds are left</pre>
<p>The harder problem isn't setting a TTL — it's deciding when a cached value becomes wrong <em>before</em> its TTL expires. If the underlying data changes (a plant gets edited), the cached version is now stale even though Redis doesn't know that. The two usual answers: either accept staleness for a short TTL window, or explicitly <code>DEL</code> the cache key the moment the underlying data changes.</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  Set a key with a short TTL, check it with <code>TTL</code>, then imagine the underlying data just changed — what would you do about the cache?
</div>`,
    playground: { type: 'kv', preset: `SET cache:plant:4 "Tomato (full sun)"\nEXPIRE cache:plant:4 30\nTTL cache:plant:4` },
  },
  {
    id: 'nrel-m-memory', tier: 't2',
    title: 'Redis memory management & eviction',
    html: `<p>Redis keeps everything in RAM — which means it has a hard ceiling. Without configuration, a Redis instance will grow until it exhausts available memory, at which point the OS may kill the process. <code>maxmemory</code> sets an explicit limit, and an eviction policy defines what happens when that limit is hit.</p>
<pre class="codeblock"># redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru

# Or at runtime:
redis-cli CONFIG SET maxmemory 512mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli INFO memory   # current usage</pre>
<p><strong>Eviction policies:</strong></p>
<ul>
  <li><strong>noeviction</strong> — return an error on writes when full. Redis refuses to accept new data. Safe for data you can't afford to lose; useless for caches.</li>
  <li><strong>allkeys-lru</strong> — evict the least recently used key across all keys. The standard choice for cache-only Redis instances.</li>
  <li><strong>allkeys-lfu</strong> — evict the least frequently used key. Better than LRU when some keys are accessed in bursts but used rarely overall — LRU would incorrectly keep them.</li>
  <li><strong>volatile-lru</strong> — LRU eviction, but only among keys that have a TTL set. Non-expiring keys are never evicted. Useful when Redis holds both permanent config and cached data.</li>
  <li><strong>volatile-ttl</strong> — evict the key with the shortest remaining TTL first. Predictable eviction order.</li>
</ul>
<div class="callout">
  <div class="callout-label">For pure caches: always set maxmemory + allkeys-lru</div>
  Without a maxmemory limit, a cache will grow until Redis crashes. With allkeys-lru, Redis automatically makes room by dropping least-recently-used keys — the cache keeps working, just with a higher miss rate under memory pressure. Without this, "Redis ran out of memory" is a 3am incident.
</div>`,
    playground: { type: 'kv', preset: `SET session:1 "user-data"\nEXPIRE session:1 3600\nTTL session:1\nEXISTS session:1` },
  },
  {
    id: 'nrel-m-pubsub', tier: 't2',
    title: 'Redis Pub/Sub, Streams & message queues',
    html: `<p>Redis is best known as a cache, but it's also widely used for message passing between services. Three patterns, each with different delivery guarantees:</p>
<p><strong>Pub/Sub</strong> — fire-and-forget broadcast. Publishers send messages to a channel; any subscriber connected at that moment receives it. No persistence — if no subscriber is listening, the message is gone.</p>
<pre class="codeblock">SUBSCRIBE notifications:user:42          ← subscriber blocks, waiting
PUBLISH  notifications:user:42 "New follower!"  ← publisher sends, all subscribers receive</pre>
<p>Use pub/sub for: live push notifications, real-time dashboards, chat. Don't use it when delivery must be guaranteed — missed messages are unrecoverable.</p>
<p><strong>Lists as queues</strong> — <code>LPUSH</code> to enqueue, <code>BRPOP</code> to block-pop. Simple job queue that works for background tasks when at-most-once delivery is acceptable.</p>
<pre class="codeblock">LPUSH jobs:email '{"to":"user@example.com","subject":"Welcome"}'
BRPOP jobs:email 0   ← worker blocks until a job arrives, then pops it atomically</pre>
<p><strong>Streams</strong> — Redis's persistent, consumer-group log. Messages survive restarts. Multiple workers can compete for messages. <code>XACK</code> confirms processing. The model is similar to Kafka, without a separate cluster.</p>
<pre class="codeblock">XADD events:orders * userId 42 total 89.99    ← append to stream (auto-generated id)
XREAD COUNT 10 STREAMS events:orders 0        ← read from beginning
XACK  events:orders mygroup msgid             ← acknowledge processed</pre>
<div class="callout">
  <div class="callout-label">Which to use</div>
  Pub/Sub: real-time broadcast, delivery not critical. Lists: simple job queue, one consumer per job. Streams: durable log, consumer groups, acknowledgment, replay — use when you'd otherwise reach for Kafka.
</div>`,
    playground: { type: 'kv', preset: `LPUSH jobs:email "send-welcome"\nLPUSH jobs:email "send-receipt"\nLRANGE jobs:email 0 -1` },
  },
  {
    id: 'nrel-m3', tier: 't2',
    title: 'MongoDB aggregation pipeline',
    html: `<p>The aggregation pipeline processes documents through a sequence of <strong>stages</strong>, each one transforming the data before passing it to the next — similar in spirit to SQL's <code>WHERE</code> + <code>GROUP BY</code>, but expressed as an ordered list of steps you can compose freely.</p>
<pre class="codeblock">Input documents
      ↓
  $match    → filter documents (like WHERE — run this early, uses indexes)
      ↓
  $project  → reshape documents: include, exclude, or compute fields
      ↓
  $group    → bucket by field + compute aggregates ($sum, $avg, $count)
      ↓
  $sort     → order the results
      ↓
  $limit    → trim to N results
      ↓
Output documents</pre>
<pre class="codeblock">db.orders.aggregate([
  { $match:   { status: "completed" } },                       // filter first
  { $project: { userId: 1, amount: 1, _id: 0 } },             // keep only these fields
  { $group:   { _id: "$userId", total: { $sum: "$amount" } } },// sum per user
  { $sort:    { total: -1 } },                                 // highest spenders first
  { $limit:   10 }                                             // top 10 only
])</pre>
<p>Each stage only sees what the previous one passed through — the order matters. Putting <code>$match</code> first is critical: it filters early, reduces the document count, and can use indexes. A <code>$match</code> after <code>$group</code> runs on already-aggregated data and can't use collection indexes.</p>
<p><strong>$lookup — joining collections</strong></p>
<p>MongoDB does support joins. <code>$lookup</code> is the aggregation stage for it:</p>
<pre class="codeblock">db.orders.aggregate([
  {
    $lookup: {
      from: "users",           // the collection to join
      localField: "userId",    // field in orders
      foreignField: "_id",     // field in users
      as: "user"               // output array field name
    }
  }
])</pre>
<p>$lookup works, but embedding is still the default MongoDB approach — joins across large collections are more expensive in a document store than in a relational database with optimized join strategies. Use $lookup for occasional cross-collection queries, not as the primary read pattern.</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  The preset below seeds a few sales documents, then groups them by region and sums the amount per region — try changing <code>$sum</code> to <code>$avg</code>.
</div>`,
    playground: { type: 'doc', preset: `db.sales.insertOne({ region: "west", amount: 100 })\ndb.sales.insertOne({ region: "west", amount: 50 })\ndb.sales.insertOne({ region: "east", amount: 200 })\ndb.sales.aggregate([{ $match: { amount: { $gt: 60 } } }, { $group: { _id: "$region", total: { $sum: "$amount" } } }])` },
  },
  {
    id: 'nrel-m-indexes', tier: 't2',
    title: 'MongoDB indexes',
    html: `<p>Without an index, MongoDB reads every document in a collection to find matches — a <strong>collection scan</strong>. It's the same problem SQL has without indexes, just with a different name. On a collection of 100 documents it's fine; on a million-document collection it's unacceptable.</p>
<pre class="codeblock">// Collection scan — reads every document
db.products.find({ category: "electronics" })

// After adding an index on category:
db.products.createIndex({ category: 1 })   // 1 = ascending, -1 = descending

// Now MongoDB jumps directly to matching documents
db.products.find({ category: "electronics" })   // index scan</pre>
<p><strong>Compound indexes</strong> — index multiple fields together:</p>
<pre class="codeblock">// Useful for queries that filter on category AND sort by price
db.products.createIndex({ category: 1, price: -1 })

// Inspect what indexes exist
db.products.getIndexes()

// See whether a query is using an index
db.products.find({ category: "electronics" }).explain("executionStats")
// Look for: "stage": "IXSCAN" (good) vs "stage": "COLLSCAN" (bad on large collections)</pre>
<p><code>explain("executionStats")</code> is MongoDB's equivalent of SQL's <code>EXPLAIN ANALYZE</code> — it runs the query and reports what happened: which index (if any) was used, how many documents were examined, how long it took.</p>
<p>Fields that usually need indexes:</p>
<ul>
  <li>Any field in a frequent <code>find()</code> filter</li>
  <li>Fields in <code>$match</code> at the start of an aggregation pipeline</li>
  <li>Fields you sort on often (an index on the sort field avoids an in-memory sort)</li>
  <li><code>_id</code> is indexed automatically — never index it manually</li>
</ul>
<div class="callout">
  <div class="callout-label">Over-indexing costs on writes</div>
  Every index must be updated on every insert, update, and delete. A collection with 10 indexes on a write-heavy workload can spend more time maintaining indexes than storing data. Index what you actually query, verified with <code>explain()</code> — not what you might query someday.
</div>`,
    playground: { type: 'doc', preset: `db.products.insertOne({ name: "Laptop", category: "electronics", price: 999 })\ndb.products.insertOne({ name: "Phone", category: "electronics", price: 599 })\ndb.products.insertOne({ name: "Desk", category: "furniture", price: 299 })\ndb.products.find({ category: "electronics" }).sort({ price: -1 })` },
  },
  {
    id: 'nrel-m4', tier: 't2',
    title: 'Denormalization: embedding vs referencing',
    html: `<p>MongoDB gives you the same normalize-or-not choice SQL does, just with different defaults. Two ways to model a plant with varieties:</p>
<pre class="codeblock">// embedded — one document, varieties live inside it
{ name: "Tomato", varieties: ["Roma", "Cherry Tomato"] }

// referenced — separate documents, linked by id (the SQL-like way)
{ _id: 4, name: "Tomato" }
{ _id: 9, name: "Roma", plantId: 4 }</pre>
<p><strong>Embed</strong> when the nested data is always read together with its parent and rarely needs to stand alone — varieties almost always show up alongside their plant. <strong>Reference</strong> when the nested data is large, changes independently, or needs to be queried on its own — thousands of photos per plant would bloat every single plant document if embedded.</p>
<p>The rule of thumb: embed for "belongs entirely to one parent and is read together with it," reference for "shared, large, or independently queried."</p>
<div class="callout">
  <div class="callout-label">Worth knowing now</div>
  This is the exact same tradeoff Tier 1's "when to reach for which" topic gestured at — Mongo doesn't escape the duplication question, it just shifts where you make the call.
</div>`,
  },
  {
    id: 'nrel-m5', tier: 't2',
    title: 'Caching strategies & cache stampede',
    html: `<p>Two common patterns for keeping Redis in front of a real database:</p>
<p><strong>Cache-aside</strong> (the more common default): on read, check the cache first. If it's there (a "hit"), return it. If not (a "miss"), read from the real database, then store the result in the cache before returning it.</p>
<pre class="codeblock">value = redis.GET("plant:4")
if (!value) {
  value = await db.plant.findUnique({ where: { id: 4 } })
  redis.SET("plant:4", value)
  redis.EXPIRE("plant:4", 300)
}
return value</pre>
<p><strong>Write-through</strong>: every write goes to the cache <em>and</em> the database at the same time, so the cache is never stale — at the cost of every write being a bit slower since it touches two systems instead of one.</p>
<p>Cache-aside is the right default for most apps — simple, and a cache failure just means a slower read, not a broken write. Write-through earns its complexity when staleness is genuinely unacceptable.</p>
<p><strong>Cache stampede</strong> — the failure mode of cache-aside at scale</p>
<p>Imagine a popular cache key expires. At that exact moment, 500 concurrent requests all get a cache miss simultaneously. All 500 hit the database at once to reload the same data. This is a <strong>cache stampede</strong> (also called thundering herd) — a single expiry turns into a database spike that can cause cascading failures.</p>
<p>Two mitigations:</p>
<ul>
  <li><strong>Request coalescing (mutex/lock)</strong> — when a cache miss is detected, acquire a short lock before querying the database. Other requests wait for the lock, then get the freshly cached value. Only one request hits the database.</li>
  <li><strong>Probabilistic early expiry</strong> — before the TTL actually hits zero, occasionally refresh the cache on a random request. Spreads the reload over time instead of all at once on expiry.</li>
</ul>
<p><strong>Stale-while-revalidate</strong> — serve the stale value immediately, refresh in the background:</p>
<pre class="codeblock">// Pattern:
// 1. Return the stale cached value immediately (fast response)
// 2. Asynchronously fetch fresh data from the DB
// 3. Update the cache in the background
// → the next request gets fresh data; this request gets a fast stale response

if (cacheHit && !tooStale) return cachedValue;           // serve stale
if (cacheHit && tooStale)  { triggerBackgroundRefresh(); return cachedValue; }
if (cacheMiss)             { value = await db.query(); cache.set(value); return value; }</pre>
<div class="callout">
  <div class="callout-label">Try it</div>
  Simulate a cache miss followed by a cache hit: the first <code>GET</code> below returns nothing, then a <code>SET</code> fills it in, and the second <code>GET</code> is now a hit.
</div>`,
    playground: { type: 'kv', preset: `GET plant:4\nSET plant:4 "Tomato (full sun)"\nEXPIRE plant:4 300\nGET plant:4` },
  },
  {
    id: 'nrel-m6', tier: 't2',
    title: 'Redis transactions & atomic operations',
    html: `<p>Redis commands are individually atomic, but a sequence of them isn't — unless wrapped in <code>MULTI</code>/<code>EXEC</code>, Redis's own version of a transaction.</p>
<pre class="codeblock">MULTI
SADD cart:42 "tomato-seeds"
EXPIRE cart:42 1800
EXEC</pre>
<p>Everything between <code>MULTI</code> and <code>EXEC</code> gets queued, then runs as one uninterruptible block — no other client's command can land in between <code>SADD</code> and <code>EXPIRE</code> above.</p>
<p>For the narrower case of "only do this if nobody else got here first" — a simple distributed lock — <code>SET</code> with <code>NX</code> and <code>EX</code> together is the standard pattern, since it's a single atomic command rather than a multi-step transaction:</p>
<pre class="codeblock">SET lock:checkout:order42 "worker-1" NX EX 30</pre>
<p>If this returns <code>OK</code>, you hold the lock for 30 seconds. If it returns <code>(nil)</code>, someone else already does — no transaction needed, because <code>SET ... NX</code> is one atomic round-trip by itself.</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  Run the queued transaction below, then try the lock pattern — run the same <code>SET ... NX</code> line twice and see the second attempt fail.
</div>`,
    playground: { type: 'kv', preset: `MULTI\nSADD cart:42 "tomato-seeds"\nEXPIRE cart:42 1800\nEXEC\nSET lock:checkout:order42 "worker-1" NX EX 30` },
  },

  // ── BEDROCK ──────────────────────────────────────────────────
  {
    id: 'nrel-b1', tier: 't3',
    title: 'Redis persistence: RDB vs AOF',
    html: `<p>Redis keeps data in memory for speed — but memory disappears on restart. Two strategies exist to survive that:</p>
<ul>
  <li><strong>RDB (snapshotting)</strong> — periodically dumps the entire dataset to disk as a single compact file. Fast to restart from, but anything written since the last snapshot is lost on a crash.</li>
  <li><strong>AOF (append-only file)</strong> — logs every write command as it happens. Slower to restart from (it replays the whole log), but loses far less data — as little as 1 second's worth with <code>appendfsync everysec</code>.</li>
</ul>
<p>Many real deployments run both — RDB for fast restarts, AOF for durability — and Redis lets you tune exactly how often each happens.</p>
<p><strong>Persistence ≠ backup</strong></p>
<p>This distinction matters: persistence protects against a <em>crash</em>. If Redis crashes and restarts, RDB/AOF lets it recover data that was in memory. But persistence does not protect against:</p>
<ul>
  <li>Accidental data deletion (<code>FLUSHALL</code> is persisted immediately)</li>
  <li>Disk corruption</li>
  <li>Needing to restore to a point in time from last Tuesday</li>
</ul>
<p>For true backups — point-in-time recovery, off-site storage — you need a separate backup strategy: copying RDB files to S3 on a schedule, or using a managed Redis service that provides automated backups.</p>
<div class="callout">
  <div class="callout-label">For pure caches, persistence is optional</div>
  If Redis only holds cached data (nothing that isn't also in Postgres), losing it on restart is fine — it just repopulates from the real database on the next miss. Persistence and backups matter most when Redis itself is the primary store for data nothing else has.
</div>`,
  },
  {
    id: 'nrel-b2', tier: 't3',
    title: 'Redis clustering',
    html: `<p>A single Redis instance eventually runs out of memory or throughput. <strong>Redis Cluster</strong> shards keys automatically across multiple nodes, using a fixed set of "hash slots" — every key maps deterministically to one of 16,384 slots, and each node owns a range of slots.</p>
<pre class="codeblock">key "plant:4"  → hash slot 7421 → node B
key "plant:9"  → hash slot 1102 → node A</pre>
<p>Clients talk to any node; if a key isn't on that node, the cluster redirects the request to the right one. This gives you horizontal scaling without manually deciding which server holds which key — the same sharding idea from the relational track's Bedrock tier, just built into Redis itself rather than something you architect by hand.</p>`,
  },
  {
    id: 'nrel-b3', tier: 't3',
    title: 'MongoDB replica sets, sharding & read preferences',
    html: `<p>MongoDB's scaling story has two separate layers that solve different problems:</p>
<p><strong>Replica set → high availability</strong></p>
<p>A replica set is one primary node plus several secondaries that continuously copy its data. If the primary fails, the surviving secondaries automatically elect a new primary — failover happens in seconds without manual intervention. This is about <em>uptime</em>, not capacity. The entire dataset still lives on every node; you haven't gained any write throughput.</p>
<pre class="codeblock">Replica set:
  Primary    ← all writes go here
  Secondary  ← copies of Primary, used for failover + optional reads
  Secondary</pre>
<p><strong>Sharding → horizontal scaling</strong></p>
<p>When a single replica set can't handle the write volume or the dataset is too large to fit on one server, sharding splits the data across multiple replica sets. A routing layer (<code>mongos</code>) sends each query to the right shard automatically based on the shard key.</p>
<pre class="codeblock">sh.shardCollection("app.orders", { userId: "hashed" })
// orders now distributed across shards based on userId hash

Shard A replica set  ← userId hashes 0–...
Shard B replica set  ← userId hashes ...–end
mongos               ← routes queries to the right shard</pre>
<p>Picking a poor shard key (low cardinality, or one that all writes concentrate on) defeats the point — you get "hot shards" doing all the work while others sit idle.</p>
<p><strong>Read preferences</strong></p>
<p>By default, reads go to the primary. You can route reads to secondaries to reduce load on the primary — at the cost of potentially reading slightly stale data (replication lag):</p>
<pre class="codeblock">// In your connection string or driver config:
readPreference: "primary"            // default, always fresh
readPreference: "primaryPreferred"   // secondary if primary unavailable
readPreference: "secondary"          // always read from a secondary
readPreference: "nearest"            // lowest network latency replica</pre>
<div class="callout">
  <div class="callout-label">Replica set ≠ scaling, sharding = scaling</div>
  A common misconception: "I have a 3-node replica set, so I can handle 3× the write load." Wrong — all three nodes apply every write. A replica set provides HA and optional read offloading. Write scaling requires sharding.
</div>`,
  },
  {
    id: 'nrel-b4', tier: 't3',
    title: 'Eventual consistency',
    html: `<p>In a single-database app, every read reflects every write that happened before it — <strong>strong consistency</strong>. The moment you introduce replicas, caches, or distributed nodes, that guarantee weakens: a replica might lag behind the primary by milliseconds, a cache might hold a value that's seconds stale.</p>
<p><strong>Eventual consistency</strong> means: if no new writes happen, all copies will eventually agree — but at any given instant, they might not yet. This isn't a bug introduced by sloppy engineering; it's a deliberate tradeoff distributed systems make in exchange for availability and speed.</p>
<pre class="codeblock">t=0   write "amount: 100" to primary
t=1   replica still shows "amount: 80"   ← stale, but converging
t=50  replica catches up, now shows "amount: 100"</pre>
<p>The practical question isn't "is this system eventually consistent" — almost everything with a cache or replica is. It's: <em>for this specific piece of data, can the user tolerate seeing a stale value for a moment?</em> A like count, fine. An account balance, usually not.</p>`,
  },
  {
    id: 'nrel-b5', tier: 't3',
    title: 'The CAP theorem',
    html: `<p>The CAP theorem says a distributed system can only fully guarantee two of these three at once:</p>
<ul>
  <li><strong>Consistency</strong> — every read gets the most recent write.</li>
  <li><strong>Availability</strong> — every request gets a response, even if some nodes are down.</li>
  <li><strong>Partition tolerance</strong> — the system keeps working even if network communication between nodes breaks down.</li>
</ul>
<p>In practice, partition tolerance isn't optional — networks fail, so any real distributed system has to handle it. That leaves the actual choice as <strong>consistency vs availability</strong> during a partition: when nodes can't talk to each other, do you refuse some requests to keep every answer correct (favor consistency), or answer anyway and risk a stale or conflicting result (favor availability)?</p>
<pre class="codeblock">Network partition happens:
  CP choice → reject requests on the disconnected side, stay correct
  AP choice → answer anyway, reconcile the conflict later</pre>
<p>This is the theory underneath everything this track has covered — Redis's clustering, MongoDB's replica sets, the eventual consistency of caches. Relational databases mostly optimize for consistency on a single machine; the non-relational world more often leans toward availability at scale. Neither choice is "correct" in the abstract — it depends entirely on which kind of wrong answer your app can tolerate.</p>
<div class="callout">
  <div class="callout-label">Where this leaves you</div>
  You now have the vocabulary for the tradeoff every "should I use Postgres or Mongo, SQL or Redis" decision is actually about — not which is newer or faster in general, but which kind of consistency guarantee a specific piece of data actually needs.
</div>`,
  },
  {
    id: 'nrel-b6', tier: 't3',
    title: 'Official docs & playing for real, locally',
    html: `<p>This resource is a curated path, not a replacement for the source material — the official docs cover edge cases and version-specific behavior left out here to keep things learnable:</p>
<ul>
  <li><a href="https://redis.io/docs/latest/" target="_blank" rel="noopener">Redis Documentation</a> — full command reference, including <code>SCAN</code>, clustering, and persistence config</li>
  <li><a href="https://www.mongodb.com/docs/manual/" target="_blank" rel="noopener">MongoDB Manual</a> — the complete query, update, and aggregation operator reference</li>
  <li><a href="https://www.mongodb.com/docs/mongodb-shell/" target="_blank" rel="noopener">mongosh Documentation</a> — the actual shell you'll type these commands into</li>
</ul>
<p>Everything on this page has been a simulation — close to the real syntax, but not a real Redis or MongoDB instance. The Setup page (sidebar) includes <code>docker-compose.yml</code> files that spin up both for real in seconds:</p>
<pre class="codeblock">docker compose up -d
redis-cli -h localhost
mongosh "mongodb://localhost:27017"</pre>
<div class="callout">
  <div class="callout-label">Where the simulator and reality differ</div>
  The simulator implements the common subset of each command — enough to build accurate muscle memory for syntax and behavior. Real Redis and MongoDB have far more: <code>SCAN</code> instead of <code>KEYS</code> at scale, full authentication and access control, replication and sharding actually running, and dozens more operators. Once this resource feels solid, running the real engines locally is the natural next step.
</div>`,
  },
];
