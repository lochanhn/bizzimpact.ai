# Shared EC2 deployment

Live URL: https://bizzimpact.3-92-95-188.sslip.io (deployed November 8, 2026).

Verified over public HTTPS: temporary guest session, profile creation, baseline retrieval, completed landscaping discovery, logout/data cleanup, and rejection of an unrelated Origin. The guest scenario used zero model/search calls. Backend database connectivity and all 111 researched catalogue records were verified inside EC2. NourishNet returned HTTP 200 after deployment. All 45 frontend tests and TypeScript checking passed; both Docker image builds passed in GitHub Actions.

Running image tags: frontend `200dda57d6bc860b9ca513992a8636f2346be968`; backend `1e98ed592516d0a597ebac3fa7965d0aafe52b55`. The stopped `bizzimpact-website-before-proxy-fix` container is retained for inspection, but its submission check predates the HTTPS fix. Supabase Auth URL configuration and genuine email/session checks remain pending; see `website/AUTH_SETUP.md`.

Target: existing Amazon Linux host `3.92.95.188` (`i-0c83c7fa3551b554c`). NourishNet already uses Caddy and localhost port 8010. BizzImpact uses its own Docker network, a private backend, and localhost port 3100. The Caddy snippet adds a separate hostname; preserve the existing configuration.

The host is a t2.micro with about 1 GiB RAM and 2 GiB swap. Build images in GitHub Actions using **Build EC2 images**, then download its image archive and copy it to the host. Do not run the Next.js build on the shared server. Runtime limits are 256 MiB for the website and 128 MiB for the backend, with bounded swap and lower CPU shares than the existing app. These limits are for a small demo and do not establish production capacity.

## Initial deployment

1. Run the image workflow with the Supabase URL and publishable key. Images are tagged with the workflow's full Git commit SHA. Only public connection values belong in build arguments; environment files are excluded from both build contexts.
2. Create `/home/ec2-user/bizzimpact` with permissions 700. Copy `start.sh`, the archive, the private backend environment as `backend.env`, and frontend settings as `frontend.env` into it. Set environment files to permissions 600. The frontend settings template is `frontend.env.example`; the backend settings use the local configured `backend/.env.local`. Keep discovery mode `catalog` and live flags off.
3. On EC2, load images using `gzip -dc bizzimpact-images.tar.gz | sudo docker load`. Then run `sudo bash start.sh FULL_COMMIT_SHA` from that directory. The script refuses to replace existing containers.
4. Check the new containers, backend `/health` from inside the private Docker network, and `http://127.0.0.1:3100/auth`. Inspect RAM, swap, and OOM counters before enabling public traffic.
5. Back up the existing `/home/ec2-user/caddy/Caddyfile`. Validate a combined candidate using the running Caddy container, then add `Caddyfile.bizzimpact` and reload Caddy. Preserve the current NourishNet block and verify both websites after reload.
6. In Supabase Auth, set Site URL to `https://bizzimpact.3-92-95-188.sslip.io` and allow `/auth/callback` and `/auth/confirm` on that origin. Local development can remain in the allowed redirect list. Verify signup email, sign-in, refresh, and logout with genuine accounts before claiming those flows verified.

The temporary hostname uses sslip.io. Replace it with a domain you control for a longer deployment, updating Caddy, frontend `SITE_URL`, and Supabase Auth URLs together.

Production form submissions compare Origin to the configured HTTPS `SITE_URL`. Keep that setting synchronized with the public hostname; the internal Docker URL is HTTP because Caddy terminates TLS.

## Isolation and rollback

Only the frontend binds a host port, on loopback. The backend is reached by the frontend using Docker DNS. Caddy continues owning ports 80 and 443. No additional EC2 security-group port is required.

To remove this initial deployment, stop and remove only `bizzimpact-website` and `bizzimpact-backend`, remove only its Caddy hostname block, validate and reload Caddy, then verify NourishNet. Keep images until rollback is no longer needed. Do not stop the shared Caddy container or prune unrelated Docker resources.

The SQLite guest demo is ephemeral within the backend container. Signed-in business data and the researched catalogue use Supabase/PostgreSQL. Backend discovery jobs run in the Python process and can be interrupted by restarts; durable worker recovery remains future work.
