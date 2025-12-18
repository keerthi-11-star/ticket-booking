# 📋 EC2 Ubuntu Quick Reference

Quick command reference for deploying MovieTicket on EC2 Ubuntu.

## 🚀 Quick Setup (5 Minutes)

```bash
# 1. Connect to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# 2. Run automated setup script
wget https://raw.githubusercontent.com/your-repo/movieticket/main/scripts/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh

# 3. Upload application files
# From local machine:
scp -i your-key.pem -r ./movieticket ubuntu@your-ec2-ip:~/

# 4. Setup backend
cd ~/movieticket/backend
cp env.example .env
nano .env  # Edit with your config
npm install --production
npm run seed

# 5. Start application
pm2 start server.js --name movieticket-api
pm2 save
pm2 startup  # Follow instructions

# 6. Setup Nginx (if using domain)
./scripts/setup-nginx.sh your-domain.com /home/ubuntu/movieticket
sudo certbot --nginx -d your-domain.com
```

## 📦 Installation Commands

### Essential Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim
```

### Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### MongoDB (Local)
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod && sudo systemctl enable mongod
```

### PM2
```bash
sudo npm install -g pm2
pm2 startup systemd
```

### Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx && sudo systemctl enable nginx
```

### Docker (Optional)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

## 🔧 Application Commands

### Start Application
```bash
# Using PM2
cd ~/movieticket/backend
pm2 start server.js --name movieticket-api
pm2 save

# Using systemd
sudo systemctl start movieticket-api
```

### Stop Application
```bash
pm2 stop movieticket-api
# Or
sudo systemctl stop movieticket-api
```

### View Logs
```bash
pm2 logs movieticket-api
# Or
sudo journalctl -u movieticket-api -f
```

### Restart Application
```bash
pm2 restart movieticket-api
# Or
sudo systemctl restart movieticket-api
```

## 🌐 Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔐 SSL Setup

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test renewal
sudo certbot renew --dry-run

# Certificates auto-renew via cron
```

## 🗄️ MongoDB Commands

```bash
# Start/Stop MongoDB
sudo systemctl start mongod
sudo systemctl stop mongod
sudo systemctl restart mongod

# Check status
sudo systemctl status mongod

# Access MongoDB shell
mongosh
# Or
mongo

# Backup database
mongodump --uri="mongodb://localhost:27017/movieticket" --out=/backup

# Restore database
mongorestore --uri="mongodb://localhost:27017/movieticket" /backup/movieticket
```

## 🔥 Firewall Commands

```bash
# Check status
sudo ufw status

# Allow ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Enable/Disable
sudo ufw enable
sudo ufw disable

# Delete rule
sudo ufw delete allow 3000/tcp
```

## 📊 Monitoring Commands

```bash
# System resources
htop
df -h
free -h

# Network connections
netstat -tulpn
ss -tulpn

# Check ports in use
sudo lsof -i :3000
sudo lsof -i :80

# Process info
ps aux | grep node
ps aux | grep nginx
```

## 🔍 Troubleshooting Commands

```bash
# Check application status
pm2 status
curl http://localhost:3000/health

# Check service status
sudo systemctl status movieticket-api
sudo systemctl status mongod
sudo systemctl status nginx

# View recent logs
sudo journalctl -xe
sudo journalctl -u movieticket-api -n 50

# Test database connection
mongosh --eval "db.adminCommand('ping')"

# Check disk space
df -h
du -sh ~/movieticket/*

# Check memory usage
free -m
top
```

## 📝 Environment Variables

Create `~/movieticket/backend/.env`:

```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/movieticket
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-domain.com
```

## 🛡️ Security Checklist

- [ ] Change default admin password
- [ ] Generate strong JWT_SECRET
- [ ] Configure firewall (UFW)
- [ ] Setup SSL certificates
- [ ] Disable SSH password authentication
- [ ] Enable Fail2Ban
- [ ] Configure MongoDB authentication
- [ ] Update AWS Security Group
- [ ] Setup automated backups
- [ ] Enable security updates

## 🔄 Backup Commands

```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/movieticket" --out=/backup/$(date +%Y%m%d)

# Application files backup
tar -czf /backup/movieticket-$(date +%Y%m%d).tar.gz ~/movieticket

# Restore
mongorestore --uri="mongodb://localhost:27017/movieticket" /backup/20240101/movieticket
tar -xzf /backup/movieticket-20240101.tar.gz -C ~/
```

## 📚 Useful File Locations

```
Application:    ~/movieticket/
Logs:           ~/.pm2/logs/
Nginx config:   /etc/nginx/sites-available/movieticket
Systemd service: /etc/systemd/system/movieticket-api.service
MongoDB data:   /var/lib/mongodb/
Backups:        /backup/
```

## 🆘 Emergency Commands

```bash
# Stop everything
pm2 stop all
sudo systemctl stop movieticket-api
sudo systemctl stop nginx

# Restart everything
pm2 restart all
sudo systemctl restart movieticket-api
sudo systemctl restart nginx
sudo systemctl restart mongod

# Reset MongoDB (WARNING: Deletes all data)
sudo systemctl stop mongod
sudo rm -rf /var/lib/mongodb/*
sudo systemctl start mongod

# Reinstall application
cd ~/movieticket/backend
rm -rf node_modules
npm install --production
pm2 restart movieticket-api
```

## 📞 Support Resources

- Full setup guide: `docs/EC2_UBUNTU_SETUP.md`
- Main README: `README.md`
- Troubleshooting: Check logs first!

---

**Tip**: Bookmark this page for quick reference! 🔖

