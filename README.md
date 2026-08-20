# Cloud Native Order Management Platform (v2)

A hardened, feature-complete order management platform: Node.js/Express API,
React frontend, MongoDB, real-time updates, analytics, Kubernetes/Helm,
Terraform, and a gated CI/CD pipeline.

This is a security- and bug-fix pass over the original version of this repo.
See [`CHANGES.md`](./CHANGES.md) for the full list of what was fixed and why.

## ✨ Features

- JWT auth via **httpOnly cookies** (not localStorage) with short-lived
  access tokens, rotating refresh tokens, and CSRF protection
  (double-submit cookie)
- Account lockout after repeated failed logins; rate limiting on all auth
  endpoints
- Orders: pagination, full-text product search, status/price filtering,
  sorting, CSV export
- Order status state machine (`pending → shipped → delivered`, or
  `→ cancelled`) with a full status history, soft delete
- Live analytics dashboard (revenue trend, order status breakdown) via
  MongoDB aggregation + Recharts
- **Real-time order updates** across tabs/devices via Socket.IO
- Structured logging (Winston), request correlation IDs, Prometheus
  `/metrics`, separate liveness/readiness probes, graceful shutdown
- Integration test suite (Jest + Supertest + in-memory MongoDB)
- Helm chart with HPA, PodDisruptionBudgets, NetworkPolicies, and secrets
  sourced from a Kubernetes `Secret` — never from `values.yaml`
- CI pipeline: tests → build → **vulnerability scan gates the push** →
  deploy, with pinned action versions

## 📋 Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Kubernetes cluster (EKS/GKE/AKS/local) + Helm 3.x, for the k8s path
- Terraform, for the AWS infra path

## 🚀 Quick Start (local dev)

```bash
git clone <this-repo>
cd cloud-native-cicd-platform
cp .env.example .env          # fill in JWT secrets, Grafana password
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000 (`/health`, `/metrics`)
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

Or run backend/frontend directly without Docker:

```bash
cd backend && cp .env.example .env && npm install && npm run dev
cd frontend && cp .env.example .env && npm install && npm start
```

## 🔐 Environment Variables

See `backend/.env.example` and `frontend/.env.example`. **No real secrets
are committed anywhere in this repo** — generate your own:

```bash
openssl rand -hex 64   # for JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
```

## ☸️ Kubernetes Deployment

```bash
kubectl create secret generic backend-secrets \
  --from-literal=mongo-url='mongodb+srv://<user>:<pass>@<cluster>/<db>' \
  --from-literal=jwt-access-secret="$(openssl rand -hex 64)" \
  --from-literal=jwt-refresh-secret="$(openssl rand -hex 64)"

helm install user-order-platform ./helm/user-order-platform
kubectl get pods
kubectl get svc
```

See [`helm/user-order-platform/README.md`](./helm/user-order-platform/README.md).

## 🏗️ Infrastructure (Terraform)

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

Nodes run in private subnets behind a NAT gateway; restrict
`cluster_endpoint_public_access_cidrs` to your own IP ranges before
applying to a real environment.

## 📊 Monitoring

- `GET /metrics` on the backend (Prometheus format, via `prom-client`)
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (dashboard auto-loaded from
  `monitoring/grafana/dashboards.json`)

## 🧪 Tests

```bash
cd backend && npm test
```

## 📝 API Overview

### Auth
- `POST /auth/register`, `POST /auth/login` — rate-limited, set httpOnly
  cookies + return a `csrfToken`
- `POST /auth/refresh` — rotates the refresh token
- `POST /auth/logout`
- `GET /auth/me`

### Orders (all require auth; mutating requests require `X-CSRF-Token`)
- `GET /orders?page=&limit=&status=&search=&sort=&minPrice=&maxPrice=`
- `POST /orders`
- `GET /orders/:id`
- `PUT /orders/:id` — `{ status }`, validated against the allowed state
  transitions
- `DELETE /orders/:id` — soft delete
- `GET /orders/stats/summary` — aggregated analytics
- `GET /orders/export/csv`

## 🤝 Contributing

1. Create a feature branch
2. `npm test` in `backend/` before opening a PR
3. Push and open a Pull Request — CI runs tests + a gated vulnerability scan

## 📄 License

ISC
