# 🚀 EC2 Ubuntu Setup Guide - MovieTicket Application

Complete step-by-step guide to deploy the MovieTicket application on an Ubuntu EC2 instance from scratch.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [EC2 Instance Setup](#ec2-instance-setup)
- [Initial Server Configuration](#initial-server-configuration)
- [Install Prerequisites](#install-prerequisites)
- [Application Setup](#application-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Production Deployment](#production-deployment)
- [Security Hardening](#security-hardening)
- [Nginx Reverse Proxy](#nginx-reverse-proxy)
- [Systemd Service](#systemd-service)
- [Firewall Configuration](#firewall-configuration)
- [Troubleshooting](#troubleshooting)

## ✅ Prerequisites

Before starting, ensure you have:

- An AWS account
- EC2 instance with Ubuntu 20.04 LTS or 22.04 LTS
- SSH access to your EC2 instance
- Basic knowledge of Linux commands
- Domain name (optional, for production)

## 🖥️ EC2 Instance Setup

### Step 1: Launch EC2 Instance

1. **Go to AWS EC2 Console**
   - Log in to AWS Console
   - Navigate to EC2 Dashboard

2. **Launch Instance**
   - Click "Launch Instance"
   - Choose Ubuntu Server 22.04 LTS (or 20.04 LTS)
   - Select instance type: `t2.micro` (free tier) or `t3.small` (recommended)
   - Configure instance:
     - Number of instances: 1
     - Network: Default VPC or create new
     - Subnet: Any
     - Enable "Auto-assign Public IP"
   - Storage: 20 GB (minimum)
   - Security Group: Create new or use existing
     - Rules needed:
       - SSH (22) from your IP
       - HTTP (80) from anywhere (0.0.0.0/0)
       - HTTPS (443) from anywhere (0.0.0.0/0)
       - Custom TCP 3000 from anywhere (for API - can restrict later)
       - Custom TCP 8080 from anywhere (for frontend - can restrict later)

3. **Key Pair**
   - Create new key pair or use existing
   - Download `.pem` file
   - Save securely

4. **Launch Instance**
   - Review and launch
   - Wait for instance to be running

### Step 2: Connect to EC2 Instance

```bash
# On Windows (PowerShell)
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip

# On Linux/Mac
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Replace:
# - your-key.pem with your key file name
# - your-ec2-public-ip with your EC2 public IP or DNS
```

### Step 3: Note Your Instance Details

After connecting, note:
- Public IP: `xxx.xxx.xxx.xxx`
- Instance ID: `i-xxxxxxxxx`
- Public DNS: `ec2-xxx-xxx-xxx-xxx.compute-1.amazonaws.com`

## 🔧 Initial Server Configuration

### Step 1: Update System

```bash
# Update package list
sudo apt update

# Upgrade all packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git vim unzip software-properties-common \
    apt-transport-https ca-certificates gnupg lsb-release
```

### Step 2: Configure Timezone

```bash
sudo timedatectl set-timezone UTC
```

### Step 3: Create Application User (Optional but Recommended)

```bash
# Create dedicated user for application
sudo adduser movieticket
sudo usermod -aG sudo movieticket

# Switch to application user
sudo su - movieticket
```

## 📦 Install Prerequisites

### Step 1: Install Node.js (v18+)

```bash
# Update package index
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

### Step 2: Install MongoDB

#### Option A: MongoDB Community Edition (Local)

```bash
# Import MongoDB public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod

# Check MongoDB version
mongod --version
```

#### Option B: MongoDB Atlas (Cloud - Recommended for Production)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user
4. Whitelist EC2 IP address (or 0.0.0.0/0 for testing)
5. Get connection string
6. Save connection string for later use

```bash
# No local MongoDB installation needed if using Atlas
```

### Step 3: Install Docker (Optional - for containerized deployment)

```bash
# Remove old Docker versions
sudo apt remove -y docker docker-engine docker.io containerd runc

# Install prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package list
sudo apt update

# Install Docker
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Verify Docker installation
docker --version
docker compose version

# Log out and log back in for group changes to take effect
# Or run: newgrp docker
```

### Step 4: Install Nginx (For Production Reverse Proxy)

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx

# Check Nginx version
nginx -v
```

### Step 5: Install PM2 (Process Manager for Node.js)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the instructions shown
```

## 📥 Application Setup

### Step 1: Clone or Upload Application

#### Option A: Clone from Git Repository

```bash
# Navigate to home directory
cd ~

# Clone repository (replace with your repository URL)
git clone <your-repository-url> movieticket
cd movieticket

# Or if you have the files locally, use SCP to upload
```

#### Option B: Upload Files via SCP

From your local machine:

```bash
# On Windows (PowerShell)
scp -i "your-key.pem" -r .\project ubuntu@your-ec2-ip:~/

# On Linux/Mac
scp -i your-key.pem -r ./project ubuntu@your-ec2-ip:~/

# Then on EC2:
cd ~/project
```

### Step 2: Setup Backend

```bash
# Navigate to backend directory
cd ~/movieticket/backend

# Copy environment file
cp env.example .env

# Edit environment file
nano .env
# Or use vim: vim .env
```

Edit `.env` file with your configuration:

```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/movieticket
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/movieticket

JWT_SECRET=your-super-secret-jwt-key-change-this-generate-with-openssl-rand-base64-32
JWT_EXPIRE=7d
CORS_ORIGIN=http://your-domain.com
```

Generate a secure JWT secret:

```bash
openssl rand -base64 32
```

Save and exit (Ctrl+X, then Y, then Enter for nano).

```bash
# Install backend dependencies
npm install --production

# Verify installation
ls node_modules/
```

### Step 3: Setup Frontend

```bash
# Navigate to frontend directory
cd ~/movieticket/frontend

# Update API base URL if needed
# For production, update frontend/js/auth.js
nano js/auth.js
```

If your API will be on a different domain/IP, update the API_BASE_URL:

```javascript
const API_BASE_URL = 'http://your-ec2-ip:3000/api';
// Or if using domain:
// const API_BASE_URL = 'http://your-domain.com/api';
```

### Step 4: Seed Database

```bash
# Navigate back to backend
cd ~/movieticket/backend

# Run seed script to create admin user
npm run seed

# You should see:
# Admin user created successfully:
# Email: admin@movieticket.com
# Password: admin123
```

**⚠️ IMPORTANT: Change admin password after first login in production!**

## 🗄️ Database Setup

### MongoDB Configuration (If using local MongoDB)

```bash
# Access MongoDB shell
mongosh

# Or if using older version:
# mongo
```

In MongoDB shell:

```javascript
// Create database
use movieticket

// Create admin user (if seed script didn't work)
db.createUser({
  user: "movieticket_admin",
  pwd: "your-secure-password",
  roles: [ { role: "readWrite", db: "movieticket" } ]
})

// Verify
show dbs
show users

// Exit
exit
```

### Enable MongoDB Authentication (Optional but Recommended)

```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf
```

Add/update security section:

```yaml
security:
  authorization: enabled
```

Restart MongoDB:

```bash
sudo systemctl restart mongod
```

Update `.env` file to include credentials if authentication is enabled:

```env
MONGODB_URI=mongodb://username:password@localhost:27017/movieticket
```

## 🚀 Running the Application

### Option 1: Using PM2 (Recommended for Production)

```bash
# Navigate to backend directory
cd ~/movieticket/backend

# Start application with PM2
pm2 start server.js --name movieticket-api

# Check status
pm2 status

# View logs
pm2 logs movieticket-api

# Monitor
pm2 monit

# Save PM2 configuration
pm2 save

# Setup PM2 to restart on system reboot
pm2 startup
# Follow the command shown (usually involves sudo)
```

### Option 2: Using systemd Service

Create service file:

```bash
sudo nano /etc/systemd/system/movieticket-api.service
```

Add configuration:

```ini
[Unit]
Description=MovieTicket API Service
After=network.target mongod.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/movieticket/backend
Environment=NODE_ENV=production
EnvironmentFile=/home/ubuntu/movieticket/backend/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=movieticket-api

[Install]
WantedBy=multi-user.target
```

Enable and start service:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable movieticket-api

# Start service
sudo systemctl start movieticket-api

# Check status
sudo systemctl status movieticket-api

# View logs
sudo journalctl -u movieticket-api -f
```

### Option 3: Using Docker Compose

```bash
# Navigate to project root
cd ~/movieticket

# Edit docker-compose.yml if needed
nano docker-compose.yml

# Start services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f

# Seed database
docker compose exec api npm run seed
```

### Step 5: Serve Frontend

#### Option A: Using Nginx (Recommended)

See [Nginx Reverse Proxy](#nginx-reverse-proxy) section below.

#### Option B: Using Python Simple Server (Quick Test)

```bash
cd ~/movieticket/frontend
python3 -m http.server 8080

# Keep terminal open or run in background
# Press Ctrl+C to stop
```

#### Option C: Using PM2

```bash
cd ~/movieticket/frontend
pm2 serve . 8080 --name movieticket-frontend --spa
pm2 save
```

## 🌐 Production Deployment

### Nginx Reverse Proxy Setup

#### Step 1: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/movieticket
```

Add configuration:

```nginx
# Upstream for API
upstream movieticket_api {
    server localhost:3000;
}

# HTTP to HTTPS redirect (after SSL setup)
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # For Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (see SSL Setup section)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend
    root /home/ubuntu/movieticket/frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api {
        proxy_pass http://movieticket_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Metrics endpoint (restrict access)
    location /metrics {
        allow 127.0.0.1;
        deny all;
        proxy_pass http://movieticket_api/metrics;
    }

    # Health check
    location /health {
        proxy_pass http://movieticket_api/health;
    }
}
```

#### Step 2: Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/movieticket /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### Step 3: Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose redirect to HTTPS

# Test auto-renewal
sudo certbot renew --dry-run

# Certbot will auto-renew certificates (configured in cron)
```

#### Step 4: Update CORS and API URL

```bash
# Update backend .env
cd ~/movieticket/backend
nano .env
```

Update:

```env
CORS_ORIGIN=https://your-domain.com
```

Update frontend API URL:

```bash
cd ~/movieticket/frontend
nano js/auth.js
```

Update:

```javascript
const API_BASE_URL = 'https://your-domain.com/api';
```

Restart application:

```bash
pm2 restart movieticket-api
# Or
sudo systemctl restart movieticket-api
```

## 🔒 Security Hardening

### Step 1: Firewall Configuration

```bash
# Install UFW (Uncomplicated Firewall)
sudo apt install -y ufw

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (important - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# If not using Nginx, allow direct access (not recommended)
# sudo ufw allow 3000/tcp  # API
# sudo ufw allow 8080/tcp  # Frontend

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### Step 2: Update Security Group in AWS

In AWS EC2 Console:
1. Go to Security Groups
2. Edit inbound rules:
   - Keep SSH (22) from your IP only
   - Keep HTTP (80) and HTTPS (443) from anywhere
   - Remove direct access to 3000 and 8080 if using Nginx

### Step 3: Disable Password Authentication (SSH)

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config
```

Find and set:

```
PasswordAuthentication no
PubkeyAuthentication yes
```

Restart SSH:

```bash
sudo systemctl restart sshd
```

### Step 4: Setup Fail2Ban (Protection against brute force)

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create local config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit config
sudo nano /etc/fail2ban/jail.local
```

Update settings:

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
```

Start Fail2Ban:

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status
```

### Step 5: Regular Security Updates

```bash
# Setup automatic security updates
sudo apt install -y unattended-upgrades

# Configure
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 📊 Monitoring

### Setup PM2 Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Setup Basic Monitoring Script

```bash
# Create monitoring script
nano ~/check-app.sh
```

Add:

```bash
#!/bin/bash
API_URL="http://localhost:3000/health"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $STATUS -ne 200 ]; then
    echo "API is down! Restarting..."
    pm2 restart movieticket-api
    # Or send notification
fi
```

Make executable:

```bash
chmod +x ~/check-app.sh
```

Add to crontab:

```bash
crontab -e
```

Add:

```
*/5 * * * * /home/ubuntu/check-app.sh >> /var/log/app-check.log 2>&1
```

## 🔍 Troubleshooting

### Application Not Starting

```bash
# Check logs
pm2 logs movieticket-api
# Or
sudo journalctl -u movieticket-api -f

# Check if port is in use
sudo lsof -i :3000
sudo netstat -tlnp | grep 3000

# Check Node.js
node --version
which node
```

### MongoDB Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongosh
# Or
mongo
```

### Nginx Issues

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R $USER:$USER ~/movieticket

# Fix permissions
chmod -R 755 ~/movieticket
```

### Check Disk Space

```bash
df -h
du -sh ~/movieticket/*
```

### Check System Resources

```bash
# CPU and Memory
htop
# Or
top

# Network
netstat -tulpn
```

## 📝 Quick Reference Commands

```bash
# Start application
pm2 start ~/movieticket/backend/server.js --name movieticket-api
# Or
sudo systemctl start movieticket-api

# Stop application
pm2 stop movieticket-api
# Or
sudo systemctl stop movieticket-api

# Restart application
pm2 restart movieticket-api
# Or
sudo systemctl restart movieticket-api

# View logs
pm2 logs movieticket-api
# Or
sudo journalctl -u movieticket-api -f

# Check status
pm2 status
# Or
sudo systemctl status movieticket-api

# Reload Nginx
sudo systemctl reload nginx

# Check MongoDB
sudo systemctl status mongod
mongosh

# Check firewall
sudo ufw status
```

## 🎯 Next Steps

1. **Test Application**
   - Access via domain or IP
   - Test login with admin credentials
   - Create test bookings

2. **Setup Domain** (if not done)
   - Point DNS A record to EC2 IP
   - Wait for DNS propagation
   - Update CORS and API URLs

3. **Enable HTTPS**
   - Complete Let's Encrypt setup
   - Force HTTPS redirects

4. **Setup Backups**
   - MongoDB backups
   - Application file backups
   - Automated backup scripts

5. **Monitoring**
   - Setup monitoring tools
   - Configure alerts
   - Setup log aggregation

## 📚 Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [MongoDB Production Notes](https://docs.mongodb.com/manual/administration/production-notes/)

---

**Your MovieTicket application should now be running on EC2!** 🎉

For issues or questions, refer to the main [README.md](../README.md) or check logs.

