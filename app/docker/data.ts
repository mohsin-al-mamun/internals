export const DOCKER_SETUP_INSTRUCTIONS = `# Install Docker Desktop (Mac / Windows / Linux)
# https://docs.docker.com/get-docker/

# Verify installation
docker version
docker run hello-world

# Pull an image and drop into a shell
docker run -it ubuntu:24.04 bash`;

export interface Tier {
  id: string;
  order: number;
  name: string;
  label: string;
  locked: boolean;
}

export interface DockerTopic {
  id: string;
  tier: string;
  title: string;
  html: string;
}

export const DOCKER_TIERS: Tier[] = [
  { id: 't1', order: 1, name: 'TIER 1', label: 'Surface',   locked: false },
  { id: 't2', order: 2, name: 'TIER 2', label: 'Midground', locked: false },
  { id: 't3', order: 3, name: 'TIER 3', label: 'Bedrock',   locked: false },
];

export const DOCKER_TOPICS: DockerTopic[] = [
  // ── SURFACE ──────────────────────────────────────────────────
  {
    id: 'docker-s1', tier: 't1',
    title: 'What Docker actually is',
    html: `<p>Docker packages an application and everything it needs to run — code, runtime, libraries, config — into a single unit called a <strong>container</strong>. The container runs the same way on any machine that has Docker installed.</p>
<p>The classic problem Docker solves: <em>"It works on my machine."</em> Dependencies installed globally, different OS versions, missing environment variables — all of these vanish when you ship a container that carries its own environment.</p>
<p><strong>Containers vs virtual machines</strong> — the key difference:</p>
<pre class="codeblock">Virtual Machine                     Container
────────────────────────────────    ──────────────────────────────
Your hardware                       Your hardware
Hypervisor (VMware, VirtualBox)     OS kernel (Linux)
Full guest OS (GBs)                 Container runtime (Docker)
Your app                            Your app + just its deps (MBs)</pre>
<p>A VM virtualizes the entire machine including its own kernel. A container shares the host's Linux kernel and only isolates the filesystem, processes, and network. This makes containers start in milliseconds and use far less RAM and disk.</p>
<p>Under the hood, Docker uses Linux kernel features — namespaces for isolation, cgroups for resource limits, and overlay filesystems for layered images. On Mac and Windows, Docker runs a lightweight Linux VM and hosts containers inside it.</p>
<div class="callout">
  <div class="callout-label">Kernel sharing constraint</div>
  Because containers share the host kernel, a Linux container can only run on a Linux kernel. Docker Desktop on Mac/Windows transparently spins up a small Linux VM. This is invisible in day-to-day use but explains why Windows containers and Linux containers can't mix on the same host.
</div>`,
  },
  {
    id: 'docker-s2', tier: 't1',
    title: 'Images and containers — the relationship',
    html: `<p>Two concepts are central to Docker and easy to confuse:</p>
<ul>
  <li><strong>Image</strong> — a read-only snapshot. A blueprint. It contains the filesystem layers that make up your app's environment. Images are immutable and shareable.</li>
  <li><strong>Container</strong> — a running instance of an image. You can run many containers from the same image. Each container gets its own writable layer on top of the image's read-only layers.</li>
</ul>
<pre class="codeblock">Image (read-only)
  └── Layer 1: Ubuntu base
  └── Layer 2: Node.js installed
  └── Layer 3: npm packages copied in
  └── Layer 4: app source code

Container (running)
  └── Writable layer ← your process writes here (logs, tmp files, etc.)
  └── Image layers (read-only, shared with other containers)</pre>
<p>Common commands for each:</p>
<pre class="codeblock"># Images
docker images                  # list local images
docker pull nginx              # download from Docker Hub
docker rmi nginx               # delete an image
docker build -t myapp .        # build image from Dockerfile

# Containers
docker ps                      # running containers
docker ps -a                   # all containers (incl. stopped)
docker run nginx               # create + start a container from image
docker stop c1                 # graceful stop (SIGTERM)
docker rm c1                   # delete a stopped container</pre>
<div class="callout">
  <div class="callout-label">Analogy</div>
  Image is to container what a class is to an object in OOP. The image defines the template; containers are live instances. One image can spawn thousands of containers, and each instance is independent.
</div>`,
  },
  {
    id: 'docker-s3', tier: 't1',
    title: 'Running containers — docker run flags',
    html: `<p><code>docker run</code> is the most-used Docker command. It creates a container from an image and starts it. The flags control how it behaves:</p>
<pre class="codeblock">docker run nginx                        # foreground, attached
docker run -d nginx                     # detached (background)
docker run -d --name web nginx          # give it a name
docker run -d -p 8080:80 nginx          # map host:8080 → container:80
docker run -d -e NODE_ENV=production myapp  # set env var
docker run -it ubuntu bash              # interactive shell
docker run --rm ubuntu echo hello       # auto-delete when done</pre>
<p>The <code>-p HOST:CONTAINER</code> flag publishes a port. Without it, the container is reachable only from other containers on the same Docker network, not from your browser.</p>
<p>Managing running containers:</p>
<pre class="codeblock">docker ps                   # list running containers
docker ps -a                # all (including stopped)
docker stop web             # send SIGTERM, wait, then SIGKILL
docker kill web             # send SIGKILL immediately
docker restart web          # stop + start
docker rm web               # delete (must be stopped first)
docker rm -f web            # force delete even if running</pre>
<p>Get a shell into a running container:</p>
<pre class="codeblock">docker exec -it web bash    # open bash inside running container
docker exec web ls /app     # run a one-off command</pre>
<div class="callout">
  <div class="callout-label">--rm for throwaway containers</div>
  <code>docker run --rm</code> deletes the container automatically when it exits. Essential for one-off commands — otherwise every <code>docker run</code> leaves a stopped container behind that you have to clean up manually.
</div>`,
  },
  {
    id: 'docker-s4', tier: 't1',
    title: 'Writing a Dockerfile',
    html: `<p>A <strong>Dockerfile</strong> is a text file of instructions that Docker executes top to bottom to build an image. Each instruction creates a new layer.</p>
<pre class="codeblock"># Start from an official base image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy dependency manifest first (layer cache trick)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the source code
COPY . .

# Document which port the app uses (informational)
EXPOSE 3000

# Command to run when the container starts
CMD ["node", "server.js"]</pre>
<p>Key instructions:</p>
<pre class="codeblock">FROM image:tag    # base image — always first
WORKDIR /path     # cd into this dir (creates it if needed)
COPY src dst      # copy files from build context into image
RUN command       # run a shell command during build
ENV KEY=value     # set env var baked into image
ARG name          # build-time variable (not in final image)
EXPOSE port       # document a port (doesn't publish it)
CMD ["cmd","arg"] # default command to run (can be overridden)
ENTRYPOINT [...]  # fixed command (CMD becomes its arguments)</pre>
<p>Build and run:</p>
<pre class="codeblock">docker build -t myapp:latest .        # build from Dockerfile in .
docker build -t myapp:latest -f prod.Dockerfile .   # named file
docker run -d -p 3000:3000 myapp:latest</pre>
<div class="callout">
  <div class="callout-label">CMD vs ENTRYPOINT</div>
  <code>CMD</code> sets the default command — easily overridden at <code>docker run</code>. <code>ENTRYPOINT</code> sets a fixed executable; <code>CMD</code> then provides its default arguments. Use <code>ENTRYPOINT</code> for containers that should always run the same binary; <code>CMD</code> for flexible images.
</div>`,
  },
  {
    id: 'docker-s5', tier: 't1',
    title: 'Volumes and data persistence',
    html: `<p>A container's writable layer is ephemeral — it's deleted when the container is removed. Volumes let data outlive containers.</p>
<p>Three ways to persist data:</p>
<pre class="codeblock"># 1. Named volume — Docker manages the storage location
docker run -v mydata:/app/data postgres

# 2. Bind mount — map a host path directly into the container
docker run -v /home/user/data:/app/data postgres
docker run -v $(pwd):/app node:20 npm test   # dev workflow

# 3. tmpfs mount — in-memory, never hits disk
docker run --tmpfs /tmp nginx</pre>
<p>Named volumes are the recommended production approach:</p>
<pre class="codeblock">docker volume create mydata         # create explicitly
docker volume ls                    # list volumes
docker volume inspect mydata        # see where data lives on host
docker volume rm mydata             # delete (data is gone)
docker volume prune                 # delete all unused volumes</pre>
<p>In practice:</p>
<pre class="codeblock"># Postgres — data persists across container restarts/recreations
docker run -d \
  --name db \
  -e POSTGRES_PASSWORD=secret \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16

# Dev — bind mount source code so edits appear instantly
docker run -d \
  --name app \
  -v $(pwd):/app \
  -p 3000:3000 \
  node:20 npm run dev</pre>
<div class="callout">
  <div class="callout-label">Named vs bind mounts</div>
  Bind mounts depend on a specific host path existing — breaks on other machines. Named volumes are portable and managed by Docker. Use bind mounts for development (source code hot reload); named volumes for production data (databases, uploads).
</div>`,
  },
  {
    id: 'docker-s6', tier: 't1',
    title: 'Port mapping and networking basics',
    html: `<p>By default, containers are isolated from the host network. Ports inside a container are not reachable from your browser unless you explicitly publish them.</p>
<pre class="codeblock"># -p HOST_PORT:CONTAINER_PORT
docker run -d -p 8080:80 nginx      # localhost:8080 → container port 80
docker run -d -p 5432:5432 postgres # default Postgres port
docker run -d -p 127.0.0.1:80:80 nginx  # bind only to localhost</pre>
<p>Docker creates a default <strong>bridge network</strong> for containers. Containers on the same network can reach each other by container name:</p>
<pre class="codeblock"># Create a named network
docker network create mynet

# Run two containers on it
docker run -d --name db --network mynet postgres
docker run -d --name app --network mynet myapp

# Inside app container, db is reachable as hostname "db"
# → postgres://db:5432/mydb works</pre>
<p>Network commands:</p>
<pre class="codeblock">docker network ls                   # list networks
docker network inspect mynet        # see which containers are on it
docker network connect mynet web    # add running container to network
docker network rm mynet             # delete network</pre>
<div class="callout">
  <div class="callout-label">Why container-name DNS works</div>
  Docker's embedded DNS server resolves container names to their internal IP addresses — but only within the same user-defined network. The default bridge network doesn't get this feature; only networks you create with <code>docker network create</code> do. Always create a named network for multi-container apps.
</div>`,
  },
  {
    id: 'docker-s7', tier: 't1',
    title: 'docker-compose — multi-container apps',
    html: `<p><strong>Docker Compose</strong> defines a multi-container application in a single YAML file and manages all containers as a group.</p>
<pre class="codeblock">services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp
    volumes:
      - pgdata:/var/lib/postgresql/data

  app:
    build: .                   # build image from ./Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:secret@db:5432/myapp
    depends_on:
      - db

volumes:
  pgdata:</pre>
<p>The essential commands:</p>
<pre class="codeblock">docker compose up             # start all services (foreground)
docker compose up -d          # detached (background)
docker compose up --build     # rebuild images before starting
docker compose down           # stop and remove containers
docker compose down -v        # also delete named volumes
docker compose ps             # status of all services
docker compose logs app       # logs for one service
docker compose logs -f        # follow all logs
docker compose exec app bash  # shell into a running service</pre>
<div class="callout">
  <div class="callout-label">depends_on doesn't wait for ready</div>
  <code>depends_on</code> ensures container start order, not that the service inside is actually ready. Postgres takes a few seconds to accept connections after the container starts. Use <code>healthcheck</code> + <code>depends_on: condition: service_healthy</code> for proper orchestration, or add retry logic in your app's startup.
</div>`,
  },
  {
    id: 'docker-s8', tier: 't1',
    title: 'Inspecting and debugging containers',
    html: `<p>When something doesn't work inside a container, these commands tell you what's happening:</p>
<pre class="codeblock"># Logs
docker logs web                   # all logs from container
docker logs -f web                # follow live
docker logs --tail 100 web        # last 100 lines
docker logs --since 1h web        # logs from last hour

# Inspect
docker inspect web                # full JSON metadata (IP, mounts, env, etc.)
docker inspect web --format '{{.NetworkSettings.IPAddress}}'   # specific field
docker stats                      # live CPU/memory for all containers
docker stats web                  # just one container</pre>
<pre class="codeblock"># Get a shell inside a running container
docker exec -it web bash          # bash shell
docker exec -it web sh            # if bash not available (Alpine)

# Run commands without a shell
docker exec web cat /etc/hosts
docker exec web env               # list env vars</pre>
<pre class="codeblock"># Copy files between host and container
docker cp web:/app/app.log ./     # container → host
docker cp ./config.yml web:/app/  # host → container</pre>
<p>If the container won't start at all:</p>
<pre class="codeblock">docker run -it --entrypoint bash myapp    # override entrypoint to get a shell
docker run --rm myapp cat /etc/os-release # run a one-off command</pre>
<div class="callout">
  <div class="callout-label">alpine containers have no bash</div>
  Alpine-based images (node:20-alpine, python:3.12-alpine) use <code>sh</code>, not <code>bash</code>. <code>docker exec -it container bash</code> fails with "not found". Use <code>sh</code> instead. To get bash, add <code>RUN apk add bash</code> to your Dockerfile or use a non-Alpine base.
</div>`,
  },

  // ── MIDGROUND ─────────────────────────────────────────────────
  {
    id: 'docker-m1', tier: 't2',
    title: 'Layer caching — writing efficient Dockerfiles',
    html: `<p>Every instruction in a Dockerfile creates a layer. Docker caches each layer and only rebuilds from the first changed instruction downward. Understanding this changes how you write Dockerfiles.</p>
<pre class="codeblock"># SLOW — cache busts on any source code change
FROM node:20-alpine
WORKDIR /app
COPY . .                    # copies everything including source
RUN npm ci                  # reinstalls all packages every time
CMD ["node", "server.js"]</pre>
<pre class="codeblock"># FAST — packages layer is cached unless package.json changes
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./       # only the manifests
RUN npm ci                  # cached unless package.json changed
COPY . .                    # source code copied after — only this layer rebuilds
CMD ["node", "server.js"]</pre>
<p>The rule: <strong>copy things that change rarely before things that change often</strong>.</p>
<pre class="codeblock"># For Python
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

# For Go
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o app .</pre>
<p>Other cache tips:</p>
<pre class="codeblock"># Combine RUN commands to reduce layer count
RUN apt-get update && \
    apt-get install -y curl git && \
    rm -rf /var/lib/apt/lists/*

# Force cache bust when you need fresh packages
docker build --no-cache -t myapp .</pre>
<div class="callout">
  <div class="callout-label">Clean up in the same RUN</div>
  <code>apt-get update</code> followed by <code>rm -rf /var/lib/apt/lists/*</code> must be in the <em>same</em> <code>RUN</code> command. If split across two instructions, the cache files end up baked into a layer that can't be undone — the image stays large even after the cleanup layer runs.
</div>`,
  },
  {
    id: 'docker-m2', tier: 't2',
    title: 'Multi-stage builds',
    html: `<p>Multi-stage builds let you use multiple <code>FROM</code> statements in one Dockerfile. You build in an early stage (with compilers, test tools, dev deps) and copy only the final artifact into a minimal production image.</p>
<pre class="codeblock"># Stage 1: build
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                   # installs devDependencies too
COPY . .
RUN npm run build            # compiles TypeScript → dist/

# Stage 2: production
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production  # production deps only
COPY --from=builder /app/dist ./dist   # only the compiled output
EXPOSE 3000
CMD ["node", "dist/server.js"]</pre>
<p>The final image contains only the Alpine base + production packages + compiled output. The Node.js toolchain, dev dependencies, and source TypeScript never appear in it.</p>
<pre class="codeblock"># Go — extreme example (scratch = empty image)
FROM golang:1.22 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server .

FROM scratch                 # empty base image — nothing but your binary
COPY --from=builder /app/server /server
EXPOSE 8080
ENTRYPOINT ["/server"]</pre>
<p>The Go binary is statically linked — it doesn't need libc or any other files. The resulting image is just the binary itself, often under 10 MB.</p>
<div class="callout">
  <div class="callout-label">Why image size matters</div>
  Smaller images pull faster in CI, deploy faster to production, and have a smaller attack surface. A 1 GB Node.js dev image vs a 100 MB production image means 10x faster deploys on a cold node. Use <code>docker images</code> to compare sizes before and after adding multi-stage.
</div>`,
  },
  {
    id: 'docker-m3', tier: 't2',
    title: 'Environment variables — ARG vs ENV',
    html: `<p>Docker has two mechanisms for injecting values at different stages:</p>
<ul>
  <li><strong>ARG</strong> — build-time variable. Available during <code>docker build</code>. Not present in the running container (unless also set with ENV).</li>
  <li><strong>ENV</strong> — runtime variable. Baked into the image. Available when the container runs.</li>
</ul>
<pre class="codeblock">FROM node:20-alpine

ARG APP_VERSION=1.0.0        # build-time, defaults to 1.0.0
ENV NODE_ENV=production      # runtime, always production in this image

RUN echo "Building v$APP_VERSION"   # ARG visible here
COPY . .
CMD ["node", "server.js"]
# In the running container: NODE_ENV=production, APP_VERSION not available</pre>
<p>Pass ARG at build time:</p>
<pre class="codeblock">docker build --build-arg APP_VERSION=2.3.1 -t myapp .</pre>
<p>Pass ENV at run time (overrides image default):</p>
<pre class="codeblock">docker run -e NODE_ENV=staging myapp
docker run --env-file .env myapp    # load from file</pre>
<p>In docker-compose:</p>
<pre class="codeblock">services:
  app:
    build:
      context: .
      args:
        APP_VERSION: "2.3.1"        # passed to ARG
    environment:
      NODE_ENV: production           # ENV at runtime
      DATABASE_URL: postgres://...
    env_file:
      - .env                         # load from .env file</pre>
<div class="callout">
  <div class="callout-label">Secrets in ARG are not secret</div>
  <code>ARG</code> values are visible in the image's build history (<code>docker history myapp</code>). Never pass API keys or passwords as ARG. Use Docker secrets, a secrets manager (Vault, AWS SSM), or inject at runtime via ENV.
</div>`,
  },
  {
    id: 'docker-m4', tier: 't2',
    title: 'Health checks',
    html: `<p>Docker can periodically test whether a container is healthy. An unhealthy container shows up in <code>docker ps</code> and can trigger restarts or block dependent services.</p>
<pre class="codeblock"># In Dockerfile
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1</pre>
<pre class="codeblock"># In docker-compose
services:
  app:
    image: myapp
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s    # grace period before first check</pre>
<p>Container health states:</p>
<pre class="codeblock">docker ps
# STATUS column shows:
# starting    — in start_period, checks not yet run
# healthy     — last N checks passed
# unhealthy   — last N retries failed

docker inspect --format='{{.State.Health.Status}}' web</pre>
<p>Use health checks to gate dependent services:</p>
<pre class="codeblock">services:
  db:
    image: postgres:16
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 5

  app:
    depends_on:
      db:
        condition: service_healthy   # waits for db to be healthy</pre>
<div class="callout">
  <div class="callout-label">What to expose at /health</div>
  A health endpoint should verify the app can actually serve traffic — check the DB connection, confirm required caches are warm. Returning 200 when the process is up but the DB is down causes load balancers to send traffic to a broken instance. Fail loudly.
</div>`,
  },
  {
    id: 'docker-m5', tier: 't2',
    title: 'Image registries — tag, push, pull',
    html: `<p>A <strong>registry</strong> is a server that stores and distributes Docker images. Docker Hub is the default public registry. Cloud providers offer private registries (ECR, GCR, ACR).</p>
<p>Image naming convention:</p>
<pre class="codeblock">registry/repository:tag

docker.io/library/nginx:latest     # Docker Hub official image
docker.io/myuser/myapp:1.2.0       # Docker Hub personal
123456.dkr.ecr.us-east-1.amazonaws.com/myapp:latest   # AWS ECR
gcr.io/myproject/myapp:v2          # Google Container Registry</pre>
<p>Tagging and pushing:</p>
<pre class="codeblock"># Tag locally built image for a registry
docker build -t myapp:latest .
docker tag myapp:latest myuser/myapp:1.2.0
docker tag myapp:latest myuser/myapp:latest

# Push to Docker Hub
docker login
docker push myuser/myapp:1.2.0
docker push myuser/myapp:latest

# Pull on another machine
docker pull myuser/myapp:1.2.0</pre>
<p>Best practices for tags:</p>
<pre class="codeblock">myapp:latest          # moving tag — always points to newest
myapp:1.2.0           # pinned version — immutable, use in production
myapp:1.2             # minor version tag
myapp:sha-a3f91bc     # git commit SHA — most precise</pre>
<div class="callout">
  <div class="callout-label">Never rely on :latest in production</div>
  <code>:latest</code> means "the most recently pushed image with this name." It changes without warning. Pin production deployments to a specific version or commit SHA tag so deploys are deterministic. Use <code>:latest</code> only for local development.
</div>`,
  },
  {
    id: 'docker-m6', tier: 't2',
    title: 'Networks in depth',
    html: `<p>Docker supports several network drivers, each with different isolation and routing behavior:</p>
<pre class="codeblock">bridge    # default — isolated virtual network on the host
host      # container shares the host's network stack directly
none      # no network — fully isolated
overlay   # multi-host networking (Docker Swarm / Kubernetes)</pre>
<p><strong>bridge</strong> (default, most common):</p>
<pre class="codeblock"># Default bridge — no DNS by container name
docker run -d --name web nginx
docker run -d --name app myapp
# app cannot reach web by name on default bridge

# User-defined bridge — DNS works
docker network create mynet
docker run -d --name web --network mynet nginx
docker run -d --name app --network mynet myapp
# app can curl http://web:80</pre>
<p><strong>host</strong> — container uses the host network directly:</p>
<pre class="codeblock">docker run -d --network host nginx
# Nginx now listens on host port 80 directly — no -p mapping needed
# Only works on Linux; ignored on Docker Desktop (Mac/Windows)</pre>
<p><strong>none</strong> — no networking at all:</p>
<pre class="codeblock">docker run --network none myapp    # useful for batch jobs, security sandboxing</pre>
<p>Inspecting networks:</p>
<pre class="codeblock">docker network ls
docker network inspect mynet
# Shows: subnet, gateway, containers currently connected + their IPs</pre>
<div class="callout">
  <div class="callout-label">Always use named networks in compose</div>
  Docker Compose creates a default network for your app, and container name DNS works within it. But naming your network explicitly in <code>networks:</code> gives you control, lets external containers join it, and makes the network persist independently of the compose project.
</div>`,
  },
  {
    id: 'docker-m7', tier: 't2',
    title: 'Resource limits',
    html: `<p>By default a container can consume all available CPU and RAM on the host. In production, always set limits so one container can't starve others.</p>
<pre class="codeblock"># Memory limits
docker run -d --memory 512m nginx          # 512 MB hard limit
docker run -d --memory 512m --memory-swap 512m nginx  # disable swap too

# CPU limits
docker run -d --cpus 1.5 nginx             # 1.5 CPU cores max
docker run -d --cpu-shares 512 nginx       # relative weight (default 1024)</pre>
<p>In docker-compose:</p>
<pre class="codeblock">services:
  app:
    image: myapp
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M</pre>
<p>Checking what a container is using right now:</p>
<pre class="codeblock">docker stats                   # live view of all containers
docker stats --no-stream       # snapshot, then exit

# CONTAINER   CPU %   MEM USAGE / LIMIT    MEM %   NET I/O
# web         0.2%    45MB / 512MB         8.8%    ...</pre>
<p>What happens when a container hits its memory limit:</p>
<pre class="codeblock">--memory 512m                 # OOM-killed if it exceeds 512m
--memory 512m --memory-swap 512m   # no swap — OOM-killed faster
# The kernel sends SIGKILL; container exits with code 137</pre>
<div class="callout">
  <div class="callout-label">Why limits matter in shared environments</div>
  On a Kubernetes node or a shared VM, an unconstrained container can OOM-kill neighboring containers by exhausting host memory. The scheduler also needs limits to make placement decisions. Always set both limits (ceiling) and reservations (guaranteed minimum).
</div>`,
  },
  {
    id: 'docker-m8', tier: 't2',
    title: 'Cleaning up — images, containers, volumes',
    html: `<p>Docker accumulates data quickly — stopped containers, dangling images from failed builds, old volumes. Regular cleanup keeps disk usage under control.</p>
<pre class="codeblock"># Containers
docker ps -a                          # see all including stopped
docker rm c1 c2                       # remove specific containers
docker container prune                # remove all stopped containers

# Images
docker images                         # list images
docker rmi myapp:old                  # remove specific image
docker image prune                    # remove dangling images (untagged)
docker image prune -a                 # remove all unused images

# Volumes
docker volume ls
docker volume prune                   # remove volumes not used by any container

# Networks
docker network prune

# Nuclear option — remove everything unused at once
docker system prune                   # containers + networks + dangling images
docker system prune -a                # + all unused images (not just dangling)
docker system prune -a --volumes      # + volumes too (DATA LOSS)</pre>
<p>Check how much space Docker is using:</p>
<pre class="codeblock">docker system df
# TYPE            TOTAL   ACTIVE   SIZE    RECLAIMABLE
# Images          12      3        4.2GB   3.1GB (73%)
# Containers      8       2        22MB    18MB (82%)
# Volumes         5       2        1.1GB   800MB (72%)</pre>
<div class="callout">
  <div class="callout-label">docker system prune -a --volumes</div>
  This deletes all unused images and all volumes not attached to a running container. On a dev machine it's fine. On a production server, it will delete your database data if the container isn't running. Always check <code>docker volume ls</code> before running.
</div>`,
  },

  // ── BEDROCK ───────────────────────────────────────────────────
  {
    id: 'docker-b1', tier: 't3',
    title: 'Linux namespaces — what actually isolates containers',
    html: `<p>A container isn't a special OS primitive — it's a regular Linux process with restricted views of the system, enforced by <strong>namespaces</strong>. Each namespace type hides a different part of the kernel's global state.</p>
<pre class="codeblock">Namespace   Isolates
──────────────────────────────────────────────────
pid         Process IDs — container sees its own PID tree starting at 1
net         Network interfaces, routing tables, ports
mnt         Filesystem mount points — container sees its own root /
uts         Hostname and domain name
ipc         IPC objects: message queues, semaphores, shared memory
user        UID/GID mapping — container root can map to unprivileged host UID
cgroup      Cgroup hierarchy visibility</pre>
<p>When Docker runs a container, it calls <code>clone()</code> with all these namespace flags. The resulting process has:</p>
<ul>
  <li>PID 1 inside the container (even though it has a different PID on the host)</li>
  <li>Its own network stack — <code>eth0</code> inside the container is a virtual interface</li>
  <li>Its own filesystem root — the image's layers</li>
  <li>Its own hostname</li>
</ul>
<pre class="codeblock"># See the host-side PID of a container's PID 1
docker inspect web --format '{{.State.Pid}}'
# → 12345

# That process exists on the host too
cat /proc/12345/status | grep Name
# → Name: node</pre>
<p>Namespaces provide visibility isolation, not resource limits. Limits are handled separately by cgroups.</p>
<div class="callout">
  <div class="callout-label">Containers are just processes</div>
  <code>ps aux</code> on the host shows all container processes. Namespaces give them a private view, but they're not hidden from the host. A container's "PID 1" might be PID 54321 on the host. This is why privileged containers are dangerous — they can see and interact with the host.
</div>`,
  },
  {
    id: 'docker-b2', tier: 't3',
    title: 'cgroups — resource control under the hood',
    html: `<p><strong>cgroups</strong> (control groups) are the Linux kernel mechanism that limits and accounts for resources consumed by a group of processes. Where namespaces provide isolation, cgroups enforce limits.</p>
<p>When you run <code>docker run --memory 512m --cpus 1.5</code>, Docker creates a cgroup hierarchy and writes limits into it:</p>
<pre class="codeblock"># cgroups v2 — modern Linux (Ubuntu 22.04+, Fedora, etc.)
/sys/fs/cgroup/system.slice/docker-CONTAINERID.scope/
  memory.max          → 536870912   (512 * 1024 * 1024)
  cpu.max             → 150000 100000   (150000/100000 = 1.5 cores)

# Read a running container's memory limit
cat /sys/fs/cgroup/system.slice/docker-$(docker inspect web --format '{{.Id}}').scope/memory.max</pre>
<p>The kernel enforces these limits:</p>
<ul>
  <li><strong>memory.max</strong> — if the process group exceeds this, the kernel OOM-kills a process inside the container. Exit code 137.</li>
  <li><strong>cpu.max</strong> — the CPU scheduler caps how much CPU time the group gets over each period. The container runs slower, not killed.</li>
  <li><strong>blkio</strong> — limits read/write throughput to block devices.</li>
</ul>
<pre class="codeblock"># See what cgroup a container's PID belongs to
cat /proc/$(docker inspect web --format '{{.State.Pid}}')/cgroup</pre>
<div class="callout">
  <div class="callout-label">cgroups v1 vs v2</div>
  cgroups v1 had a separate hierarchy per resource type (memory, cpu, blkio as separate trees). cgroups v2 unifies all resources into one hierarchy and is the default on modern distros. Docker supports both. <code>docker info | grep Cgroup</code> shows which version your daemon uses.
</div>`,
  },
  {
    id: 'docker-b3', tier: 't3',
    title: 'Union filesystems — how image layers work',
    html: `<p>Docker images are stacks of read-only layers. The container adds one writable layer on top. This is implemented using a <strong>union filesystem</strong> — most commonly <strong>OverlayFS</strong> on modern Linux.</p>
<p>OverlayFS merges multiple directories into a single mount point:</p>
<pre class="codeblock">lower (read-only image layers, bottom to top)
  Layer 0: Ubuntu base
  Layer 1: apt-get install curl
  Layer 2: COPY package.json
  Layer 3: npm install

upper (writable container layer)
  /app/logs/app.log     ← written by the running app
  /tmp/cache            ← written by the app

merged (what the container sees at /)
  ← upper takes precedence over lower for same paths</pre>
<p>Copy-on-write (CoW): when a container modifies a file from the lower layers, OverlayFS copies it up to the upper layer first, then modifies the copy. The original lower layer is unchanged.</p>
<pre class="codeblock"># See Docker's storage driver
docker info | grep "Storage Driver"
# Storage Driver: overlay2

# See the actual layer directories on disk
docker inspect web --format '{{.GraphDriver.Data}}'
# {
#   "LowerDir": "/var/lib/docker/overlay2/abc/diff:...",
#   "MergedDir": "/var/lib/docker/overlay2/xyz/merged",
#   "UpperDir": "/var/lib/docker/overlay2/xyz/diff",
#   "WorkDir": "/var/lib/docker/overlay2/xyz/work"
# }</pre>
<div class="callout">
  <div class="callout-label">Why layers are shared</div>
  If you run 10 containers from the same nginx image, the image layers exist on disk once. Each container only has its own small upper (writable) layer. This is why containers use far less disk than VMs — and why image sharing (same base, different app layers) is a core Docker efficiency principle.
</div>`,
  },
  {
    id: 'docker-b4', tier: 't3',
    title: 'The OCI stack — containerd, runc, and what Docker actually is',
    html: `<p>When you run <code>docker run</code>, the work passes through several components. Docker is actually a high-level interface over a layered runtime stack.</p>
<pre class="codeblock">docker CLI  →  Docker daemon (dockerd)  →  containerd  →  runc  →  container</pre>
<p>Each layer:</p>
<ul>
  <li><strong>docker CLI</strong> — the <code>docker</code> command you type. Sends API calls to dockerd over a Unix socket.</li>
  <li><strong>dockerd</strong> — the Docker daemon. Manages images, networks, volumes. Delegates actual container lifecycle to containerd.</li>
  <li><strong>containerd</strong> — industry-standard container runtime. Manages container lifecycle (create, start, stop, delete). Used directly by Kubernetes too — it doesn't need Docker at all.</li>
  <li><strong>runc</strong> — the OCI runtime. The lowest level. Actually makes the kernel calls: <code>clone()</code> for namespaces, writes cgroup limits, executes the entrypoint process.</li>
</ul>
<p>The <strong>OCI</strong> (Open Container Initiative) defines two standards:</p>
<ul>
  <li><strong>Image spec</strong> — what an image is: a JSON manifest + config + layer tarballs. Any OCI-compliant tool can build or run an OCI image.</li>
  <li><strong>Runtime spec</strong> — what a runtime must do to create a container from an image bundle. runc is the reference implementation.</li>
</ul>
<div class="callout">
  <div class="callout-label">Kubernetes doesn't need Docker</div>
  Kubernetes speaks directly to containerd (or other CRI-compatible runtimes like CRI-O). The Docker layer sits on top and is optional. This is why Kubernetes deprecated the "dockershim" — it was a translation layer that's no longer needed. Your Docker images run fine on Kubernetes; Docker the daemon is just not involved.
</div>`,
  },
  {
    id: 'docker-b5', tier: 't3',
    title: 'Container security — capabilities, seccomp, rootless',
    html: `<p>Containers share the host kernel, so security hardening matters more than with VMs. Three main mechanisms:</p>
<p><strong>Linux capabilities</strong> — root's power is split into ~40 distinct capabilities. Docker drops most of them by default:</p>
<pre class="codeblock"># Capabilities Docker drops by default (partial list):
# CAP_SYS_ADMIN, CAP_NET_ADMIN, CAP_SYS_PTRACE, CAP_SYS_MODULE...

# Add a specific capability
docker run --cap-add NET_ADMIN myapp      # for network config
docker run --cap-add SYS_PTRACE myapp    # for strace inside container

# Remove all capabilities, add only what you need
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE myapp

# --privileged gives ALL capabilities back (avoid in production)
docker run --privileged myapp            # dangerous — can escape container</pre>
<p><strong>seccomp</strong> — filters which syscalls a container can make:</p>
<pre class="codeblock"># Docker's default seccomp profile blocks ~44 syscalls
# (reboot, kexec_load, etc.)

# Disable seccomp filtering (not recommended)
docker run --security-opt seccomp=unconfined myapp

# Apply a custom profile
docker run --security-opt seccomp=my-profile.json myapp</pre>
<p><strong>Rootless Docker</strong> — run the Docker daemon itself as a non-root user:</p>
<pre class="codeblock">dockerd-rootless-setuptool.sh install
# Docker daemon now runs as your user
# Containers can't affect host files owned by other users
# Best practice for development machines</pre>
<div class="callout">
  <div class="callout-label">Don't run as root inside containers</div>
  Even without <code>--privileged</code>, a container running as root has more attack surface than one running as an unprivileged user. Add to your Dockerfile: <code>RUN adduser -D appuser</code> / <code>USER appuser</code>. Many official images (node, python) provide non-root variants.
</div>`,
  },
  {
    id: 'docker-b6', tier: 't3',
    title: 'Image internals — manifest, config, layers',
    html: `<p>A Docker image isn't a single file — it's a structured set of JSON documents and layer tarballs that conform to the OCI Image Specification.</p>
<pre class="codeblock">Image on a registry:
  manifest.json       ← index of what's in the image
  config.json         ← metadata: env vars, entrypoint, history
  layer-1.tar.gz      ← filesystem snapshot for each layer
  layer-2.tar.gz
  ...

# Pull and inspect manually
docker pull nginx
docker save nginx -o nginx.tar
tar xf nginx.tar
ls
# manifest.json  repositories  blobs/</pre>
<p>The <strong>manifest</strong> lists digests of the config and each layer. A digest is a SHA256 hash of the content — this is how Docker detects whether a layer already exists locally.</p>
<p>The <strong>config</strong> contains:</p>
<pre class="codeblock">docker inspect nginx --format '{{json .Config}}' | jq
# {
#   "Env": ["PATH=/usr/local/sbin:/usr/local/bin:..."],
#   "Cmd": ["nginx", "-g", "daemon off;"],
#   "ExposedPorts": {"80/tcp": {}},
#   "WorkingDir": ""
# }

docker history nginx    # see each layer + the command that created it</pre>
<p>Each layer is a tar archive of only the <em>changes</em> from the previous layer (new files, modified files, deleted files marked with whiteout entries). OverlayFS stacks them at runtime.</p>
<div class="callout">
  <div class="callout-label">Image digests vs tags</div>
  Tags are mutable pointers (like git branches). The digest — <code>nginx@sha256:abc123...</code> — is the immutable content address. For reproducible deployments, pin by digest: <code>FROM nginx@sha256:abc123</code>. The image is cryptographically guaranteed to be exactly what was there when you pinned it.
</div>`,
  },
];
