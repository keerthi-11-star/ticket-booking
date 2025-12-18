## CI/CD on Kubernetes (no EKS) with Prometheus & Grafana

Step-by-step plan to build, test, deploy, and observe a function-style service on a vanilla Kubernetes cluster.

### 1) Prereqs
- Kubernetes cluster reachable via `kubectl` (e.g., k3s, kubeadm, kind for local).
- Container registry and credentials (Docker Hub/GHCR/self-hosted).
- Helm installed on your workstation/CI runner.
- CI secrets: `REGISTRY_USER`, `REGISTRY_TOKEN`, `REGISTRY_URL`, `IMAGE_NAME`, `KUBECONFIG` (base64), and optionally `NAMESPACE`.

### 2) Cluster bootstrap (quick options)
- Local/dev: `k3s` (`curl -sfL https://get.k3s.io | sh -`) or `kind create cluster`.
- Small prod: `kubeadm init` + join workers; enable `kubectl` access with the generated kubeconfig.

### 3) Monitoring stack
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace
```
- Access Grafana (dev): `kubectl -n monitoring port-forward svc/monitoring-grafana 3000:80`.
- For shared access, create an Ingress with auth/OIDC.

### 4) App Helm chart layout (example)
- `chart/templates/deployment.yaml` — set image repo/tag, env, resources.
- `chart/templates/service.yaml` — expose app and `/metrics` endpoint.
- `chart/templates/hpa.yaml` — CPU/memory autoscale; or KEDA `ScaledObject` if event-driven.
- `chart/templates/servicemonitor.yaml` — scrape `/metrics` via Prometheus Operator CRDs.
- `values.yaml` — defaults; override image tag in CI.

### 5) CI (build + test + publish)
- Trigger: PR + push to main.
- Steps: checkout → install deps → tests → build image → push `latest` + `${{ github.sha }}` tags.
- Tools: Docker buildx, or kaniko if running in-cluster.

### 6) CD (deploy)
Imperative from CI:
```bash
helm upgrade --install function-processor ./chart \
  --set image.repository=$REGISTRY_URL/$IMAGE_NAME \
  --set image.tag=$GIT_SHA \
  --namespace ${NAMESPACE:-apps} --create-namespace
```
GitOps alternative:
- Argo CD watches your manifests/Helm values repo and syncs automatically.
- CI only bumps the image tag in values; Argo applies it.

### 7) Example GitHub Actions workflow
```yaml
name: ci-cd
on:
  push:
    branches: [main]
  pull_request:
jobs:
  build-test-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18 }
      - run: npm ci && npm test
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ${{ secrets.REGISTRY_URL }}
          username: ${{ secrets.REGISTRY_USER }}
          password: ${{ secrets.REGISTRY_TOKEN }}
      - name: Build and push
        run: |
          IMAGE=${{ secrets.REGISTRY_URL }}/${{ secrets.IMAGE_NAME }}
          TAG=${{ github.sha }}
          docker build -t $IMAGE:$TAG -t $IMAGE:latest .
          docker push $IMAGE:$TAG
          docker push $IMAGE:latest
      - name: Helm deploy
        if: github.ref == 'refs/heads/main'
        env:
          KUBECONFIG_B64: ${{ secrets.KUBECONFIG }}
          IMAGE: ${{ secrets.REGISTRY_URL }}/${{ secrets.IMAGE_NAME }}
        run: |
          echo "$KUBECONFIG_B64" | base64 -d > kubeconfig
          export KUBECONFIG=$PWD/kubeconfig
          helm upgrade --install function-processor ./chart \
            --set image.repository=$IMAGE \
            --set image.tag=${{ github.sha }} \
            --namespace ${NAMESPACE:-apps} --create-namespace
```

### 8) Observability wiring
- App exports Prometheus metrics at `/metrics` (Prom format).
- `Service` exposes that port; `ServiceMonitor` targets the service label/port.
- Dashboards: use kube-prometheus-stack defaults; add custom panels for latency, error rate, queue depth.
- Alerts: configure `PrometheusRule` for key SLOs (error rate, high latency, pod restarts).

### 9) Validation checklist
- `kubectl get pods -n apps` → pods Running.
- `kubectl get servicemonitor -n monitoring` → app monitor exists.
- `kubectl -n monitoring port-forward svc/monitoring-prometheus-kube-prometheus 9090` → targets are up.
- Grafana dashboards show app metrics; alerts fire to your receiver (Email/Slack).

### 10) Security basics
- Use namespaced service account for CI deploy; RBAC scoped to target namespace.
- ImagePullSecret configured in namespace.
- NetworkPolicies to restrict traffic paths.
- Scan images in CI (e.g., Trivy) before push.

