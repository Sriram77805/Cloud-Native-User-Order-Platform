# Deploying this chart

This chart deliberately does **not** template any secret values (Mongo
connection string, JWT signing secrets) from `values.yaml`. A previous
version of this repo committed a live MongoDB Atlas connection string and a
placeholder JWT secret straight into `values.yaml`/a Helm `Secret` template
that lived in git - both were exposed as soon as the repo went public.

Before installing, create the secret out of band:

```bash
kubectl create secret generic backend-secrets \
  --from-literal=mongo-url='mongodb+srv://<user>:<pass>@<cluster>/<db>' \
  --from-literal=jwt-access-secret="$(openssl rand -hex 64)" \
  --from-literal=jwt-refresh-secret="$(openssl rand -hex 64)"
```

Or manage it with External Secrets Operator / Sealed Secrets / your cloud
provider's secret manager in production - `kubectl create secret` is fine
for local/demo clusters only.

Then install as usual:

```bash
helm install user-order-platform ./helm/user-order-platform
```
