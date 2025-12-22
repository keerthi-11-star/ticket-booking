#!/bin/bash
# Diagnostic script to troubleshoot Grafana "No Data" issue

echo "🔍 Diagnosing Prometheus Metrics Collection"
echo "============================================"
echo ""

echo "1️⃣ Checking if backend pods are running..."
kubectl get pods -n movieticket -l app=movieticket-api
echo ""

echo "2️⃣ Testing backend /metrics endpoint..."
echo "Running: kubectl run test-curl --image=curlimages/curl --rm -it --restart=Never -- curl -s http://movieticket-api.movieticket.svc.cluster.local:80/metrics"
kubectl run test-curl --image=curlimages/curl --rm -it --restart=Never -- curl -s http://movieticket-api.movieticket.svc.cluster.local:80/metrics | head -30
echo ""

echo "3️⃣ Checking Prometheus targets..."
kubectl exec -n monitoring deployment/prometheus -- wget -qO- http://localhost:9090/api/v1/targets 2>/dev/null | grep -o '"job":"ticket-booking-backend"[^}]*' | head -5
echo ""

echo "4️⃣ Checking if Prometheus can scrape metrics..."
kubectl exec -n monitoring deployment/prometheus -- wget -qO- http://movieticket-api.movieticket.svc.cluster.local:80/metrics 2>/dev/null | head -20
echo ""

echo "5️⃣ Checking Prometheus logs for errors..."
kubectl logs -n monitoring deployment/prometheus --tail=20 | grep -i error || echo "No errors found"
echo ""

echo "6️⃣ Testing Prometheus query..."
kubectl exec -n monitoring deployment/prometheus -- wget -qO- 'http://localhost:9090/api/v1/query?query=up{job="ticket-booking-backend"}' 2>/dev/null
echo ""

echo "✅ Diagnostic complete!"
echo ""
echo "📝 Next steps:"
echo "- If step 2 shows metrics: Backend is working ✓"
echo "- If step 4 shows metrics: Prometheus can reach backend ✓"
echo "- If step 6 shows value=1: Prometheus is scraping successfully ✓"
echo ""
echo "Access Prometheus: http://35.180.127.197:30090/targets"
echo "Access Grafana: http://35.180.127.197:30300"
