# Monitoring Stack Deployment Script for Windows
# This script deploys Prometheus and Grafana for the ticket booking application

Write-Host "🚀 Starting Monitoring Stack Deployment..." -ForegroundColor Cyan
Write-Host ""

# Check if kubectl is available
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ kubectl is not installed. Please install kubectl first." -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Creating monitoring namespace" -ForegroundColor Blue
kubectl apply -f k8s/monitoring-namespace.yaml
Write-Host "✓ Namespace created" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Deploying Prometheus" -ForegroundColor Blue
kubectl apply -f k8s/prometheus-rbac.yaml
kubectl apply -f k8s/prometheus-config.yaml
kubectl apply -f k8s/prometheus-deployment.yaml
Write-Host "✓ Prometheus deployed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Deploying Grafana" -ForegroundColor Blue
kubectl apply -f k8s/grafana-config.yaml
kubectl apply -f k8s/grafana-dashboard.yaml
kubectl apply -f k8s/grafana-deployment.yaml
Write-Host "✓ Grafana deployed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Updating backend for Prometheus scraping" -ForegroundColor Blue
kubectl apply -f k8s/backend.yaml
Write-Host "✓ Backend updated" -ForegroundColor Green
Write-Host ""

Write-Host "Waiting for pods to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=120s
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=120s
Write-Host ""

Write-Host "✅ Monitoring stack deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Access Information:" -ForegroundColor Cyan
Write-Host "===================="

# Get node IP
$NODE_IP = kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}'

Write-Host "Prometheus:" -ForegroundColor Blue
Write-Host "  URL: http://${NODE_IP}:30090"
Write-Host ""
Write-Host "Grafana:" -ForegroundColor Blue
Write-Host "  URL: http://${NODE_IP}:30300"
Write-Host "  Username: admin"
Write-Host "  Password: admin123"
Write-Host ""
Write-Host "⚠️  Remember to change the default Grafana password!" -ForegroundColor Yellow
Write-Host ""
Write-Host "📈 Next Steps:"
Write-Host "1. Open Grafana and navigate to Dashboards → Ticket Booking Application"
Write-Host "2. Check Prometheus targets at Status → Targets"
Write-Host "3. Explore metrics and create custom dashboards"
