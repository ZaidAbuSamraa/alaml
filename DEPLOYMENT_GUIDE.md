# دليل رفع المشروع على VPS

## 📋 المتطلبات الأساسية

### على الـ VPS:
- ✅ Ubuntu 20.04+ أو CentOS 7+
- ✅ Node.js 18+ و npm
- ✅ PostgreSQL 12+
- ✅ PM2 (لإدارة العمليات)
- ✅ Nginx (كـ Reverse Proxy)
- ✅ Domain أو IP عام

---

## 🔧 الخطوة 1: تجهيز الـ VPS

### 1. تحديث النظام:
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. تثبيت Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # يجب أن يكون 18+
```

### 3. تثبيت PostgreSQL:
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. تثبيت PM2:
```bash
sudo npm install -g pm2
```

### 5. تثبيت Nginx:
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🗄️ الخطوة 2: إعداد قاعدة البيانات

### 1. الدخول إلى PostgreSQL:
```bash
sudo -u postgres psql
```

### 2. إنشاء قاعدة البيانات والمستخدم:
```sql
CREATE DATABASE alaml;
CREATE USER alaml_user WITH ENCRYPTED PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE alaml TO alaml_user;
\q
```

### 3. السماح بالاتصالات الخارجية (إذا لزم الأمر):
```bash
sudo nano /etc/postgresql/12/main/postgresql.conf
# غير listen_addresses = 'localhost' إلى listen_addresses = '*'

sudo nano /etc/postgresql/12/main/pg_hba.conf
# أضف: host    all             all             0.0.0.0/0               md5

sudo systemctl restart postgresql
```

---

## 📦 الخطوة 3: رفع الكود

### 1. رفع المشروع إلى VPS:
```bash
# على جهازك المحلي
cd "c:\New folder (4)"
# احذف node_modules و .next
rm -rf backend/node_modules frontend/node_modules frontend/.next

# رفع عبر Git (الطريقة الأفضل)
git init
git add .
git commit -m "Initial commit"
git push origin main

# أو رفع عبر SCP
scp -r . user@your-vps-ip:/home/user/alaml-project
```

### 2. على الـ VPS:
```bash
cd /home/user/alaml-project
```

---

## ⚙️ الخطوة 4: إعداد Backend

### 1. إنشاء ملف .env:
```bash
cd backend
nano .env
```

### 2. املأ البيانات التالية:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=alaml_user
DB_PASSWORD=your_strong_password_here
DB_DATABASE=alaml

# Server Configuration
PORT=3008
NODE_ENV=production

# JWT Secret - غير هذا إلى قيمة عشوائية قوية
JWT_SECRET=your-very-strong-random-secret-key-here-change-this

# CORS Origin - ضع رابط Frontend
CORS_ORIGIN=http://your-vps-ip:3007
# أو إذا كان لديك domain:
# CORS_ORIGIN=https://yourdomain.com
```

### 3. تثبيت المكتبات وبناء المشروع:
```bash
npm install
npm run build
```

### 4. تشغيل Backend بـ PM2:
```bash
pm2 start dist/main.js --name alaml-backend
pm2 save
pm2 startup
```

---

## 🎨 الخطوة 5: إعداد Frontend

### 1. إنشاء ملف .env.local:
```bash
cd ../frontend
nano .env.local
```

### 2. املأ البيانات:
```env
# API URL - ضع رابط Backend
NEXT_PUBLIC_API_URL=http://your-vps-ip:3008
# أو إذا كان لديك domain:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### 3. تثبيت المكتبات وبناء المشروع:
```bash
npm install
npm run build
```

### 4. تشغيل Frontend بـ PM2:
```bash
pm2 start npm --name alaml-frontend -- start
pm2 save
```

---

## 🌐 الخطوة 6: إعداد Nginx (Reverse Proxy)

### 1. إنشاء ملف تكوين Nginx:
```bash
sudo nano /etc/nginx/sites-available/alaml
```

### 2. أضف التكوين التالي:
```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;  # أو your-vps-ip

    location / {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # أو your-vps-ip

    location / {
        proxy_pass http://localhost:3007;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. تفعيل التكوين:
```bash
sudo ln -s /etc/nginx/sites-available/alaml /etc/nginx/sites-enabled/
sudo nginx -t  # للتأكد من عدم وجود أخطاء
sudo systemctl restart nginx
```

---

## 🔒 الخطوة 7: إعداد SSL (HTTPS) - اختياري لكن مهم

### باستخدام Let's Encrypt (مجاني):
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

---

## 🔥 الخطوة 8: إعداد Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 📝 الخطوة 9: التحديثات المطلوبة في الكود

### ⚠️ مهم جداً: يجب تحديث الكود التالي

#### 1. في Frontend - استبدل جميع `http://localhost:3008`:

**قبل:**
```typescript
fetch('http://localhost:3008/auth/login', ...)
```

**بعد:**
```typescript
import { getApiUrl } from '@/config/api';
fetch(getApiUrl('/auth/login'), ...)
```

#### 2. الملفات التي تحتاج تحديث:
- ✅ `frontend/src/app/login/page.tsx`
- ✅ `frontend/src/app/admin/dashboard/page.tsx`
- ✅ `frontend/src/app/admin/employees/page.tsx`
- ✅ `frontend/src/app/admin/employees/[id]/page.tsx`
- ✅ `frontend/src/app/admin/suppliers/page.tsx`
- ✅ `frontend/src/app/admin/suppliers/[id]/page.tsx`
- ✅ `frontend/src/app/admin/requests/page.tsx`
- ✅ `frontend/src/app/admin/sales/page.tsx`
- ✅ `frontend/src/app/admin/analytics/page.tsx`
- ✅ `frontend/src/app/employee/dashboard/page.tsx`
- ✅ `frontend/src/app/employee/requests/page.tsx`

---

## ✅ الخطوة 10: التحقق من التشغيل

### 1. تحقق من Backend:
```bash
curl http://localhost:3008
pm2 logs alaml-backend
```

### 2. تحقق من Frontend:
```bash
curl http://localhost:3007
pm2 logs alaml-frontend
```

### 3. تحقق من Nginx:
```bash
sudo nginx -t
sudo systemctl status nginx
```

### 4. تحقق من PM2:
```bash
pm2 status
pm2 monit  # لمراقبة الأداء
```

---

## 🔄 أوامر مفيدة

### إعادة تشغيل الخدمات:
```bash
pm2 restart alaml-backend
pm2 restart alaml-frontend
sudo systemctl restart nginx
```

### عرض السجلات:
```bash
pm2 logs alaml-backend --lines 100
pm2 logs alaml-frontend --lines 100
sudo tail -f /var/log/nginx/error.log
```

### تحديث الكود:
```bash
cd /home/user/alaml-project

# Backend
cd backend
git pull
npm install
npm run build
pm2 restart alaml-backend

# Frontend
cd ../frontend
git pull
npm install
npm run build
pm2 restart alaml-frontend
```

---

## 🚨 استكشاف الأخطاء

### 1. Backend لا يعمل:
```bash
pm2 logs alaml-backend
# تحقق من:
# - اتصال قاعدة البيانات
# - ملف .env
# - البورت 3000 متاح
```

### 2. Frontend لا يعمل:
```bash
pm2 logs alaml-frontend
# تحقق من:
# - ملف .env.local
# - NEXT_PUBLIC_API_URL صحيح
# - البورت 3001 متاح
```

### 3. Nginx لا يعمل:
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
# تحقق من:
# - التكوين صحيح
# - البورتات متاحة
```

---

## 📊 مراقبة الأداء

### باستخدام PM2:
```bash
pm2 monit
pm2 status
```

### مراقبة قاعدة البيانات:
```bash
sudo -u postgres psql -d alaml -c "SELECT * FROM pg_stat_activity;"
```

---

## 🔐 نصائح الأمان

1. ✅ غير `JWT_SECRET` إلى قيمة عشوائية قوية
2. ✅ استخدم كلمات مرور قوية لقاعدة البيانات
3. ✅ فعّل Firewall
4. ✅ استخدم SSL/HTTPS
5. ✅ حدّث النظام بانتظام
6. ✅ راقب السجلات
7. ✅ عمل نسخ احتياطية لقاعدة البيانات

### نسخ احتياطي لقاعدة البيانات:
```bash
# إنشاء نسخة احتياطية
pg_dump -U alaml_user alaml > backup_$(date +%Y%m%d).sql

# استعادة نسخة احتياطية
psql -U alaml_user alaml < backup_20260130.sql
```

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من السجلات: `pm2 logs`
2. تحقق من Nginx: `sudo nginx -t`
3. تحقق من قاعدة البيانات: `sudo -u postgres psql`

---

## ✨ ملاحظات نهائية

- 🔄 بعد كل تحديث للكود، يجب إعادة بناء المشروع (`npm run build`)
- 💾 عمل نسخ احتياطية دورية لقاعدة البيانات
- 📊 مراقبة استخدام الموارد (CPU, RAM, Disk)
- 🔒 تحديث المكتبات بانتظام (`npm update`)

**المشروع الآن جاهز للعمل على VPS! 🚀**
