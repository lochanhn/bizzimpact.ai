# BizzImpact.ai

Phase 1 helps small-business owners describe their business and discover suitable AI tools with evidence and clear unknowns. The project uses a Next.js frontend, FastAPI backend, and Supabase authentication/PostgreSQL.

## Team references

- **[Docker packaging and EC2 deployment](deploy/ec2/README.md)** — build images, deploy to the shared EC2 host, configure runtime settings and HTTPS, verify, update, and roll back.
- [Application README](website/README.md) — local development, routes, checks, and data sources.
- [Authentication and database setup](website/AUTH_SETUP.md) — current Supabase configuration and remaining account checks.
- [Phase 1 implementation audit](website/PHASE1_STATUS.md) — original feature and verification record.

Live demo: https://bizzimpact.3-92-95-188.sslip.io. It shares EC2 with NourishNet using separate Docker containers and an existing Caddy proxy. The guest discovery flow was verified over HTTPS; public Supabase email redirect configuration and genuine signup/session checks remain pending.

Pushing source to GitHub does not automatically deploy it. Follow the deployment README to build and release images. Keep private environment files, database credentials, SSH keys, and paid-provider credentials out of Git.
