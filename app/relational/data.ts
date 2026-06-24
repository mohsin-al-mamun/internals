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
    id: 'rel-s-rel', tier: 't1',
    title: 'Database relationships — 1:1, 1:M, M:M',
    html: `<p>Foreign keys are the mechanism; <strong>relationship types</strong> are the pattern. Before designing any schema, identify which type connects each pair of tables — it determines where the FK lives and whether you need a junction table.</p>
<p><strong>One-to-Many (1:M)</strong> — the most common. One parent row maps to many child rows. The FK lives on the "many" side.</p>
<pre class="codeblock">-- One plant → many varieties
-- One user  → many orders
-- One post  → many comments

-- FK on the "many" side (varieties)
CREATE TABLE varieties (
  id       SERIAL PRIMARY KEY,
  name     TEXT NOT NULL,
  plant_id INTEGER REFERENCES plants(id)   -- ← FK points up to plants
);</pre>
<p><strong>Many-to-Many (M:M)</strong> — a row in A can relate to many rows in B, and vice versa. A single FK can't express this — you need a <strong>junction table</strong> in between that holds both FKs.</p>
<pre class="codeblock">-- A post can have many tags; a tag can belong to many posts
CREATE TABLE post_tags (
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  INTEGER REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)   -- composite PK prevents duplicates
);

-- Add a tag to a post:
INSERT INTO post_tags (post_id, tag_id) VALUES (1, 5);

-- Find all tags for post 1:
SELECT tags.name FROM tags
JOIN post_tags ON post_tags.tag_id = tags.id
WHERE post_tags.post_id = 1;</pre>
<p><strong>One-to-One (1:1)</strong> — one row in A maps to exactly one row in B. Use it to separate frequently-accessed columns from rarely-accessed ones, or to isolate sensitive data.</p>
<pre class="codeblock">-- Split user profile (public) from auth details (sensitive)
CREATE TABLE users      (id SERIAL PRIMARY KEY, name TEXT, email TEXT);
CREATE TABLE user_auth  (
  user_id       INTEGER PRIMARY KEY REFERENCES users(id),
  password_hash TEXT NOT NULL,
  last_login    TIMESTAMPTZ
  -- PRIMARY KEY on user_id enforces the 1:1 — one auth row per user
);</pre>
<div class="callout">
  <div class="callout-label">Quick test for which type you have</div>
  Ask "can one A have many Bs?" If yes → start with 1:M. Then ask "can one B also have many As?" If yes to both → M:M, and you need a junction table. If no to both and each side is exactly one → 1:1.
</div>`,
    playground: { type: 'sql', preset: `SELECT plants.name AS plant, varieties.name AS variety\nFROM plants\nLEFT JOIN varieties ON varieties.plant_id = plants.id\nORDER BY plants.name;` },
  },
  {
    id: 'rel-s-types', tier: 't1',
    title: 'SQL data types — the common ones',
    html: `<p>Every column has a declared type. The type tells the database what values are valid, how to store them efficiently, and what operations make sense. These are the types you'll use in nearly every table.</p>
<pre class="codeblock">INTEGER      -- whole numbers: IDs, counts, ages, quantities
TEXT         -- arbitrary-length strings (PostgreSQL's preferred string type)
BOOLEAN      -- true / false
DATE         -- calendar date only: '2026-01-15'
TIMESTAMPTZ  -- date + time + timezone: '2026-01-15 14:30:00+00'
UUID         -- 128-bit globally unique id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
JSONB        -- structured JSON stored in binary form, queryable with operators</pre>
<p>A realistic users table using these types:</p>
<pre class="codeblock">CREATE TABLE users (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        UNIQUE NOT NULL,
  is_active  BOOLEAN     DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata   JSONB
);</pre>
<p>Things worth knowing:</p>
<ul>
  <li><strong>TIMESTAMPTZ vs TIMESTAMP</strong> — always use <code>TIMESTAMPTZ</code>. Plain <code>TIMESTAMP</code> stores no timezone and will silently mislead you when your server and your users are in different timezones.</li>
  <li><strong>UUID vs SERIAL/BIGSERIAL</strong> — UUIDs can be generated in application code before the INSERT (useful when you need the id immediately). Auto-incrementing integers require a round-trip to get the assigned value. Either works; be consistent.</li>
  <li><strong>JSONB vs JSON</strong> — always prefer <code>JSONB</code>. It stores parsed binary, supports indexing with GIN indexes, and lets you query fields with <code>-&gt;</code> and <code>-&gt;&gt;</code> operators. Plain <code>JSON</code> is just stored text — it can't be indexed efficiently.</li>
  <li><strong>TEXT vs VARCHAR</strong> — in PostgreSQL, <code>TEXT</code> and <code>VARCHAR</code> have identical performance. Use <code>TEXT</code> unless you specifically need a length limit.</li>
</ul>
<div class="callout">
  <div class="callout-label">JSONB: pragmatic escape hatch, not a schema substitute</div>
  A <code>JSONB</code> column is useful for truly variable-shape data — product attributes that differ by category, event metadata, external API payloads you want to store but not fully model. Don't reach for it as a way to avoid thinking about your schema.
</div>`,
    playground: { type: 'sql', preset: `SELECT * FROM plants;` },
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
    id: 'rel-s-null', tier: 't1',
    title: 'NULL — the absence of a value',
    html: `<p><code>NULL</code> means "no value" — not zero, not an empty string, not false. It represents the <em>absence</em> of a value entirely. This distinction trips up almost every developer encountering it for the first time.</p>
<pre class="codeblock">-- These are three different things:
watering_freq = 0      -- the plant needs watering 0 times per week (valid data)
notes = ''             -- an empty string (exists, but empty)
watering_freq = NULL   -- unknown, not set, not applicable</pre>
<p><strong>NULL doesn't compare with <code>=</code></strong></p>
<pre class="codeblock">-- This returns zero rows, even if some plants have NULL watering_freq
SELECT * FROM plants WHERE watering_freq = NULL;   -- always empty!

-- This is correct
SELECT * FROM plants WHERE watering_freq IS NULL;

-- And the inverse
SELECT * FROM plants WHERE watering_freq IS NOT NULL;</pre>
<p>Why? Because <code>NULL = NULL</code> evaluates to <code>NULL</code> (unknown), not <code>TRUE</code>. SQL has three-valued logic — true, false, unknown — and any comparison with NULL produces NULL. WHERE only keeps rows where the condition is true, so NULL rows are always filtered out.</p>
<p><strong>NULL in aggregates</strong></p>
<pre class="codeblock">-- COUNT(*) counts all rows including rows with NULL columns
-- COUNT(column) skips NULLs in that column
SELECT COUNT(*), COUNT(watering_freq) FROM plants;
-- → different numbers if any rows have NULL watering_freq</pre>
<p><strong>COALESCE</strong> — substitute a default when a value is NULL:</p>
<pre class="codeblock">SELECT name, COALESCE(watering_freq, 7) AS freq FROM plants;
-- returns 7 wherever watering_freq is NULL</pre>
<div class="callout">
  <div class="callout-label">NOT IN with NULLs is a silent trap</div>
  <code>WHERE id NOT IN (1, 2, NULL)</code> always returns zero rows — it expands to <code>id != 1 AND id != 2 AND id != NULL</code>, and <code>id != NULL</code> evaluates to NULL (unknown), which kills every row. If a subquery could return NULLs, use <code>NOT EXISTS</code> instead of <code>NOT IN</code>.
</div>`,
    playground: { type: 'sql', preset: `SELECT * FROM plants WHERE sunlight IS NOT NULL;\nSELECT COUNT(*), COUNT(sunlight) FROM plants;` },
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
    id: 'rel-s-erd', tier: 't1',
    title: 'ERDs — visualizing your schema',
    html: `<p>An <strong>Entity Relationship Diagram</strong> (ERD) is a visual map of your database schema — tables as boxes, columns listed inside them, and lines between related tables that show the cardinality (1:M, M:M). It's a design tool and a communication tool.</p>
<pre class="codeblock">users                 orders                    products
┌─────────────┐       ┌──────────────────┐      ┌─────────────┐
│ id (PK)     │──┐    │ id (PK)          │      │ id (PK)     │
│ email       │  └1:M─│ user_id (FK)     │      │ name        │
│ name        │       │ created_at       │      │ price       │
└─────────────┘       └──────────────────┘      └─────────────┘
                              │                        │
                           1:M│    order_items      M:1│
                              │  ┌───────────────┐     │
                              └──│ order_id  (FK)│─────┘
                                 │ product_id(FK)│
                                 │ quantity      │
                                 └───────────────┘</pre>
<p>ERDs serve two purposes:</p>
<ul>
  <li><strong>Design tool</strong> — sketch it before writing SQL. Catching a missing junction table or a misplaced FK takes 2 minutes on a diagram and 2 hours on a live table with existing data.</li>
  <li><strong>Documentation</strong> — a new developer can understand a whole codebase's data model in minutes from an ERD, versus days of reading code.</li>
</ul>
<p>Tools:</p>
<ul>
  <li><strong>dbdiagram.io</strong> — write a lightweight DSL, get an interactive diagram instantly</li>
  <li><strong>Prisma Studio</strong> — auto-generates from your <code>schema.prisma</code></li>
  <li><strong>draw.io / Excalidraw</strong> — freehand, good for whiteboard sessions</li>
</ul>
<div class="callout">
  <div class="callout-label">Sketch before you code</div>
  On any feature that touches more than two tables, draw the ERD first. It forces you to answer "where does the FK live?" and "do I need a junction table?" before the schema is set in stone.
</div>`,
    playground: { type: 'sql', preset: `SELECT plants.name AS plant, varieties.name AS variety\nFROM plants\nLEFT JOIN varieties ON varieties.plant_id = plants.id\nORDER BY plants.name;` },
  },
  {
    id: 'rel-s-keys', tier: 't1',
    title: 'Natural keys vs surrogate keys',
    html: `<p>Every table needs a primary key. The choice is which column to use — and it matters more than it looks at first.</p>
<p><strong>Natural key</strong> — a column that already exists in your data and happens to be unique in the real world: email, ISBN, passport number, product SKU.</p>
<p><strong>Surrogate key</strong> — an artificial column invented purely to be the primary key: auto-incrementing integers (<code>SERIAL</code>, <code>BIGSERIAL</code>) or UUIDs.</p>
<pre class="codeblock">-- Natural key approach
CREATE TABLE users (
  email TEXT    PRIMARY KEY,    -- real-world uniqueness
  name  TEXT
);

-- Surrogate key approach (preferred)
CREATE TABLE users (
  id    SERIAL  PRIMARY KEY,    -- invented, meaningless outside this DB
  email TEXT    UNIQUE NOT NULL, -- still enforced, just not the PK
  name  TEXT
);</pre>
<p>Surrogate keys win almost every time, for a few concrete reasons:</p>
<ul>
  <li><strong>Natural identifiers change.</strong> Users change emails. Companies rename. If email is your PK, every FK pointing at it needs to be updated too — or you break referential integrity.</li>
  <li><strong>FKs stay small.</strong> A FK pointing to an integer or UUID is 4–16 bytes. A FK storing a full email string is 30+ bytes, repeated in every row of every table that references users.</li>
  <li><strong>UUIDs can be pre-generated.</strong> You can create a UUID in application code and use it in a related insert before the database round-trip completes. Sequences require the DB to assign the value.</li>
</ul>
<div class="callout">
  <div class="callout-label">Surrogate key doesn't replace UNIQUE on the natural identifier</div>
  Choosing a surrogate key doesn't make the natural identifier optional — <code>email TEXT UNIQUE NOT NULL</code> still enforces its uniqueness at the database level. The surrogate key is purely the internal pointer other tables use.
</div>`,
    playground: { type: 'sql', preset: `SELECT * FROM plants ORDER BY id;` },
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
    id: 'rel-m-fk', tier: 't2',
    title: 'Foreign key actions — CASCADE, SET NULL, RESTRICT',
    html: `<p>A foreign key prevents orphaned references — but it also controls what happens to child rows when the <em>parent</em> row is deleted. That behavior is set with <code>ON DELETE</code>.</p>
<pre class="codeblock">-- CASCADE: delete the user → delete all their orders too
CREATE TABLE orders (
  id      SERIAL  PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- SET NULL: delete the user → keep the order, clear the link
CREATE TABLE orders (
  id      SERIAL  PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- RESTRICT (default): delete the user → blocked if any orders exist
CREATE TABLE orders (
  id      SERIAL  PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE RESTRICT
);</pre>
<p>When to use each:</p>
<ul>
  <li><strong>CASCADE</strong> — the child has no meaning without the parent. Delete a post → cascade to its comments. Delete a user → cascade to their sessions and refresh tokens.</li>
  <li><strong>SET NULL</strong> — the child can exist independently, but the link stops making sense. An order from a deleted account is still a financial record worth keeping; just clear the <code>user_id</code>.</li>
  <li><strong>RESTRICT</strong> — deletion should be a deliberate, multi-step process. "Don't let me delete this parent until I've handled the children explicitly." Good for anything with audit trails.</li>
</ul>
<div class="callout">
  <div class="callout-label">CASCADE is easy to misuse</div>
  Cascading deletes feel convenient until a developer deletes a parent record and silently wipes thousands of child rows across multiple tables. Be intentional. For financial records, audit logs, or anything you'd regret losing, prefer RESTRICT or SET NULL over CASCADE.
</div>`,
    playground: { type: 'sql', preset: `SELECT * FROM varieties WHERE plant_id = 4;` },
  },
  {
    id: 'rel-m-cpk', tier: 't2',
    title: 'Composite primary keys',
    html: `<p>A composite primary key uses two or more columns together as the unique identifier. The combination must be unique even if neither column is unique on its own. This pattern is most natural on junction tables.</p>
<pre class="codeblock">-- A user can enroll in a course once, but can enroll in many courses
CREATE TABLE enrollments (
  user_id    INTEGER REFERENCES users(id)   ON DELETE CASCADE,
  course_id  INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, course_id)   -- ← composite: the pair must be unique
);

-- This works: user 1 enrolls in two different courses
INSERT INTO enrollments (user_id, course_id) VALUES (1, 42);
INSERT INTO enrollments (user_id, course_id) VALUES (1, 99);

-- This fails: user 1 is already enrolled in course 42
INSERT INTO enrollments (user_id, course_id) VALUES (1, 42);
-- → ERROR: duplicate key value violates unique constraint</pre>
<p>The composite PK does two jobs at once: it enforces uniqueness (can't enroll twice) and it's also what other tables would reference if they need to point at a specific enrollment.</p>
<p>The alternative is a surrogate <code>id</code> column plus a separate <code>UNIQUE (user_id, course_id)</code> constraint. Both enforce the same rule:</p>
<pre class="codeblock">-- Surrogate PK alternative
CREATE TABLE enrollments (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id),
  course_id  INTEGER REFERENCES courses(id),
  UNIQUE (user_id, course_id)   -- still enforces no duplicate enrollments
);</pre>
<div class="callout">
  <div class="callout-label">Index comes for free</div>
  Declaring a composite primary key automatically creates an index on those columns together. You get uniqueness enforcement and faster lookups on both columns at once — no separate CREATE INDEX needed.
</div>`,
    playground: { type: 'sql', preset: `SELECT * FROM varieties;` },
  },
  {
    id: 'rel-m3', tier: 't2',
    title: 'Transactions & ACID',
    html: `<p>Before diving into the syntax, it helps to know what guarantees a transaction is designed to provide. These are called <strong>ACID</strong>:</p>
<ul>
  <li><strong>Atomicity</strong> — a transaction is all-or-nothing. Either every statement succeeds, or none of them do. No partial writes.</li>
  <li><strong>Consistency</strong> — a transaction can only move the database from one valid state to another. Constraints (NOT NULL, UNIQUE, FK rules) still hold after every commit.</li>
  <li><strong>Isolation</strong> — concurrent transactions don't see each other's in-progress changes. Covered in the next topic.</li>
  <li><strong>Durability</strong> — once a transaction is committed, the data survives crashes. The database has written it to disk.</li>
</ul>
<p>A <strong>transaction</strong> groups multiple statements so they succeed or fail as one unit — delivering the Atomicity guarantee in practice.</p>
<pre class="codeblock">BEGIN;
UPDATE plants SET sunlight = 'partial shade' WHERE id = 3;
-- if anything goes wrong here, nothing above happens either
COMMIT;</pre>
<p>The trigger for reaching for a transaction: any time two or more writes must stay consistent with each other. Inserting an order <em>and</em> decrementing inventory. Creating a variety <em>and</em> updating a plant's variety count. If the second write fails after the first succeeded, you'd be left with corrupted data — a transaction prevents that by rolling everything back on failure.</p>
<pre class="codeblock">BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
-- if the second UPDATE fails, the first is rolled back automatically
COMMIT;

-- Or abort explicitly
ROLLBACK;</pre>
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
  <div class="callout-label">Why no playground here</div>
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
    id: 'rel-m-order', tier: 't2',
    title: 'SQL execution order — why it differs from write order',
    html: `<p>SQL is written in one order but executed in a different one. Understanding this resolves a whole category of confusing errors.</p>
<pre class="codeblock">-- How you write it:
SELECT plant_id, COUNT(*) AS variety_count
FROM varieties
WHERE plant_id IS NOT NULL
GROUP BY plant_id
HAVING COUNT(*) > 1
ORDER BY variety_count DESC
LIMIT 5;

-- How the database executes it:
-- 1. FROM        → identify the source table(s)
-- 2. JOIN        → combine tables (if any joins are present)
-- 3. WHERE       → filter individual rows — before any grouping
-- 4. GROUP BY    → collapse rows into groups
-- 5. HAVING      → filter groups — after aggregation
-- 6. SELECT      → compute the output columns and any aliases
-- 7. ORDER BY    → sort the final result set
-- 8. LIMIT       → cut to the requested row count</pre>
<p>Three specific confusions this explains:</p>
<ul>
  <li><strong>Column aliases can't appear in WHERE.</strong> Writing <code>SELECT price * 0.9 AS sale_price ... WHERE sale_price &gt; 100</code> fails — WHERE runs before SELECT computes the alias. Wrap it in a CTE or subquery to reference it.</li>
  <li><strong>Aggregates can't go in WHERE.</strong> <code>WHERE COUNT(*) &gt; 1</code> is a syntax error. Aggregates exist only after GROUP BY runs. Use <code>HAVING</code> instead.</li>
  <li><strong>LIMIT always trims a sorted result.</strong> ORDER BY executes before LIMIT, so <code>LIMIT 10</code> gives you the first 10 rows of the sorted output — never 10 arbitrary rows.</li>
</ul>
<div class="callout">
  <div class="callout-label">Try it</div>
  Move the <code>HAVING COUNT(*) &gt; 1</code> condition to a <code>WHERE COUNT(*) &gt; 1</code> clause and observe the error — this is the most common first encounter with execution order.
</div>`,
    playground: { type: 'sql', preset: `SELECT plant_id, COUNT(*) AS variety_count\nFROM varieties\nWHERE plant_id IS NOT NULL\nGROUP BY plant_id\nHAVING COUNT(*) > 1\nORDER BY variety_count DESC;` },
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
    title: 'Subqueries, CTEs & EXISTS',
    html: `<p>A subquery is a query nested inside another one — used where you'd otherwise need the result of one query before you can even write the next.</p>
<pre class="codeblock">SELECT name FROM plants
WHERE id IN (SELECT plant_id FROM varieties);  -- plants that have at least one variety</pre>
<p>A <strong>CTE</strong> (Common Table Expression, the <code>WITH</code> clause) does the same thing but names the intermediate result, which gets far more readable once a query has more than one nested step:</p>
<pre class="codeblock">WITH sunny_plants AS (
  SELECT * FROM plants WHERE sunlight = 'full sun'
)
SELECT * FROM sunny_plants;</pre>
<p>Use a plain subquery for something quick and one-off; reach for a CTE the moment a query has more than one logical step, or you find yourself writing the same subquery twice in one statement.</p>
<p><strong>EXISTS</strong> — a different way to ask "does at least one matching row exist?"</p>
<pre class="codeblock">-- IN fetches the full list of plant_ids, then filters
SELECT name FROM plants
WHERE id IN (SELECT plant_id FROM varieties);

-- EXISTS stops as soon as it finds the first match — often faster
SELECT name FROM plants p
WHERE EXISTS (
  SELECT 1 FROM varieties v WHERE v.plant_id = p.id
);</pre>
<p>Prefer <code>EXISTS</code> when:</p>
<ul>
  <li>The subquery returns a large list — <code>EXISTS</code> short-circuits on the first match, <code>IN</code> fetches the entire list</li>
  <li>The subquery could return NULLs — <code>NOT IN (..., NULL)</code> silently returns zero rows (see the NULL topic); <code>NOT EXISTS</code> handles NULLs correctly</li>
</ul>
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
    id: 'rel-m-views', tier: 't2',
    title: 'Views — naming a query',
    html: `<p>A <strong>view</strong> is a saved query that behaves exactly like a table. It has no storage of its own — querying it re-runs the underlying SQL every time. The value is giving a complex join or calculation a reusable name.</p>
<pre class="codeblock">CREATE VIEW plants_with_varieties AS
SELECT
  plants.id,
  plants.name        AS plant_name,
  plants.sunlight,
  COUNT(varieties.id) AS variety_count
FROM plants
LEFT JOIN varieties ON varieties.plant_id = plants.id
GROUP BY plants.id, plants.name, plants.sunlight;

-- Now query it like any table
SELECT * FROM plants_with_varieties WHERE variety_count > 1;
SELECT plant_name FROM plants_with_varieties ORDER BY variety_count DESC;</pre>
<p>Views are most useful for:</p>
<ul>
  <li><strong>Reusing complex joins</strong> — write the join once in the view definition, reference the view name everywhere. When the join logic changes, update it in one place.</li>
  <li><strong>Access control</strong> — grant a reporting user SELECT on a view that exposes only non-sensitive columns, without exposing the underlying tables directly.</li>
  <li><strong>Backward compatibility</strong> — when you rename or restructure a table, a view can present the old column names to code that hasn't been updated yet.</li>
</ul>
<pre class="codeblock">DROP VIEW plants_with_varieties;
CREATE OR REPLACE VIEW plants_with_varieties AS ...;   -- update in place</pre>
<div class="callout">
  <div class="callout-label">Views vs materialized views</div>
  A regular view re-executes its query on every SELECT — always fresh, no storage cost. A <em>materialized view</em> caches the result and must be refreshed explicitly. Reach for materialized views when the underlying query is genuinely too slow to re-run on each request.
</div>`,
    playground: { type: 'sql', preset: `SELECT plants.name AS plant_name, COUNT(varieties.id) AS variety_count\nFROM plants\nLEFT JOIN varieties ON varieties.plant_id = plants.id\nGROUP BY plants.id, plants.name\nORDER BY variety_count DESC;` },
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
    id: 'rel-b-mvcc', tier: 't3',
    title: 'MVCC — how PostgreSQL handles concurrency',
    html: `<p><strong>MVCC</strong> (Multi-Version Concurrency Control) is the mechanism PostgreSQL uses to let readers and writers operate simultaneously without blocking each other. It's what makes Postgres's default Read Committed isolation level both safe and fast.</p>
<p>The core idea: instead of locking a row when it's being modified, PostgreSQL keeps multiple versions of the same row. Each transaction sees the version that was current when it started — other transactions modifying the same row in parallel are invisible until they commit.</p>
<pre class="codeblock">-- Two transactions running at the same time:

-- Transaction A (started at T=100):
BEGIN;
SELECT sunlight FROM plants WHERE id = 1;   -- sees 'full sun'

   -- Meanwhile, Transaction B commits:
   -- UPDATE plants SET sunlight = 'shade' WHERE id = 1;

SELECT sunlight FROM plants WHERE id = 1;   -- still sees 'full sun' (its snapshot)
COMMIT;

-- New transactions starting after B committed see 'shade'</pre>
<p>What MVCC means in practice:</p>
<ul>
  <li><strong>Readers don't block writers</strong> — a long-running report query doesn't prevent rows from being updated</li>
  <li><strong>Writers don't block readers</strong> — an in-progress UPDATE doesn't stop concurrent SELECTs from returning results</li>
  <li>High read/write concurrency without you manually managing locks</li>
</ul>
<p>The cost: old row versions accumulate on disk. PostgreSQL runs <strong>VACUUM</strong> in the background to clean up versions no active transaction can see anymore. On very write-heavy tables, VACUUM tuning becomes an operational concern — but that's a production database topic, not a dev one.</p>
<div class="callout">
  <div class="callout-label">Why Read Committed is safe by default</div>
  MVCC is why Postgres's default isolation level is both safe and performant. Each statement gets a consistent snapshot of committed data without needing to hold locks on rows it reads. "No locking on reads" isn't a loose guarantee — it's deliberately designed into the storage layer.
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
<p><code>PARTITION BY</code> defines the window — here, "restart the numbering for each <code>plant_id</code>." <code>ORDER BY</code> inside the <code>OVER</code> clause controls the ordering within each window, independent of the query's final <code>ORDER BY</code>.</p>
<p>Common ranking functions:</p>
<ul>
  <li><code>ROW_NUMBER()</code> — unique sequential number per window, no ties</li>
  <li><code>RANK()</code> — handles ties by leaving gaps (1, 1, 3)</li>
  <li><code>DENSE_RANK()</code> — handles ties without gaps (1, 1, 2)</li>
  <li><code>LAG(col)</code> / <code>LEAD(col)</code> — access the previous or next row's value</li>
</ul>
<p><strong>Running totals and rolling aggregates</strong></p>
<p><code>SUM()</code> and <code>AVG()</code> also work as window functions — computing a running total or rolling average without collapsing rows:</p>
<pre class="codeblock">-- Running total of order amounts, ordered by date
SELECT
  order_date,
  amount,
  SUM(amount) OVER (ORDER BY order_date)              AS running_total,
  AVG(amount) OVER (ORDER BY order_date
                    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS rolling_7day_avg
FROM orders;

-- Per-user running totals (PARTITION resets the total per user)
SELECT
  user_id,
  order_date,
  amount,
  SUM(amount) OVER (PARTITION BY user_id ORDER BY order_date) AS user_running_total
FROM orders;</pre>
<p>The classic case <code>GROUP BY</code> alone can't handle: "show me the top 2 varieties per plant" — you need the per-plant rank as a column you can then filter on:</p>
<pre class="codeblock">WITH ranked AS (
  SELECT name, plant_id,
    ROW_NUMBER() OVER (PARTITION BY plant_id ORDER BY name) AS rn
  FROM varieties
)
SELECT * FROM ranked WHERE rn <= 2;</pre>
<div class="callout">
  <div class="callout-label">Try it</div>
  This numbers each variety within its own plant group — notice both varieties of plant 4 get numbered 1 and 2, restarting independently from the previous plant.
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
