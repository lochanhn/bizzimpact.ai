# Docker packaging and EC2 deployment

Current paid-AI update: the user authorized live calls on November 8. The separate AI trial, shared credit controls, model/prompt versions and scoring are described in [AI_DISCOVERY.md](../../backend/AI_DISCOVERY.md). Preserve the deployed private backend environment during updates. New-environment templates below deliberately keep paid flags off until explicitly configured; the earlier initial-deployment snapshot records a catalogue-only setup.

The latest verified application image tag is `f5c652834963584f19ad354df1f78552c91cd406`. Both BizzImpact containers use it. See the [paid HTTPS verification report](../../backend/evaluations/20261109T014132Z-deployment.json); NourishNet and Caddy were preserved. Documentation-only commits after this tag do not require rebuilding the application.

This README explains how teammates can package BizzImpact, deploy a release, check it, and roll it back. Commands use Bash. Run **local** commands from the repository root; commands marked **EC2** run after SSH. A Git push saves source but does **not** automatically deploy the application.

## Current deployment

| Setting | Value |
| --- | --- |
| Live BizzImpact | https://bizzimpact.3-92-95-188.sslip.io |
| Existing NourishNet | https://3-92-95-188.sslip.io |
| EC2 instance / region | `i-0c83c7fa3551b554c` / `us-east-1` |
| SSH destination | `ec2-user@3.92.95.188` |
| OS / CPU architecture | Amazon Linux / `x86_64` (AMD64) |
| Capacity | `t2.micro`, about 1 GiB RAM and 2 GiB swap |
| Deployment directory | `/home/ec2-user/bizzimpact` |
| Shared Caddy configuration | `/home/ec2-user/caddy/Caddyfile` |
| Frontend | `bizzimpact-website`, host port `127.0.0.1:3100` |
| Backend / Docker network | `bizzimpact-backend` / `bizzimpact` |
| Permanent database / Auth | Supabase project `zqtndgqyaibgrholekxu` |

Deployment was verified November 8, 2026. At that time the frontend image tag was `200dda57d6bc860b9ca513992a8636f2346be968`; the backend tag was `1e98ed592516d0a597ebac3fa7965d0aafe52b55`. Inspect running containers for current tags rather than assuming these remain current.

Verified: HTTPS, guest session, profile save, baseline retrieval, completed landscaping discovery, logout/data cleanup, cross-origin rejection, and backend access to 111 researched tools. The guest scenario made zero model/search calls. NourishNet returned HTTP 200 afterward. Both image builds, all 45 frontend tests, and TypeScript checking passed.

**Pending:** public Supabase Auth redirect configuration and genuine signup email, confirmation, login, refresh, and logout checks. Browser visual/mobile checks have not been performed. See [Auth setup](../../website/AUTH_SETUP.md).

## Architecture and files

```text
Internet HTTPS -> existing Caddy
                   |-- NourishNet hostname -> existing service :8010
                   `-- BizzImpact hostname -> 127.0.0.1:3100
                                                   |
                                            Next.js container :3000
                                                   |
                                        bizzimpact-backend:8001
                                                   |
                                             Supabase Auth / DB
```

Caddy owns public ports 80 and 443. The frontend binds only a loopback host port; the backend has no published host port. No additional EC2 security-group port is needed. There is no database container on EC2.

| File | What it does |
| --- | --- |
| [Frontend Dockerfile](../../website/Dockerfile) | Uses Node 24 to build Next.js, then copies its standalone server and static assets into a runtime image running as `node` |
| [Backend Dockerfile](../../backend/Dockerfile) | Uses Python 3.14 and pinned uv to install `uv.lock` dependencies and run FastAPI as an unprivileged user |
| [Frontend exclusions](../../website/.dockerignore), [backend exclusions](../../backend/.dockerignore) | Keep local environment files, development dependencies, caches, and runtime data out of build contexts |
| [Image workflow](../../.github/workflows/ec2-images.yml) | Builds both images on GitHub and uploads a compressed image archive |
| [Startup script](start.sh) | Starts two containers on a dedicated network; refuses to replace existing containers |
| [Frontend template](frontend.env.example), [backend template](../../backend/.env.example) | Runtime settings to configure privately |
| [Caddy snippet](Caddyfile.bizzimpact) | Hostname block to merge into the existing proxy configuration |

There is one Dockerfile per service. This deployment uses Docker commands directly; Docker Compose is not installed on the host. Runtime RAM limits are 256 MiB frontend and 128 MiB backend, with bounded swap, lower CPU shares, automatic restarts, and rotated logs. This is a constrained demo and has not been load tested for production capacity. Build images outside EC2 to avoid competing with NourishNet for build memory.

## 1. Access and prerequisites

You need repository access, authenticated GitHub CLI (`gh`), SSH, and the instance's private `.pem` key. Obtain the key privately from the owner and keep it out of Git. Existing SSH access does not require local AWS access keys. Docker and Caddy are already installed on this instance.

**Local:**

```bash
gh auth status
git status --short
git pull --ff-only origin main
SSH_KEY='/absolute/path/to/nourishnet-key.pem'
EC2_HOST='ec2-user@3.92.95.188'
chmod 600 "$SSH_KEY"
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$EC2_HOST"
```

**EC2:** inspect existing services and capacity before deploying:

```bash
free -m
df -h /
sudo docker ps
sudo docker stats --no-stream
sudo ss -lntp
```

Keep the existing `nourishnet` and `caddy` containers running. Exit the SSH session before running the next local commands.

## 2. Build images on GitHub

Commit and push the intended source first. Only the public Supabase URL and **publishable** key are build inputs. Private DB URLs/passwords, service-role keys, and OpenRouter credentials must never be build arguments or workflow inputs.

**Local:**

```bash
SUPABASE_URL='https://zqtndgqyaibgrholekxu.supabase.co'
SUPABASE_PUBLISHABLE_KEY='YOUR_PUBLIC_PUBLISHABLE_KEY'
gh workflow run ec2-images.yml --ref main \
  -f supabase_url="$SUPABASE_URL" \
  -f supabase_publishable_key="$SUPABASE_PUBLISHABLE_KEY"
gh run list --workflow ec2-images.yml --limit 5
```

Take the numeric ID from the run URL returned by dispatch. Choose your own run if a teammate is building concurrently.

```bash
RUN_ID='REPLACE_WITH_YOUR_RUN_ID'
gh run watch "$RUN_ID" --exit-status
IMAGE_TAG=$(gh run view "$RUN_ID" --json headSha --jq .headSha)
ARTIFACT_DIR=$(mktemp -d /tmp/bizzimpact-images.XXXXXX)
gh run download "$RUN_ID" --name "ec2-images-$IMAGE_TAG" --dir "$ARTIFACT_DIR"
```

The archive at `$ARTIFACT_DIR/bizzimpact-images.tar.gz` contains `bizzimpact-website:$IMAGE_TAG` and `bizzimpact-backend:$IMAGE_TAG`. Tags are full Git commit SHAs. Artifacts expire after **three days**; dispatch a new build if an old artifact is gone. Documentation-only commits after a build do not change its image tag.

### Optional: build on a different machine with Docker

Use a clean checkout at the tagged commit. These commands require an existing running Docker engine. The target EC2 is AMD64, so Apple Silicon machines must explicitly target `linux/amd64`.

```bash
IMAGE_TAG=$(git rev-parse HEAD)
docker buildx build --platform linux/amd64 --load \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$SUPABASE_PUBLISHABLE_KEY" \
  -t "bizzimpact-website:$IMAGE_TAG" website
docker buildx build --platform linux/amd64 --load \
  -t "bizzimpact-backend:$IMAGE_TAG" backend
ARTIFACT_DIR=$(mktemp -d /tmp/bizzimpact-images.XXXXXX)
docker save "bizzimpact-website:$IMAGE_TAG" "bizzimpact-backend:$IMAGE_TAG" \
  | gzip > "$ARTIFACT_DIR/bizzimpact-images.tar.gz"
```

Set the two public Supabase variables as shown above before a manual build. Changing public frontend build values requires rebuilding; editing runtime settings alone does not replace browser-bundled values.

## 3. Configure runtime settings privately

For a teammate's first local setup, copy the templates and fill them using an editor. **Skip these copies when the destination already contains configured settings.**

```bash
cp backend/.env.example backend/.env.local
cp deploy/ec2/frontend.env.example deploy/ec2/.env.frontend
chmod 600 backend/.env.local deploy/ec2/.env.frontend
```

The files are excluded from Git. Obtain private values through the owner or Supabase's Connect dialog. Set the backend file to:

```dotenv
DISCOVERY_MODE=catalog
OPENROUTER_ENABLED=false
LIVE_WEB_ENABLED=false
EXPLICIT_LIVE_AUTHORIZED=false
SUPABASE_URL=https://zqtndgqyaibgrholekxu.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
DATABASE_URL=YOUR_PRIVATE_POSTGRESQL_CONNECTION_STRING
```

Use Supabase's **session pooler** URL with `sslmode=require`; the direct database hostname was not reachable during setup. Its username includes the project ref, for example `postgres.PROJECT_REF`. URL-encode special characters in the password if constructing a URL. Keep private values out of screenshots, logs, frontend variables, and Git.

The frontend template uses `DISCOVERY_BACKEND_URL=http://bizzimpact-backend:8001` and sets `SITE_URL` to the public HTTPS origin. Fill its public Supabase key. It needs no database password or service-role key. Production submissions compare Origin to `SITE_URL` because Caddy terminates TLS before forwarding internally over HTTP.

## 4. Transfer and load a release

**Local:** use the same Bash session with `SSH_KEY`, `EC2_HOST`, `IMAGE_TAG`, and `ARTIFACT_DIR` set:

```bash
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$EC2_HOST" \
  'install -d -m 700 /home/ec2-user/bizzimpact'
scp -i "$SSH_KEY" "$ARTIFACT_DIR/bizzimpact-images.tar.gz" \
  "$EC2_HOST:/home/ec2-user/bizzimpact/bizzimpact-images.tar.gz"
git show "$IMAGE_TAG:deploy/ec2/start.sh" > "$ARTIFACT_DIR/start.sh"
scp -i "$SSH_KEY" "$ARTIFACT_DIR/start.sh" "$EC2_HOST:/home/ec2-user/bizzimpact/start.sh"
```

Extract the startup script from the same commit as the images. Do not substitute a newer local script when deploying an older build. If Git cannot find that commit, fetch the repository history before continuing.

For **initial configuration**, transfer environment files too. On later releases, preserve server settings unless deliberately changing them.

```bash
scp -i "$SSH_KEY" backend/.env.local "$EC2_HOST:/home/ec2-user/bizzimpact/backend.env"
scp -i "$SSH_KEY" deploy/ec2/.env.frontend "$EC2_HOST:/home/ec2-user/bizzimpact/frontend.env"
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$EC2_HOST" \
  'chmod 600 /home/ec2-user/bizzimpact/backend.env /home/ec2-user/bizzimpact/frontend.env; chmod 700 /home/ec2-user/bizzimpact/start.sh'
```

**EC2:**

```bash
cd /home/ec2-user/bizzimpact
set -o pipefail
gzip -dc bizzimpact-images.tar.gz | sudo docker load
IMAGE_TAG='REPLACE_WITH_FULL_BUILD_SHA'
```

Local variables are not automatically transferred through SSH. Re-enter the exact full build SHA on EC2. For a **first deployment** with both BizzImpact container names unused:

```bash
sudo bash start.sh "$IMAGE_TAG"
```

The current host already has BizzImpact running. For subsequent releases, use section 8 instead of rerunning the initial startup script.

## 5. Verify containers and database

**EC2:**

```bash
sudo docker ps --filter label=app=bizzimpact
curl -f http://127.0.0.1:3100/auth -o /dev/null
sudo docker exec bizzimpact-backend python -c \
  'import httpx; r=httpx.get("http://127.0.0.1:8001/health"); r.raise_for_status(); print(r.json())'
sudo docker exec bizzimpact-backend python -c \
  'import os; from app.storage import PostgresStore; print({"catalogue_tools": len(PostgresStore(os.environ["DATABASE_URL"]).catalog())})'
sudo docker stats --no-stream
sudo docker inspect bizzimpact-website bizzimpact-backend \
  --format '{{.Name}} image={{.Config.Image}} oom={{.State.OOMKilled}} restarts={{.RestartCount}}'
```

Expect HTTP 200, backend mode `catalog`, paid calls disabled, and 111 researched catalogue records. Guest sessions deliberately use fictional fixtures; authenticated users use permanent database storage and the researched catalogue.

The current Supabase schema and catalogue are already configured. Do not rerun schema migrations on every deployment. For a different empty database, follow [Auth setup](../../website/AUTH_SETUP.md). If reviewed catalogue changes need reseeding explicitly:

```bash
sudo docker exec bizzimpact-backend python seed_catalog.py
```

Seeding writes researched records and makes no model/search calls.

## 6. Configure HTTPS routing once

The hostname is **already configured** on this host. Do not duplicate the block. For a fresh configuration, copy the current Caddyfile to a candidate and merge [the snippet](Caddyfile.bizzimpact) with an editor, preserving NourishNet's block.

**EC2:**

```bash
cp /home/ec2-user/caddy/Caddyfile /home/ec2-user/bizzimpact/Caddyfile.candidate
# Edit the candidate to append the BizzImpact block once.
if sudo docker exec -i caddy caddy validate --config /dev/stdin --adapter caddyfile \
  < /home/ec2-user/bizzimpact/Caddyfile.candidate; then
  # Choose a new backup name for every later proxy change.
  cp -p /home/ec2-user/caddy/Caddyfile /home/ec2-user/bizzimpact/Caddyfile.before-route-change &&
    cp /home/ec2-user/bizzimpact/Caddyfile.candidate /home/ec2-user/caddy/Caddyfile &&
    sudo docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
else
  printf 'Validation failed; the active Caddyfile has not been replaced.\n' >&2
fi
curl -f https://bizzimpact.3-92-95-188.sslip.io/auth -o /dev/null
curl -f https://3-92-95-188.sslip.io/ -o /dev/null
```

Caddy manages HTTPS certificates. The original pre-BizzImpact proxy backup is `/home/ec2-user/bizzimpact/Caddyfile.before-bizzimpact`; preserve it. When replacing the temporary sslip.io hostname with a domain you control, update DNS, Caddy, frontend `SITE_URL`, and Supabase Auth together.

## 7. Finish Supabase Auth setup

In the Supabase dashboard set Site URL to `https://bizzimpact.3-92-95-188.sslip.io` and allow:

```text
https://bizzimpact.3-92-95-188.sslip.io/auth/callback
https://bizzimpact.3-92-95-188.sslip.io/auth/confirm
```

Keep the equivalent `http://localhost:3000` callback/confirm URLs allowed if local development needs them. Then verify genuine signup email, confirmation, login, profile persistence, refresh, logout, and isolation between two accounts. Database-level ownership checks have passed; email delivery and full browser sessions still need verification.

## 8. Update existing containers

Build, transfer and load the new archive using sections 2–4. Keep runtime settings and Caddy unchanged unless the release requires a configuration change. This procedure briefly interrupts BizzImpact; it does not restart NourishNet or Caddy.

**EC2:** set `IMAGE_TAG` to the new build SHA. Run the following block in Bash as a unit. `set -e` stops it on a failed preflight check; reconnect if that exits the SSH shell. Images, environment files, and rollback names are checked before stopping services.

```bash
set -e
test -n "$IMAGE_TAG"
test -s /home/ec2-user/bizzimpact/backend.env
test -s /home/ec2-user/bizzimpact/frontend.env
sudo docker image inspect "bizzimpact-website:$IMAGE_TAG" >/dev/null
sudo docker image inspect "bizzimpact-backend:$IMAGE_TAG" >/dev/null
sudo docker inspect bizzimpact-website bizzimpact-backend --format '{{.Name}} {{.Config.Image}}'
ROLLBACK_SUFFIX="$IMAGE_TAG"
if sudo docker container inspect "bizzimpact-website-rollback-$ROLLBACK_SUFFIX" >/dev/null 2>&1 ||
   sudo docker container inspect "bizzimpact-backend-rollback-$ROLLBACK_SUFFIX" >/dev/null 2>&1; then
  printf 'Rollback name already exists; choose a new ROLLBACK_SUFFIX before updating.\n' >&2
  exit 1
fi
sudo docker stop bizzimpact-website bizzimpact-backend
sudo docker rename bizzimpact-website "bizzimpact-website-rollback-$ROLLBACK_SUFFIX"
sudo docker rename bizzimpact-backend "bizzimpact-backend-rollback-$ROLLBACK_SUFFIX"
sudo bash /home/ec2-user/bizzimpact/start.sh "$IMAGE_TAG"
```

Repeat section 5, both public HTTPS checks, and a complete guest discovery journey. Inspect RAM/swap, OOM counters, and restart counts. Retain stopped rollback containers and old images until the release is accepted. In-process discovery jobs may be interrupted by a restart.

### Roll back a failed update

Use the same `ROLLBACK_SUFFIX` from the update. Re-enter it after reconnecting if a failed update exited the SSH shell. First confirm the original containers exist with these exact names. Then remove only replacements that were actually created and restore the originals:

```bash
set -e
ROLLBACK_SUFFIX='REPLACE_WITH_SUFFIX_USED_DURING_UPDATE'
sudo docker inspect "bizzimpact-website-rollback-$ROLLBACK_SUFFIX" \
  "bizzimpact-backend-rollback-$ROLLBACK_SUFFIX" --format '{{.Name}} {{.Config.Image}}'
for name in bizzimpact-website bizzimpact-backend; do
  if sudo docker container inspect "$name" >/dev/null 2>&1; then
    sudo docker rm -f "$name"
  fi
done
sudo docker rename "bizzimpact-backend-rollback-$ROLLBACK_SUFFIX" bizzimpact-backend
sudo docker rename "bizzimpact-website-rollback-$ROLLBACK_SUFFIX" bizzimpact-website
sudo docker start bizzimpact-backend bizzimpact-website
```

Guest data in a removed backend container is lost; permanent account data stays in Supabase. Verify both public sites afterward. If Caddy also changed, restore the specific backup from that proxy change, validate it, and reload. Do not restore the original pre-BizzImpact backup for an ordinary image rollback: that would remove BizzImpact's route. Do not prune unrelated Docker resources or stop the shared proxy.

## Troubleshooting and operational limits

| Symptom | Check |
| --- | --- |
| SSH rejects the key | Correct `.pem`, `ec2-user`, file permissions, and IP |
| Artifact missing | Correct run ID, successful upload, three-day retention; rebuild if expired |
| Startup refuses existing container | Use the update procedure, not initial startup |
| HTTP 502 | Container state, loopback port 3100, Docker network, and backend URL |
| Submission returns 403 | HTTPS `SITE_URL` must match the browser's public origin |
| Login succeeds, profile storage fails | Backend private DB URL, project/key, migrations, and grants |
| Confirmation points to localhost | Supabase Site URL and allowed redirect settings |
| Restarts/slowness | Memory limits, swap, OOM counters; shared t2.micro capacity is limited |

Targeted logs: `sudo docker logs --tail 100 bizzimpact-website` or `sudo docker logs --tail 100 bizzimpact-backend`. Do not print container environment values to troubleshoot.

Guest SQLite data is ephemeral inside the backend container. Permanent account data and catalogue records live in Supabase. Discovery jobs run in the Python process; durable worker recovery remains future work. Paid model calls and live web retrieval remain disabled; deploying does not authorize enabling them.
