# Troubleshooting Guide - No Data in Grafana

## Quick Fix Commands

Run these on your Ubuntu server to fix the metrics collection:

```bash
cd ~/ticket-booking

# Pull the updated Prometheus config
git pull origin main

# Apply the updated configuration
kubectl apply -f k8s/prometheus-config.yaml

# Restart Prometheus to pick up the new config
kubectl rollout restart deployment/prometheus -n monitoring

# Wait for Prometheus to restart
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=120s

# Verify the backend metrics endpoint is working
kubectl exec -n monitoring deployment/prometheus -- wget -qO- http://movieticket-api.movieticket.svc.cluster.local:80/metrics | head -20
```

## Verify Metrics Are Being Collected

1. **Check Prometheus Targets**:
   - Open: http://35.180.127.197:30090/targets
   - Look for `ticket-booking-backend` job
   - Status should be **UP** (green)

2. **Test a Query in Prometheus**:
   - Open: http://35.180.127.197:30090/graph
   - Enter query: `up{job="ticket-booking-backend"}`
   - Click **Execute**
   - Should show value `1`

3. **Check Grafana**:
   - Open: http://35.180.127.197:30300
   - Go to **Ticket Booking Application** dashboard
   - Data should now appear

## If Still No Data

Check if the backend is exposing metrics:

```bash
# Port-forward to backend
kubectl port-forward -n movieticket svc/movieticket-api 8080:80

# In another terminal, test metrics
curl http://localhost:8080/metrics
```

You should see output like:
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/health",status="200"} 42
...
```

If you don't see metrics, the backend application might not be exposing them correctly.
