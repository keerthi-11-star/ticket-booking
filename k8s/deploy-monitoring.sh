#!/bin/bash

# Monitoring Stack Deployment Script
# This script deploys Prometheus and Grafana for the ticket booking application

set -e

echo "🚀 Starting Monitoring Stack Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

echo -e "${BLUE}Step 1: Creating monitoring namespace${NC}"
kubectl apply -f k8s/monitoring-namespace.yaml
echo -e "${GREEN}✓ Namespace created${NC}"
echo ""

echo -e "${BLUE}Step 2: Deploying Prometheus${NC}"
kubectl apply -f k8s/prometheus-rbac.yaml
kubectl apply -f k8s/prometheus-config.yaml
kubectl apply -f k8s/prometheus-deployment.yaml
echo -e "${GREEN}✓ Prometheus deployed${NC}"
echo ""

echo -e "${BLUE}Step 3: Deploying Grafana${NC}"
kubectl apply -f k8s/grafana-config.yaml
kubectl apply -f k8s/grafana-dashboard.yaml
kubectl apply -f k8s/grafana-deployment.yaml
echo -e "${GREEN}✓ Grafana deployed${NC}"
echo ""

echo -e "${BLUE}Step 4: Updating backend for Prometheus scraping${NC}"
kubectl apply -f k8s/backend.yaml
echo -e "${GREEN}✓ Backend updated${NC}"
echo ""

echo -e "${YELLOW}Waiting for pods to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=120s
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=120s
echo ""

echo -e "${GREEN}✅ Monitoring stack deployed successfully!${NC}"
echo ""
echo "📊 Access Information:"
echo "===================="

# Get node IP (works for most setups)
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

echo -e "${BLUE}Prometheus:${NC}"
echo "  URL: http://${NODE_IP}:30090"
echo ""
echo -e "${BLUE}Grafana:${NC}"
echo "  URL: http://${NODE_IP}:30300"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo -e "${YELLOW}⚠️  Remember to change the default Grafana password!${NC}"
echo ""
echo "📈 Next Steps:"
echo "1. Open Grafana and navigate to Dashboards → Ticket Booking Application"
echo "2. Check Prometheus targets at Status → Targets"
echo "3. Explore metrics and create custom dashboards"
