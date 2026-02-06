# Nginx Setup Guide for aswakalaml.cv

## Prerequisites
- Ubuntu/Debian VPS
- Domain: aswakalaml.cv pointing to your VPS IP
- Root or sudo access

## Installation Steps

### 1. Install Nginx
```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Copy Nginx Configuration
```bash
# Copy the nginx.conf file to nginx sites-available
sudo cp nginx.conf /etc/nginx/sites-available/aswakalaml.cv

# Create symbolic link to sites-enabled
sudo ln -s /etc/nginx/sites-available/aswakalaml.cv /etc/nginx/sites-enabled/

# Remove default configuration (optional)
sudo rm /etc/nginx/sites-enabled/default
```

### 3. Install SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d aswakalaml.cv -d www.aswakalaml.cv

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### 4. Test Nginx Configuration
```bash
# Test configuration for syntax errors
sudo nginx -t

# If successful, reload nginx
sudo systemctl reload nginx
```

### 5. Setup Backend (NestJS)
```bash
cd /path/to/backend
npm install
npm run build

# Install PM2 for process management
sudo npm install -g pm2

# Start backend on port 3006 (configured in .env)
pm2 start dist/main.js --name "alaml-backend"
pm2 save
pm2 startup
```

### 6. Setup Frontend (Next.js)
```bash
cd /path/to/frontend
npm install
npm run build

# Start frontend on port 3007
PORT=3007 pm2 start npm --name "alaml-frontend" -- start
pm2 save
```

### 7. Configure Firewall
```bash
# Allow Nginx through firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## Verification

### Check Services Status
```bash
# Check Nginx
sudo systemctl status nginx

# Check PM2 processes
pm2 status

# Check if ports are listening
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
sudo netstat -tulpn | grep :3007
sudo netstat -tulpn | grep :3006
```

### Test URLs
- Frontend: https://aswakalaml.cv
- Backend API: https://aswakalaml.cv/api/health (or any endpoint)

## Troubleshooting

### Check Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/aswakalaml_access.log

# Error logs
sudo tail -f /var/log/nginx/aswakalaml_error.log
```

### Check Application Logs
```bash
# Backend logs
pm2 logs alaml-backend

# Frontend logs
pm2 logs alaml-frontend
```

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
sudo lsof -i :3007
sudo lsof -i :3006

# Kill process if needed
sudo kill -9 <PID>
```

#### 2. SSL Certificate Issues
```bash
# Renew certificate manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

#### 3. Nginx Configuration Error
```bash
# Check syntax
sudo nginx -t

# View detailed error
sudo nginx -T
```

## Auto-renewal for SSL
Certbot automatically sets up a cron job for certificate renewal. Verify:
```bash
sudo systemctl status certbot.timer
```

## Update Application

### Backend Update
```bash
cd /path/to/backend
git pull
npm install
npm run build
pm2 restart alaml-backend
```

### Frontend Update
```bash
cd /path/to/frontend
git pull
npm install
npm run build
pm2 restart alaml-frontend
```

## Important Notes

1. **Environment Variables**: Make sure `.env` files are properly configured in both frontend and backend
2. **Database**: Ensure PostgreSQL is running and accessible
3. **API URL**: Update frontend `.env` to point to `https://aswakalaml.cv/api`
4. **CORS**: Backend should allow requests from `https://aswakalaml.cv`
5. **WhatsApp API**: Ensure WhatsApp Business API credentials are configured

## Security Recommendations

1. Keep system updated: `sudo apt update && sudo apt upgrade`
2. Use strong passwords for database
3. Regularly backup database
4. Monitor logs for suspicious activity
5. Keep SSL certificates up to date (auto-renewal should handle this)

## Backup Strategy

### Database Backup
```bash
# Create backup
pg_dump -U postgres alaml_db > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U postgres alaml_db < backup_20260131.sql
```

### Application Backup
```bash
# Backup entire application
tar -czf alaml_backup_$(date +%Y%m%d).tar.gz /path/to/application
```

## Support
For issues, check:
- Nginx documentation: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/docs/
- PM2 documentation: https://pm2.keymetrics.io/docs/
