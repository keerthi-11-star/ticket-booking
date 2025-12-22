# Quick Deployment Guide for Ubuntu Server

## Deploy Monitoring Stack

Run these commands on your Ubuntu server:

```bash
cd ~/ticket-booking

# Create monitoring namespace
kubectl apply -f k8s/monitoring-namespace.yaml

# Deploy Prometheus
kubectl apply -f k8s/prometheus-rbac.yaml
kubectl apply -f k8s/prometheus-config.yaml
kubectl apply -f k8s/prometheus-deployment.yaml

# Deploy Grafana
kubectl apply -f k8s/grafana-config.yaml
kubectl apply -f k8s/grafana-dashboard.yaml
kubectl apply -f k8s/grafana-deployment.yaml

# Update backend deployment (already has annotations)
kubectl rollout restart deployment/movieticket-api -n movieticket

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=120s
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=120s

# Check status
kubectl get pods -n monitoring
kubectl get svc -n monitoring
```

## Access URLs

Get your server's public IP and access:

- **Prometheus**: `http://<your-server-ip>:30090`
- **Grafana**: `http://<your-server-ip>:30300`
  - Username: `admin`
  - Password: `admin123`

## Verify Metrics

1. Open Prometheus at port 30090
2. Go to Status → Targets
3. Verify `ticket-booking-backend` job shows UP status
4. Open Grafana at port 30300
5. Navigate to Dashboards → Ticket Booking Application
