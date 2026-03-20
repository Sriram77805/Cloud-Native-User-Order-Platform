# Cloud Native CI/CD Platform

A complete cloud-native application platform with Node.js backend, React frontend, Kubernetes orchestration, and automated CI/CD pipelines.

## 📋 Prerequisites

- Docker & Docker Compose
- Kubernetes cluster (EKS, GKE, AKS, or local)
- Helm 3.x
- Terraform (for infrastructure)
- Node.js 18+
- MongoDB

## 🚀 Quick Start

### Local Development

1. **Clone the repository:**
```bash
cd cloud-native-cicd-platform
```

2. **Setup Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm start
```

3. **Setup Frontend:**
```bash
cd frontend
cp .env.example .env
# Edit .env with API URL (http://localhost:3000)
npm install
npm start
```

## 🔐 Environment Variables

### Backend (.env)
```
PORT=3000
MONGO_URL=mongodb://mongodb:27017/user-order-db
JWT_SECRET=your-super-secret-key-change-in-production
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3000
```

## 🐳 Docker Build

```bash
# Backend
docker build -t yourusername/backend-app:latest ./backend

# Frontend
docker build -t yourusername/frontend-app:latest ./frontend
```

## ☸️ Kubernetes Deployment

### Prerequisites
1. Update Helm values:
```bash
# Edit helm/user-order-platform/values.yaml
# Change image repository and update environment variables
```

2. Create secrets:
```bash
kubectl create secret generic backend-secrets \
  --from-literal=jwt-secret='your-super-secret-jwt-key'
```

### Deploy with Helm
```bash
helm install user-order-platform ./helm/user-order-platform/
```

### Verify Deployment
```bash
kubectl get pods
kubectl get svc
kubectl logs -f deployment/backend
```

## 🔄 CI/CD Pipeline

The GitHub Actions workflow automates:
1. Building Docker images for backend and frontend
2. Pushing to Docker registry
3. Running security scans with Trivy
4. Uploading results to GitHub Security

### Setup
1. Add GitHub Secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub token

2. Workflow triggers on push to `main` branch

## 🏗️ Infrastructure (Terraform)

Deploy EKS cluster:
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## 📊 Monitoring

### Prometheus
Access metrics at: `http://prometheus:9090`

### Grafana
Access dashboards at: `http://grafana:3000`

## 🔒 Security Features

✅ JWT authentication with Bearer tokens
✅ Password hashing with bcryptjs
✅ CORS configuration
✅ Network policies for pod-to-pod communication
✅ Kubernetes health checks (liveness & readiness probes)
✅ Environment-based secrets management
✅ Docker image vulnerability scanning

## 📁 Project Structure

```
.
├── backend/              # Node.js Express API
├── frontend/             # React web application
├── helm/                 # Kubernetes Helm charts
├── terraform/            # Infrastructure as Code
├── monitoring/           # Prometheus & Grafana
├── argocd/              # GitOps configuration
└── .github/workflows/    # CI/CD pipelines
```

## 🐛 Troubleshooting

### Backend won't start
- Ensure `JWT_SECRET` is set in environment
- Check MongoDB connection with `MONGO_URL`

### Frontend can't connect to API
- Verify `REACT_APP_API_URL` environment variable
- Check CORS settings in backend

### Kubernetes pods not ready
- Check pod logs: `kubectl logs <pod-name>`
- Verify health endpoints: `kubectl exec <pod-name> -- curl localhost:3000/health`

## 📝 API Documentation

### Authentication
- **POST** `/auth/register` - Register new user
- **POST** `/auth/login` - Login user

### Orders (Protected - requires JWT)
- **POST** `/orders` - Create order
- **GET** `/orders` - Get user's orders
- **PUT** `/orders/:id` - Update order status
- **DELETE** `/orders/:id` - Delete order

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Push to branch
4. Create Pull Request

## 📄 License

ISC
