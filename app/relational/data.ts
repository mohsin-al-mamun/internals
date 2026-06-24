export const REL_SEED_SQL = `
  CREATE TABLE plants (id INTEGER PRIMARY KEY, name TEXT, sunlight TEXT);
  CREATE TABLE varieties (id INTEGER PRIMARY KEY, name TEXT, plant_id INTEGER);
  INSERT INTO plants VALUES (1,'Tomato','full sun'),(2,'Basil','full sun'),(3,'Fern','shade'),(4,'Tomato','full sun');
  INSERT INTO varieties VALUES (1,'Cherry Tomato',4),(2,'Roma',4),(3,'Genovese',2);
`;

export const REL_DOCKER_COMPOSE_YML = `services:
  postgres:
    image: postgres:17-alpine
    container_name: db-playground-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: playground
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:`;

export const REL_SETUP_COMMANDS = `docker compose up -d
docker compose ps
psql -h localhost -U postgres -d playground
docker compose down`;

export interface Tier {
  id: string;
  order: number;
  name: string;
  label: string;
  locked: boolean;
}

export interface Topic {
  id: string;
  tier: string;
  title: string;
  html: string;
  playground?: { type: 'sql'; preset: string };
}

export const REL_TIERS: Tier[] = [
  { id: 't1', order: 1, name: 'TIER 1', label: 'Surface',   locked: false },
  { id: 't2', order: 2, name: 'TIER 2', label: 'Midground', locked: false },
  { id: 't3', order: 3, name: 'TIER 3', label: 'Bedrock',   locked: false },
];

export const REL_TOPICS: Topic[] = [
  // ── SURFACE ──────────────────────────────────────────────────
  {
    id: 'rel-1', tier: 't1',
    title: 'What a relational database actually is',
    html: `<p>A relational database stores data in <strong>tables</strong> — grids of rows and columns, the same shape as a spreadsheet, but with strict rules attached. Each table holds one kind of thing: a <code>plants</code> table holds plants, a <code>varieties</code> table holds varieties, and so on.</p>
<p>Three words you'll use constantly:</p>
<ul>
  <li><strong>Row</strong> — one record. One specific plant.</li>
  <li><strong>Column</strong> — one attribute every row in that table has. <code>name</code>, <code>created_at</code>, <code>variety_id</code>.</li>
  <li><strong>Schema</strong> — the declared shape of a table: which columns exist, what type each one is, which ones are required.</li>
</ul>
<p>The word "relational" doesn't mean "tables relate to real-world things" — it means tables can <strong>reference each other</strong> by id, instead of duplicating data. That's the entire idea the next two topics build on.</p>
<div class="callout">
  <div class="callout-label">In your own project</div>
  Plantarium's schema is a clean example: a <code>plants</code> table, a <code>varieties</code> table, a <code>photos</code> table — each one a single kind of thing, connected by ids rather than copy-pasted data.
</div>`,
    playground: { type: 'sql', preset: `SELECT * FROM plants;` },
  },
  {
    id: 'rel-2', tier: 't1',
    title: 'Primary keys & foreign keys',
    html: `<p>A <strong>primary key</strong> is the column (almost always called <code>id</code>) that uniquely identifies one row. No two rows in a table share one. It's how every other table points back to this one.</p>
<p>A <strong>foreign key</strong> is a column in one table that stores the primary key of a row in another table. It's the actual mechanism behind "relational."</p>
<pre class="codeblock">varieties
┌────┬──────────────┬──────────┐
│ id │ name         │ plant_id │  ← foreign key, points to plants.id
├────┼──────────────┼──────────┤
│ 1  │ Cherry Tomato│ 4        │
│ 2  │ Roma         │ 4        │
└────┴──────────────┴──────────┘</pre>
<p>Both varieties point to <code>plant_id = 4</code> — meaning both belong to the same plant. No plant name is ever duplicated inside the varieties table. That single fact — referencing instead of copying — is what prevents a huge class of bugs where the same piece of data drifts out of sync in two places.</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  Run the query below, then change it to join varieties to their plant by matching <code>plant_id = plants.id</code>.
</div>`,
    playground: { type: 'sql', preset: `SELECT id, name, plant_id FROM varieties;` },
  },
  {
    id: 'rel-2b', tier: 't1',
    title: 'Constraints — rules the database enforces for you',
    html: `<p>A constraint is a rule the database checks on every single row, automatically — so invalid data can't get in even if your application code has a bug.</p>
<pre class="codeblock">CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  watering_freq INTEGER DEFAULT 7,
  age INTEGER CHECK (age >= 0)
);</pre>
<ul>
  <li><strong>NOT NULL</strong> — this column can never be empty.</li>
  <li><strong>UNIQUE</strong> — no two rows can share this value (separate from the primary key).</li>
  <li><strong>DEFAULT</strong> — if no value is given on insert, use this one.</li>
  <li><strong>CHECK</strong> — a custom condition every row must satisfy.</li>
</ul>
<p>The point isn't to replace validation in your app code — it's a second, unconditional line of defense. App-level validation can have bugs, get bypassed by a script, or simply not run on every code path. A database constraint runs every single time, no matter what touched the table.</p>
<div class="callout">
  <div class="callout-label">In your own project</div>
  A <code>UNIQUE</code> constraint on a user's email column is the simplest way to guarantee, at the database level, that signup can never create two accounts with the same email — even if a race condition let two requests slip past an app-level check at the exact same instant.
</div>`,
    playground: { type: 'sql', preset: `CREATE TABLE test_users (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL);\nINSERT INTO test_users (email) VALUES ('a@example.com');\nINSERT INTO test_users (email) VALUES ('a@example.com');` },
  },
  {
    id: 'rel-3', tier: 't1',
    title: 'Basic SQL: the four verbs',
    html: `<p>Almost everything you do in SQL is one of four operations, often shortened to <strong>CRUD</strong>:</p>
<ul>
  <li><code>SELECT</code> — read rows</li>
  <li><code>INSERT</code> — create a row</li>
  <li><code>UPDATE</code> — modify existing rows</li>
  <li><code>DELETE</code> — remove rows</li>
</ul>
<p>The pattern worth internalizing: <code>WHERE</code> filters which rows are affected — and on <code>UPDATE</code>/<code>DELETE</code>, forgetting it means every row in the table gets hit. This is the single most common "I just wiped my table" mistake.</p>
<pre class="codeblock">SELECT name FROM plants WHERE sunlight = 'full sun';
UPDATE plants SET sunlight = 'partial shade' WHERE id = 4;
DELETE FROM varieties WHERE plant_id = 4;</pre>
<div class="callout">
  <div class="callout-label">Try it</div>
  Try writing an <code>UPDATE</code> against the seeded table below, then a <code>SELECT</code> to confirm it actually changed.
</div>`,
    playground: { type: 'sql', preset: `SELECT * FROM plants WHERE sunlight = 'full sun';` },
  },
  {
    id: 'rel-4', tier: 't1',
    title: 'JOINs — pulling related tables together',
    html: `<p>A foreign key only stores an id — to actually see "Cherry Tomato belongs to Tomato," you need a <code>JOIN</code>, which stitches two tables together on matching columns.</p>
<pre class="codeblock">SELECT varieties.name AS variety, plants.name AS plant
FROM varieties
JOIN plants ON varieties.plant_id = plants.id;</pre>
<p>Read this as: "for every row in varieties, find the one row in plants whose id matches this row's plant_id, and glue them together." This is the relational database's core superpower — composing data from multiple tables at query time, instead of storing it pre-combined.</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  Run the join below, then try changing <code>JOIN</code> to <code>LEFT JOIN</code> and think about why the result might differ if a plant had zero varieties.
</div>`,
    playground: { type: 'sql', preset: `SELECT varieties.name AS variety, plants.name AS plant\nFROM varieties\nJOIN plants ON varieties.plant_id = plants.id;` },
  },
  {
    id: 'rel-5', tier: 't1',
    title: 'Normalization (1NF → 3NF), in plain terms',
    html: `<p>Normalization is just a name for "don't repeat data that can drift out of sync." A few rules of thumb, not strict math:</p>
<ul>
  <li><strong>1NF</strong> — each cell holds one value, not a comma-separated list. Instead of one <code>tags</code> column with "red, edible, indoor" jammed in, you'd usually use a separate table.</li>
  <li><strong>2NF</strong> — every non-key column depends on the whole primary key, not part of it. Mostly matters once you have composite keys.</li>
  <li><strong>3NF</strong> — a column shouldn't depend on another non-key column. If <code>plants.variety_name</code> exists alongside <code>plants.variety_id</code>, that's duplication waiting to go stale.</li>
</ul>
<p>In practice: if you ever find yourself writing an <code>UPDATE</code> that has to touch the same fact in two tables to keep them consistent, that's normalization telling you something is duplicated that shouldn't be.</p>
<div class="callout">
  <div class="callout-label">Worth knowing now</div>
  Normalization isn't a religion — Midground covers exactly when breaking these rules on purpose (denormalizing) is the right call for performance.
</div>`,
    playground: { type: 'sql', preset: `SELECT plants.name, varieties.name AS variety\nFROM plants\nJOIN varieties ON varieties.plant_id = plants.id\nORDER BY plants.name;` },
  },

  // ── MIDGROUND ────────────────────────────────────────────────
  {
    id: 'rel-m1', tier: 't2',
    title: 'Indexes — what they actually do',
    html: `<p>An index is a separate, ordered structure that points back to your table's rows — so the database can jump straight to matching rows instead of checking every single one (a <strong>full table scan</strong>).</p>
<p>It's the same idea as a book's index: instead of reading every page looking for "tomato," you check the index, get a page number, and jump there directly.</p>
<pre class="codeblock">CREATE INDEX idx_v_plant ON varieties(plant_id);</pre>
<p>Without that index, <code>WHERE plant_id = 4</code> has to inspect every row in <code>varieties</code>. With it, the database can jump straight to the matching rows.</p>
<p>The tradeoff: every index speeds up the reads that filter on it, but slightly slows down writes, since the index itself has to stay updated too. Index columns you actually filter or join on often — not everything.</p>
<div class="callout">
  <div class="callout-label">In your own project</div>
  Plantarium's <code>varieties.plant_id</code> is exactly the kind of column that earns an index — you query "all varieties for this plant" constantly.
</div>`,
    playground: { type: 'sql', preset: `EXPLAIN QUERY PLAN SELECT * FROM varieties WHERE plant_id = 4;` },
  },
  {
    id: 'rel-m2', tier: 't2',
    title: 'Reading a query plan',
    html: `<p><code>EXPLAIN QUERY PLAN</code> (SQLite) — or <code>EXPLAIN ANALYZE</code> in real Postgres — shows what the database actually intends to do with a query, before or while running it.</p>
<pre class="codeblock">SCAN varieties                                           ← full table scan, no index
SEARCH varieties USING INDEX idx_v_plant (plant_id=?)   ← index used, jumps straight there</pre>
<p>Run the query below as-is first — it'll show a <code>SCAN</code>, since no index exists yet. Then add <code>CREATE INDEX idx_v_plant ON varieties(plant_id);</code> above it and re-run to watch the plan change to a <code>SEARCH</code>.</p>
<p>Real Postgres's <code>EXPLAIN ANALYZE</code> goes further — it actually executes the query and reports real timing per step. That's the tool to reach for the moment a query "feels slow."</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  Add <code>CREATE INDEX idx_v_plant ON varieties(plant_id);</code> as a line above the <code>EXPLAIN</code> line, then run both together.
</div>`,
    playground: { type: 'sql', preset: `EXPLAIN QUERY PLAN SELECT * FROM varieties WHERE plant_id = 4;` },
  },
  {
    id: 'rel-m3', tier: 't2',
    title: 'Transactions & atomicity',
    html: `<p>A <strong>transaction</strong> groups multiple statements so they succeed or fail as one unit — either all of them happen, or none do. That property is called <strong>atomicity</strong>.</p>
<pre class="codeblock">BEGIN;
UPDATE plants SET sunlight = 'partial shade' WHERE id = 3;
-- if anything goes wrong here, nothing above happens either
COMMIT;</pre>
<p>The trigger for reaching for a transaction: any time two or more writes must stay consistent with each other. Inserting an order <em>and</em> decrementing inventory. Creating a variety <em>and</em> updating a plant's variety count. If the second write fails after the first succeeded, you'd be left with corrupted data — a transaction prevents that by rolling everything back on failure (<code>ROLLBACK</code> instead of <code>COMMIT</code>).</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  Run this, then add a <code>SELECT * FROM plants WHERE id = 3;</code> line before <code>COMMIT</code> to see the change inside the same transaction.
</div>`,
    playground: { type: 'sql', preset: `BEGIN;\nUPDATE plants SET sunlight = 'partial shade' WHERE id = 3;\nCOMMIT;\nSELECT * FROM plants WHERE id = 3;` },
  },
  {
    id: 'rel-m4', tier: 't2',
    title: 'Isolation levels, in plain terms',
    html: `<p>Atomicity says a transaction is all-or-nothing. <strong>Isolation</strong> is a separate question: while your transaction is running, what can it see of <em>other</em> transactions happening at the same time?</p>
<p>Four standard levels, each preventing a specific problem the one below it doesn't:</p>
<ul>
  <li><strong>Read Uncommitted</strong> — can see other transactions' uncommitted changes (a "dirty read"). Rarely used.</li>
  <li><strong>Read Committed</strong> — only sees committed data. Postgres's default. A value you read can still change if you read it again later in the same transaction.</li>
  <li><strong>Repeatable Read</strong> — re-reading the same row gives the same result for the whole transaction, even if another transaction commits a change in between.</li>
  <li><strong>Serializable</strong> — the strictest: transactions behave as if run one at a time, no overlap effects at all. Safest, but the most expensive.</li>
</ul>
<pre class="codeblock">SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;</pre>
<p>Most apps never touch this — Read Committed is fine for the vast majority of work. You reach for stricter levels specifically when two concurrent transactions touching the same rows could produce a result that's wrong, not just slow.</p>
<div class="callout">
  <div class="callout-label">Why this isn't in the playground</div>
  Demonstrating isolation needs two genuinely concurrent connections — something a single in-browser SQLite instance can't simulate honestly. Worth testing for real once you're running actual Postgres locally.
</div>`,
  },
  {
    id: 'rel-m5', tier: 't2',
    title: 'N+1 queries — the silent performance killer',
    html: `<p>The most common real-world performance bug: fetching a list, then querying related data <em>inside a loop</em>, once per row.</p>
<pre class="codeblock">// the N+1 way — 1 query for plants, then 1 more PER plant
const plants = await prisma.plant.findMany();
for (const plant of plants) {
  plant.varieties = await prisma.variety.findMany({ where: { plantId: plant.id } });
}
// 1 plant query + N variety queries = N+1 round trips to the database</pre>
<p>The fix is to fetch everything in one query — either a <code>JOIN</code> in raw SQL, or an ORM's relation-loading feature (Prisma's <code>include</code>):</p>
<pre class="codeblock">const plants = await prisma.plant.findMany({ include: { varieties: true } });
// 1 query, period</pre>
<p>The SQL underneath that single query is exactly the join you already know:</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  This is the "fixed" version — one query pulling plants and their varieties together, instead of N+1 separate ones.
</div>`,
    playground: { type: 'sql', preset: `SELECT plants.name AS plant, varieties.name AS variety\nFROM plants\nLEFT JOIN varieties ON varieties.plant_id = plants.id;` },
  },
  {
    id: 'rel-m6', tier: 't2',
    title: 'Connection pooling',
    html: `<p>Every database connection costs the database real memory and setup overhead. Traditional servers open a handful of long-lived connections and reuse them. Serverless functions don't work that way — each invocation can spin up fresh, and if every one opens its own new connection, you can exhaust the database's connection limit fast.</p>
<p>A <strong>connection pooler</strong> (PgBouncer, or Supabase's built-in pooler) sits between your app and the database, reusing a small set of real connections across many incoming requests.</p>
<pre class="codeblock">// direct connection — fine for long-running servers
postgresql://user:pass@host:5432/db

// pooled connection — what you need on Vercel/serverless
postgresql://user:pass@host:6543/db?pgbouncer=true</pre>
<div class="callout">
  <div class="callout-label">You've already lived this</div>
  The Prisma + Vercel connection pooler issue you ran into on Plantarium is exactly this problem — serverless functions exhausting Postgres's connection limit without a pooler in front.
</div>`,
  },
  {
    id: 'rel-m7', tier: 't2',
    title: 'Migrations as a discipline',
    html: `<p>A migration is a versioned, recorded change to your schema — <code>add this column</code>, <code>create this table</code> — instead of editing the database by hand. Each one is a file, run in order, so every environment (your machine, staging, production) ends up with the identical schema history.</p>
<pre class="codeblock">npx prisma migrate dev --name add_variety_count
// generates a numbered, timestamped SQL file you can read and commit</pre>
<p>While a project is brand new, "just reset the dev database" feels harmless. The discipline matters the moment there's real user data anywhere — at that point, migrations need to be <strong>additive</strong> (add a new column instead of renaming one outright) and ideally reversible, so a bad deploy can be rolled back without losing data.</p>
<div class="callout">
  <div class="callout-label">Worth forming the habit now</div>
  Even on personal projects, treating every schema change as a migration — not a manual edit — means you never have to remember what you changed by hand six months later.
</div>`,
  },
  {
    id: 'rel-m8', tier: 't2',
    title: 'Aggregate functions & GROUP BY',
    html: `<p>Aggregate functions collapse multiple rows into a single summary value: <code>COUNT</code>, <code>SUM</code>, <code>AVG</code>, <code>MIN</code>, <code>MAX</code>.</p>
<pre class="codeblock">SELECT COUNT(*) FROM varieties;                               -- how many varieties total
SELECT plant_id, COUNT(*) FROM varieties GROUP BY plant_id;  -- how many per plant</pre>
<p><code>GROUP BY</code> is what turns a single aggregate into a per-group one — "how many varieties does EACH plant have," not just the grand total. Every column you <code>SELECT</code> alongside an aggregate must either be in the <code>GROUP BY</code> list or be wrapped in another aggregate.</p>
<p><code>HAVING</code> filters groups <em>after</em> aggregation, the same way <code>WHERE</code> filters rows before it:</p>
<pre class="codeblock">SELECT plant_id, COUNT(*) as variety_count
FROM varieties
GROUP BY plant_id
HAVING COUNT(*) > 1;   -- only plants with more than one variety</pre>
<div class="callout">
  <div class="callout-label">Try it</div>
  Run the grouped count below, then add a <code>HAVING COUNT(*) &gt; 1</code> line to see only plants with multiple varieties.
</div>`,
    playground: { type: 'sql', preset: `SELECT plant_id, COUNT(*) as variety_count\nFROM varieties\nGROUP BY plant_id;` },
  },
  {
    id: 'rel-m9', tier: 't2',
    title: 'Sorting, pagination & DISTINCT',
    html: `<p>Three small but constantly-used tools for shaping a result set:</p>
<p><strong>ORDER BY</strong> sorts rows — ascending by default, <code>DESC</code> for descending:</p>
<pre class="codeblock">SELECT * FROM plants ORDER BY name ASC;
SELECT * FROM plants ORDER BY id DESC;</pre>
<p><strong>LIMIT</strong> / <strong>OFFSET</strong> page through results — the backbone of "page 2 of search results" or infinite scroll:</p>
<pre class="codeblock">SELECT * FROM plants ORDER BY id LIMIT 10 OFFSET 20;  -- rows 21–30</pre>
<p><strong>DISTINCT</strong> removes duplicate rows from the result:</p>
<pre class="codeblock">SELECT DISTINCT sunlight FROM plants;  -- every unique sunlight value, once each</pre>
<p>One subtlety worth knowing: <code>LIMIT</code>/<code>OFFSET</code> pagination can skip or repeat rows if the underlying data changes between page loads. For anything that needs to stay perfectly stable while paginating, cursor-based pagination ("give me everything after id X") is the more robust alternative.</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  This page query skips the first row, then returns the next two — change the numbers and see how the result shifts.
</div>`,
    playground: { type: 'sql', preset: `SELECT * FROM plants ORDER BY name LIMIT 2 OFFSET 1;` },
  },
  {
    id: 'rel-m10', tier: 't2',
    title: 'Subqueries & CTEs',
    html: `<p>A subquery is a query nested inside another one — used where you'd otherwise need the result of one query before you can even write the next.</p>
<pre class="codeblock">SELECT name FROM plants
WHERE id IN (SELECT plant_id FROM varieties);  -- plants that have at least one variety</pre>
<p>A <strong>CTE</strong> (Common Table Expression, the <code>WITH</code> clause) does the same thing but names the intermediate result, which gets far more readable once a query has more than one nested step:</p>
<pre class="codeblock">WITH sunny_plants AS (
  SELECT * FROM plants WHERE sunlight = 'full sun'
)
SELECT * FROM sunny_plants;</pre>
<p>Use a plain subquery for something quick and one-off; reach for a CTE the moment a query has more than one logical step, or you find yourself writing the same subquery twice in one statement.</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  Run the CTE below, then try adding a second <code>WITH</code> block (separated by a comma) that builds on the first.
</div>`,
    playground: { type: 'sql', preset: `WITH sunny_plants AS (\n  SELECT * FROM plants WHERE sunlight = 'full sun'\n)\nSELECT * FROM sunny_plants;` },
  },
  {
    id: 'rel-m11', tier: 't2',
    title: 'UPSERT: INSERT ON CONFLICT',
    html: `<p>An upsert does "insert, or update if it already exists" in one atomic statement — instead of checking existence yourself first, which leaves a race condition between the check and the write.</p>
<pre class="codeblock">INSERT INTO plants (id, name, sunlight)
VALUES (1, 'Tomato', 'partial shade')
ON CONFLICT (id) DO UPDATE SET sunlight = excluded.sunlight;</pre>
<p><code>ON CONFLICT (id)</code> names the constraint that defines a "conflict" — usually the primary key or a unique column. <code>excluded</code> is a special reference to the row you were trying to insert, letting the update clause reuse those values.</p>
<p>This is exactly the pattern behind a "create or update" API endpoint, or a seed script that's safe to re-run without creating duplicates every time.</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  This upserts plant id 1 — since it already exists in the seed data, this runs the <code>DO UPDATE</code> branch.
</div>`,
    playground: { type: 'sql', preset: `INSERT INTO plants (id, name, sunlight)\nVALUES (1, 'Tomato', 'partial shade')\nON CONFLICT (id) DO UPDATE SET sunlight = excluded.sunlight;\nSELECT * FROM plants WHERE id = 1;` },
  },
  {
    id: 'rel-m12', tier: 't2',
    title: 'CASE WHEN — conditional logic inside SQL',
    html: `<p><code>CASE WHEN</code> is SQL's if/else — it computes a value conditionally, right inside a query, instead of pulling raw data out and branching in application code.</p>
<pre class="codeblock">SELECT name,
  CASE
    WHEN sunlight = 'full sun' THEN 'needs bright spot'
    WHEN sunlight = 'shade' THEN 'keep out of direct light'
    ELSE 'check requirements'
  END AS care_note
FROM plants;</pre>
<p>Each <code>WHEN</code> is checked in order, top to bottom — the first one that matches wins, and <code>ELSE</code> catches everything else (it's optional; without it, unmatched rows just get <code>NULL</code>).</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  Run this, then add a third <code>WHEN</code> branch for a sunlight value that doesn't exist in the seed data, to see <code>ELSE</code> catch it.
</div>`,
    playground: { type: 'sql', preset: `SELECT name,\n  CASE\n    WHEN sunlight = 'full sun' THEN 'needs bright spot'\n    WHEN sunlight = 'shade' THEN 'keep out of direct light'\n    ELSE 'check requirements'\n  END AS care_note\nFROM plants;` },
  },
  {
    id: 'rel-m13', tier: 't2',
    title: 'ALTER TABLE — evolving a schema safely',
    html: `<p><code>ALTER TABLE</code> changes an existing table's structure — adding, removing, or modifying columns — without recreating the table from scratch.</p>
<pre class="codeblock">ALTER TABLE plants ADD COLUMN watering_freq INTEGER DEFAULT 7;
ALTER TABLE plants DROP COLUMN old_field;
ALTER TABLE plants RENAME COLUMN sunlight TO light_needs;</pre>
<p>The discipline question from the Migrations topic applies directly here: adding a column with a <code>DEFAULT</code> is safe on a live table with existing rows — every old row instantly gets the default value. Dropping or renaming a column is riskier, since any running code still expecting the old shape breaks the moment it's gone.</p>
<div class="callout">
  <div class="callout-label">In practice</div>
  This is exactly what a Prisma migration generates under the hood every time you change <code>schema.prisma</code> and run <code>migrate dev</code>.
</div>`,
    playground: { type: 'sql', preset: `ALTER TABLE plants ADD COLUMN watering_freq INTEGER DEFAULT 7;\nSELECT * FROM plants;` },
  },

  // ── BEDROCK ──────────────────────────────────────────────────
  {
    id: 'rel-b1', tier: 't3',
    title: 'Replication — copies that take load off the primary',
    html: `<p><strong>Replication</strong> keeps one or more copies of your database (replicas) in sync with the main one (the primary). Writes go to the primary; replicas continuously apply the same changes.</p>
<p>The main reason to reach for it: read scaling. If your app does far more reads than writes, you can point read-heavy queries at replicas and keep the primary free for writes.</p>
<pre class="codeblock">writes  → primary
reads   → replica-1, replica-2, ...   (slightly behind the primary)</pre>
<p>The catch is <strong>replication lag</strong> — replicas are always a little behind. A user who just wrote something might read a replica and not see their own change yet. This is exactly the kind of consistency tradeoff the CAP theorem generalizes.</p>
<div class="callout">
  <div class="callout-label">When this matters to you</div>
  A solo project rarely needs this. It becomes relevant once read traffic genuinely starts competing with writes for database resources.
</div>`,
  },
  {
    id: 'rel-b2', tier: 't3',
    title: 'Sharding — splitting data across multiple databases',
    html: `<p>Replication copies the <em>whole</em> database multiple times. <strong>Sharding</strong> does the opposite — it splits the data itself across multiple databases, each holding a slice, usually based on some key.</p>
<pre class="codeblock">users 1–1,000,000           → shard A
users 1,000,001–2,000,000   → shard B</pre>
<p>This solves a different problem than replication: a single database server eventually runs out of disk, memory, or write throughput no matter how well-indexed it is. Sharding spreads that load across machines instead of one.</p>
<p>The cost is real complexity — a query that needs data from two shards can no longer be one simple query. Most teams delay sharding as long as possible; it's a last resort after replication, caching, and indexing have all been pushed as far as they go.</p>`,
  },
  {
    id: 'rel-b3', tier: 't3',
    title: 'Locks & deadlocks',
    html: `<p>When a transaction modifies a row, the database places a <strong>lock</strong> on it so no other transaction can modify the same row until the first one finishes. This is what keeps concurrent writes from corrupting each other.</p>
<p>A <strong>deadlock</strong> happens when two transactions each hold a lock the other one needs:</p>
<pre class="codeblock">Transaction A: locks row 1, then wants row 2
Transaction B: locks row 2, then wants row 1
→ both wait forever, unless something intervenes</pre>
<p>The database detects this automatically and aborts one of the two transactions (returning a deadlock error), letting the other proceed. The practical defense on your side: always acquire locks/update rows in a <strong>consistent order</strong> across your codebase — if every transaction always updates the "lower id" row first, deadlocks like the one above can't form.</p>
<div class="callout">
  <div class="callout-label">Why no playground here</div>
  Demonstrating a real deadlock needs two genuinely concurrent connections fighting over the same rows — a single in-browser SQLite instance can't simulate that honestly.
</div>`,
  },
  {
    id: 'rel-b4', tier: 't3',
    title: 'Partitioning — splitting one big table, on one machine',
    html: `<p><strong>Partitioning</strong> is easy to confuse with sharding, but it's a different scope: partitioning splits one huge table into smaller physical pieces <em>within the same database instance</em>, while sharding splits data across separate database instances entirely.</p>
<pre class="codeblock">CREATE TABLE events (
  id SERIAL, created_at DATE, payload JSONB
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2026_01 PARTITION OF events
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');</pre>
<p>Queries that filter by the partition key (here, a date range) only need to scan the relevant partition instead of the entire table — a huge win once a table reaches tens of millions of rows, common for logs, events, or time-series data. The table still looks like one table to your app code; Postgres handles routing queries to the right partition internally.</p>`,
  },
  {
    id: 'rel-b5', tier: 't3',
    title: 'Query planner internals',
    html: `<p>The planner doesn't just check "is there an index" — it's a <strong>cost-based optimizer</strong>. It estimates the cost of several possible execution strategies for a query and picks the cheapest one, using statistics it keeps about your tables (row counts, value distributions).</p>
<p>Three common join strategies it chooses between:</p>
<ul>
  <li><strong>Nested loop</strong> — for each row in the outer table, scan the inner table for matches. Cheap when one side is small.</li>
  <li><strong>Hash join</strong> — builds a hash table from one side, then probes it with the other. Good for large, unsorted tables.</li>
  <li><strong>Merge join</strong> — both sides are already sorted on the join key, so it walks them in lockstep.</li>
</ul>
<p>This is why the same query can get a different plan depending on table size — a nested loop that's fine on a 100-row table becomes the wrong choice on a 10-million-row one. <code>EXPLAIN ANALYZE</code> in real Postgres will tell you exactly which strategy it picked and how long each step actually took.</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  SQLite's planner is much simpler than Postgres's, but the same underlying question — "what's the cheapest way to satisfy this query" — is visible in its plan output too.
</div>`,
    playground: { type: 'sql', preset: `EXPLAIN QUERY PLAN\nSELECT plants.name, varieties.name\nFROM plants\nJOIN varieties ON varieties.plant_id = plants.id\nWHERE plants.sunlight = 'full sun';` },
  },
  {
    id: 'rel-b6', tier: 't3',
    title: 'Window functions',
    html: `<p>A window function computes a value across a set of related rows — a "window" — without collapsing them into one row the way <code>GROUP BY</code> does. Every input row keeps its place, but gains a calculated column.</p>
<pre class="codeblock">SELECT name, plant_id,
  ROW_NUMBER() OVER (PARTITION BY plant_id ORDER BY name) as rn
FROM varieties;</pre>
<p><code>PARTITION BY</code> defines the window — here, "restart the numbering for each <code>plant_id</code>." <code>ROW_NUMBER()</code> gives each row in that window a sequential number. Other common window functions: <code>RANK()</code> (handles ties by leaving gaps), <code>DENSE_RANK()</code> (handles ties without gaps), and <code>LAG()</code>/<code>LEAD()</code> (look at the previous/next row's value).</p>
<p>The classic case <code>GROUP BY</code> alone can't handle: "show me the top 2 varieties per plant" — you need the per-plant rank as a column you can then filter on, which is exactly what a window function gives you that a plain aggregate can't.</p>
<div class="callout">
  <div class="callout-label">Try it</div>
  This numbers each variety within its own plant group — notice both varieties of plant 4 get numbered 1 and 2, restarting from the previous plant.
</div>`,
    playground: { type: 'sql', preset: `SELECT name, plant_id,\n  ROW_NUMBER() OVER (PARTITION BY plant_id ORDER BY name) as rn\nFROM varieties;` },
  },
  {
    id: 'rel-b7', tier: 't3',
    title: 'Official docs & playing for real, locally',
    html: `<p>This resource is a curated path, not a replacement for the source material. The official docs cover edge cases and version-specific behavior deliberately left out here to keep things learnable:</p>
<ul>
  <li><a href="https://www.postgresql.org/docs/current/" target="_blank" rel="noopener">PostgreSQL Documentation</a> — the complete, authoritative reference</li>
  <li><a href="https://www.sqlite.org/docs.html" target="_blank" rel="noopener">SQLite Documentation</a> — what's actually running in this page's playgrounds</li>
  <li><a href="https://www.prisma.io/docs" target="_blank" rel="noopener">Prisma Docs</a> — the ORM layer most of your own projects sit on top of this</li>
</ul>
<p>Reading about a database and running one are different skills. The Setup page (sidebar) includes a <code>docker-compose.yml</code> that spins up a real local Postgres in seconds, so every command on this page can be run again against the real thing, not a browser simulation.</p>
<pre class="codeblock">docker compose up -d
psql -h localhost -U postgres -d playground</pre>
<div class="callout">
  <div class="callout-label">Where the simulator and reality differ</div>
  SQLite (what these playgrounds run) is close enough to Postgres for learning syntax, but isn't identical — Postgres has its own data types, stricter type checking, and features like <code>JSONB</code> and full-text search that SQLite doesn't. Treat anything practiced here as "the concept and the common syntax," then verify specifics against the real docs once you're building for real.
</div>`,
  },
];
