# Changes from the original repo

## 🚨 Critical security fixes

| Issue | Fix |
|---|---|
| Live MongoDB Atlas credentials committed in `docker-compose.yml` and `helm/values.yaml` | Removed entirely. `docker-compose.yml` now uses the local `mongodb` container by default; the Helm chart reads `MONGO_URL` from a K8s `Secret` you create out of band. **You must still rotate the exposed Atlas password and purge it from git history** — this repo can't undo an exposure that already happened. |
| Weak, committed JWT secret in the Helm `Secret` template | Removed the template. JWT secrets now come only from the same out-of-band `backend-secrets` Secret. |
| CORS reflected any `Origin` with `credentials: true` | Explicit origin allowlist (`FRONTEND_URL`, comma-separated for multiple origins). |
| JWT stored in `localStorage` (XSS-stealable) | Access/refresh tokens are now httpOnly cookies. Added double-submit-cookie CSRF protection since cookie auth needs it. |
| No rate limiting on login/register | `express-rate-limit` on all `/auth` routes; account lockout after 5 failed attempts. |
| No input validation | `express-validator` on every mutating route (email format, password strength, quantity/price bounds, status enum). |
| Errors leaked raw internals (`error.message`) to clients | Centralized error handler normalizes Mongoose/driver errors into clean 4xx responses; stack traces never reach the client. |
| No NoSQL-injection/HTTP-parameter-pollution protection | Added `express-mongo-sanitize` and `hpp`. |
| No security headers | Added `helmet`. |

## 🐛 Bug fixes

- **Port chaos**: backend defaulted to 5000 in one place, Dockerfile exposed 3000, Helm used 3000, compose used 5000. Standardized on `PORT=5000` everywhere.
- **Frontend port mismatch**: `docker-compose.yml` mapped `3000:3000` for an nginx container that listens on 80. Frontend now uses `nginxinc/nginx-unprivileged` on port 8080 (also required to make `runAsNonRoot: true` work in Kubernetes — stock `nginx:alpine` needs root to bind port 80).
- **Frontend health check** in `docker-compose.yml` curled the *backend's* port from inside the frontend container. Fixed to check the frontend's own port.
- **CastError → 500**: an invalid Mongo ObjectId in `:id` params used to throw an uncaught `CastError`. Added `validateObjectId` middleware → clean `400`.
- **Prometheus scrape targets didn't exist** (`backend-service:5000` vs. the actual Service name `backend` on port 80) and **no `/metrics` endpoint existed at all**. Added `prom-client` instrumentation and fixed the scrape config.
- **Grafana dashboard had empty `targets: []`** on every panel. Replaced with real PromQL against the new metrics.
- **CI scanned images after already pushing them** to Docker Hub, and had no severity threshold, so a critical CVE couldn't fail the build either way. Reordered: build → scan (gates on CRITICAL/HIGH) → push → update Helm values.
- **No tests anywhere**, and CI didn't run any. Added a Jest + Supertest + in-memory MongoDB integration suite and a CI job that runs it.
- **Unused/contradictory ConfigMap** (`backend-config`) that the Deployment never referenced, pointing at an in-cluster `mongodb:27017` service that was never deployed. Removed; `values.yaml` documents that Mongo is external (Atlas) with clear egress rules in the NetworkPolicy.
- **NetworkPolicy hardcoded port 3000** regardless of the configured service port, and had an egress rule to a MongoDB pod selector that never matched anything (Mongo is external). Templated the ports from `values.yaml` and switched Mongo egress to an internet/DNS rule.
- **EKS nodes in "public" subnets with no NAT gateway and no `map_public_ip_on_launch`** — nodes had no reliable route to pull images or join the cluster. Split into real public/private subnets with a NAT gateway; nodes run in private subnets.
- **Terraform used local state** (no locking, not shareable). Added a documented (commented, since it needs a pre-created bucket) S3 + DynamoDB remote backend.
- **`desired_size = 1`, single `t3.micro`** — no HA. Bumped to a 2-node minimum across two AZs.

## ✨ New features (this was "just" an order CRUD app before)

- Order status state machine (`pending → shipped → delivered`, or `→ cancelled` from either) with full status history and soft delete instead of hard delete
- Pagination, full-text product search, status/price filtering, and sorting on `GET /orders`
- `GET /orders/stats/summary` — aggregated revenue, average order value, breakdown by status, 30-day daily trend
- `GET /orders/export/csv`
- Live dashboard with charts (Recharts) instead of a static welcome page
- Real-time order updates across tabs/devices via Socket.IO, authenticated with the same session cookie as the REST API
- Human-readable order numbers (`ORD-YYYYMMDD-NNNN`)
- Refresh-token rotation with revocation on logout/reuse detection
- Role field on users (`user`/`admin`) and a reusable `requireRole` middleware, ready for admin-only endpoints
- Structured logging with request-correlation IDs
- Separate liveness/readiness probes and graceful shutdown (SIGTERM-safe for rolling deploys)
- HorizontalPodAutoscalers and PodDisruptionBudgets for both services
- A real Ingress with TLS instead of a bare `LoadBalancer` Service
