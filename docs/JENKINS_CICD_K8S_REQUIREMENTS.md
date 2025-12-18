## Jenkins CI/CD for Kubernetes (non-EKS) — Requirements & Changes

This doc summarizes what you need and what to adjust (code + Jenkinsfile) to build, test, push, and deploy the app to Kubernetes with monitoring in place.

### Prerequisites (infra & tooling)
- Jenkins agent with Docker CLI, kubectl, and optionally Helm.
- Network access from the agent to your container registry and Kubernetes API server.
- Kubernetes namespace present (default in pipeline: `movieticket`).
- Container registry repository created (e.g., `movieticket-api`).
- App exposes `/health`; expose `/metrics` if you want Prometheus scraping.

### Jenkins credentials to create
- `docker-registry-url` — string/secret text for the registry URL (e.g., `https://index.docker.io/v1/`).
- `docker-registry-creds` — username/password credential for the registry.
- `kubeconfig-secret` — file credential containing kubeconfig with permissions to patch and rollout the target deployment.

### Repository changes to align CI/CD
- Ensure `backend/package.json` has usable `lint` and `test` scripts (pipeline currently tolerates missing ones).
- Keep Kubernetes manifests/Helm values in sync with the image name/tag produced by the pipeline (`movieticket-api:${BUILD_NUMBER}` + `latest`).
- If using Prometheus Operator, add a `ServiceMonitor` matching the app’s service labels and metrics port.

### Recommended Jenkinsfile adjustments (concise)
- Add namespace/deployment variables to avoid hardcoding:
  - `K8S_NAMESPACE = 'movieticket'`
  - `K8S_DEPLOYMENT = 'movieticket-api'`
- Combine build/tag into one stage; push both `${BUILD_NUMBER}` and `latest` in one push stage.
- Deploy step: use `kubectl set image` (current approach) or switch to Helm for cleaner rollouts.
- Reuse namespace/deployment vars in smoke tests and failure log collection.

### Minimal Jenkinsfile stage outline (imperative deploy)
- Checkout
- Install deps (`npm ci` in `backend`)
- Lint & Test (tolerate missing)
- Build & Tag image (`movieticket-api:${BUILD_NUMBER}` + `latest`)
- Push image (both tags)
- Deploy to Kubernetes (`kubectl set image deployment/${K8S_DEPLOYMENT} ... -n ${K8S_NAMESPACE}`; wait for rollout)
- Smoke Test (`/health` via cluster IP + service port)
- Post: archive logs; on failure, dump pod logs in namespace

### Helm-based deploy alternative
If you prefer Helm, replace the deploy stage with:
```bash
helm upgrade --install movieticket-api ./k8s/chart \
  --set image.repository=${DOCKER_REGISTRY}/${IMAGE_NAME} \
  --set image.tag=${IMAGE_TAG} \
  -n ${K8S_NAMESPACE} --create-namespace
```

### Monitoring hook (Prometheus/Grafana)
- Install `kube-prometheus-stack` via Helm in `monitoring` namespace.
- Expose `/metrics` in the app; add a `ServiceMonitor` targeting the service/port.
- Optional: add `PrometheusRule` alerts for error rate, latency, restarts.

