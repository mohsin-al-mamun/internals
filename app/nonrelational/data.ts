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
<p>The mental shift coming from SQL: there's no enforced schema, and joining across documents is either avoided or expensive. The database doesn't protect you from inconsistent shapes — your application code does.</p>
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
    html: `<p>MongoDB stores <strong>documents</strong> — JSON-like objects — grouped into <strong>collections</strong> (the rough equivalent of a table, except documents in the same collection don't have to share the same shape).</p>
<pre class="codeblock">db.plants.insertOne({
  name: "Cherry Tomato",
  sunlight: "full sun",
  varieties: ["Roma", "San Marzano"]   ← nested, not a separate table
})
db.plants.find({ sunlight: "full sun" })</pre>
<p>Notice <code>varieties</code> is just nested inside the plant document. In SQL this would be a separate table joined by a foreign key — in Mongo, the default instinct is to embed related data directly, accepting some duplication in exchange for not needing a join.</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  The console below simulates <code>insertOne</code> and <code>find</code> against an in-memory collection.
</div>`,
    playground: { type: 'doc', preset: `db.plants.insertOne({ name: "Cherry Tomato", sunlight: "full sun" })\ndb.plants.find({ sunlight: "full sun" })` },
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
    id: 'nrel-m3', tier: 't2',
    title: 'MongoDB aggregation pipeline',
    html: `<p>The aggregation pipeline processes documents through a sequence of <strong>stages</strong>, each one transforming the data before passing it to the next — similar in spirit to SQL's <code>WHERE</code> + <code>GROUP BY</code>, but expressed as a list of steps.</p>
<pre class="codeblock">db.sales.aggregate([
  { $match: { region: "west" } },                           // like WHERE
  { $group: { _id: "$region", total: { $sum: "$amount" } } } // like GROUP BY + SUM
])</pre>
<p><code>$match</code> filters documents through, exactly like a SQL <code>WHERE</code>. <code>$group</code> buckets documents by some field (the <code>_id</code> here) and computes an aggregate — <code>$sum</code>, <code>$avg</code>, and others — per bucket. Stages run in order, each seeing only what the previous stage passed through.</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  The preset below seeds a few sales documents, then groups them by region and sums the amount per region — try changing <code>$sum</code> to <code>$avg</code>.
</div>`,
    playground: { type: 'doc', preset: `db.sales.insertOne({ region: "west", amount: 100 })\ndb.sales.insertOne({ region: "west", amount: 50 })\ndb.sales.insertOne({ region: "east", amount: 200 })\ndb.sales.aggregate([{ $group: { _id: "$region", total: { $sum: "$amount" } } }])` },
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
    title: 'Caching strategy: cache-aside vs write-through',
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
  <li><strong>RDB (snapshotting)</strong> — periodically dumps the entire dataset to disk as a single file. Fast to restart from, but anything written since the last snapshot is lost on a crash.</li>
  <li><strong>AOF (append-only file)</strong> — logs every write command as it happens. Slower to restart from (it replays the whole log), but loses far less data on a crash.</li>
</ul>
<p>Many real deployments run both together — RDB for fast restarts, AOF for durability — and Redis lets you tune exactly how often each happens. The underlying tradeoff is the same one databases face everywhere: durability costs write performance.</p>
<div class="callout">
  <div class="callout-label">Why this matters even for caches</div>
  If you're only using Redis as a cache (not a primary store), losing its data on restart is usually fine — the cache just repopulates from the real database on the next miss. Persistence matters most when Redis itself holds data nothing else has.
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
    title: 'MongoDB replica sets & sharding',
    html: `<p>MongoDB's version of replication is a <strong>replica set</strong> — one primary node taking writes, and several secondaries continuously copying its data. If the primary fails, the set automatically elects a new primary from the secondaries — built-in failover, not something you wire up yourself.</p>
<p>MongoDB's sharding works conceptually like the relational version: a <strong>shard key</strong> determines which shard a document lives on, and a routing layer (<code>mongos</code>) sends each query to the right shard(s) automatically.</p>
<pre class="codeblock">sh.shardCollection("app.plants", { region: 1 })
// documents now split across shards based on their "region" field</pre>
<p>Picking a good shard key matters enormously — a poor choice (like a field with few distinct values) can leave one shard doing all the work while others sit idle, defeating the entire point of sharding.</p>`,
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
