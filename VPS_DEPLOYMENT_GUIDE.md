# دليل نشر المشروع على VPS
## VPS Deployment Complete Guide

---

## 🔴 المشاكل الشائعة وحلولها

### 1. مشكلة CORS Errors ❌

**الخطأ:**
```
Access-Control-Allow-Origin
net::ERR_FAILED
```

**الحل:** ✅
تم تحديث `backend/src/main.ts` لتفعيل CORS بشكل صحيح:

```typescript
app.enableCors({
  origin: true, // يسمح بجميع المصادر
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});
```

---

### 2. مشكلة Connection Refused ❌

**الخطأ:**
```
net::ERR_CONNECTION_REFUSED
Failed to fetch
```

**الأسباب المحتملة:**
1. Backend غير مشغل على VPS
2. Frontend يحاول الاتصال بـ `localhost` بدلاً من IP الخاص بـ VPS
3. Firewall يمنع البورت `3006`

**الحل:** ✅

#### أ. تأكد من تشغيل Backend على VPS:
```bash
# على VPS
cd backend
npm run start:prod
# أو استخدم PM2
pm2 start npm --name "alaml-backend" -- run start:prod
```

#### ب. تحديث Frontend للاتصال بـ VPS:
في ملف `frontend/.env.local` على VPS:
```env
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:3006
```

**مثال:**
```env
NEXT_PUBLIC_API_URL=http://45.76.181.87:3006
```

#### ج. فتح البورتات في Firewall:
```bash
# على VPS (Ubuntu/Debian)
sudo ufw allow 3006/tcp
sudo ufw allow 3007/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

---

## 📋 خطوات النشر الكاملة على VPS

### المرحلة 1: إعداد VPS

#### 1. الاتصال بـ VPS:
```bash
ssh root@YOUR_VPS_IP
```

#### 2. تثبيت المتطلبات:
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js (v18 أو أحدث)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# تثبيت PM2 (لإدارة العمليات)
sudo npm install -g pm2

# تثبيت Git
sudo apt install -y git
```

---

### المرحلة 2: إعداد قاعدة البيانات

```bash
# الدخول إلى PostgreSQL
sudo -u postgres psql

# إنشاء قاعدة البيانات والمستخدم
CREATE DATABASE alaml;
CREATE USER alaml_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE alaml TO alaml_user;
\q
```

---

### المرحلة 3: رفع الكود إلى VPS

#### الطريقة 1: استخدام Git (موصى بها)
```bash
# على VPS
cd /var/www
git clone https://github.com/ZaidAbuSamraa/alaml.git
cd alaml
```

#### الطريقة 2: رفع الملفات يدوياً
```bash
# من جهازك المحلي
scp -r "c:\New folder (4)" root@YOUR_VPS_IP:/var/www/alaml
```

---

### المرحلة 4: إعداد Backend

```bash
cd /var/www/alaml/backend

# تثبيت Dependencies
npm install

# إنشاء ملف .env
nano .env
```

**محتوى ملف `.env`:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=alaml_user
DB_PASSWORD=your_strong_password
DB_DATABASE=alaml

# Server Configuration
PORT=3006
NODE_ENV=production

# JWT Secret
JWT_SECRET=your-very-strong-random-secret-key-change-this-in-production

# CORS Configuration
CORS_ORIGIN=http://YOUR_VPS_IP:3007
```

```bash
# بناء المشروع
npm run build

# تشغيل seeder لإنشاء حساب الأدمن
npm run seed

# تشغيل Backend باستخدام PM2
pm2 start npm --name "alaml-backend" -- run start:prod
pm2 save
pm2 startup
```

---

### المرحلة 5: إعداد Frontend

```bash
cd /var/www/alaml/frontend

# تثبيت Dependencies
npm install

# إنشاء ملف .env.local
nano .env.local
```

**محتوى ملف `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:3006
```

**مثال:**
```env
NEXT_PUBLIC_API_URL=http://45.76.181.87:3006
```

```bash
# بناء المشروع
npm run build

# تشغيل Frontend باستخدام PM2
pm2 start npm --name "alaml-frontend" -- run start
pm2 save
```

---

### المرحلة 6: إعداد Nginx (اختياري لكن موصى به)

#### 1. تثبيت Nginx:
```bash
sudo apt install -y nginx
```

#### 2. إنشاء ملف إعداد:
```bash
sudo nano /etc/nginx/sites-available/alaml
```

**محتوى الملف:**
```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;  # أو YOUR_VPS_IP

    location / {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # أو YOUR_VPS_IP

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

#### 3. تفعيل الإعداد:
```bash
sudo ln -s /etc/nginx/sites-available/alaml /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### المرحلة 7: إعداد SSL (HTTPS) - اختياري

```bash
# تثبيت Certbot
sudo apt install -y certbot python3-certbot-nginx

# الحصول على شهادة SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# تجديد تلقائي
sudo certbot renew --dry-run
```

بعد تفعيل SSL، حدّث `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 🔍 التحقق من التشغيل

### 1. التحقق من Backend:
```bash
# التحقق من أن Backend يعمل
curl http://localhost:3006

# التحقق من PM2
pm2 status
pm2 logs alaml-backend
```

### 2. التحقق من Frontend:
```bash
# التحقق من أن Frontend يعمل
curl http://localhost:3007

# التحقق من PM2
pm2 logs alaml-frontend
```

### 3. التحقق من البورتات:
```bash
netstat -tulpn | grep :3006
netstat -tulpn | grep :3007
```

### 4. التحقق من Firewall:
```bash
sudo ufw status
```

---

## 🐛 استكشاف الأخطاء

### مشكلة: Backend لا يعمل
```bash
# عرض Logs
pm2 logs alaml-backend

# إعادة تشغيل
pm2 restart alaml-backend

# التحقق من قاعدة البيانات
sudo -u postgres psql -d alaml -c "\dt"
```

### مشكلة: Frontend لا يتصل بـ Backend
```bash
# التحقق من .env.local
cat /var/www/alaml/frontend/.env.local

# يجب أن يكون:
# NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:3006

# إعادة بناء Frontend
cd /var/www/alaml/frontend
npm run build
pm2 restart alaml-frontend
```

### مشكلة: CORS Errors
```bash
# التحقق من إعدادات CORS في backend/src/main.ts
# يجب أن يحتوي على:
app.enableCors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});
```

### مشكلة: Connection Refused
```bash
# التحقق من Firewall
sudo ufw status

# فتح البورتات
sudo ufw allow 3006/tcp
sudo ufw allow 3007/tcp
sudo ufw reload
```

---

## 📊 البورتات المستخدمة

| الخدمة | البورت | الوصول |
|--------|--------|--------|
| Backend API | 3006 | `http://YOUR_VPS_IP:3006` |
| Frontend | 3007 | `http://YOUR_VPS_IP:3007` |
| PostgreSQL | 5432 | localhost فقط |
| Nginx HTTP | 80 | عام |
| Nginx HTTPS | 443 | عام |

---

## 🔐 الأمان

### 1. تغيير كلمات المرور:
- ✅ `DB_PASSWORD` في `.env`
- ✅ `JWT_SECRET` في `.env`
- ✅ كلمة مرور PostgreSQL

### 2. إعداد Firewall:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3006/tcp
sudo ufw allow 3007/tcp
sudo ufw enable
```

### 3. تحديث النظام بانتظام:
```bash
sudo apt update && sudo apt upgrade -y
```

---

## 🔄 التحديثات المستقبلية

### تحديث الكود على VPS:
```bash
# على VPS
cd /var/www/alaml

# سحب آخر التحديثات
git pull origin main

# تحديث Backend
cd backend
npm install
npm run build
pm2 restart alaml-backend

# تحديث Frontend
cd ../frontend
npm install
npm run build
pm2 restart alaml-frontend
```

---

## 📝 ملاحظات مهمة

1. **استبدل `YOUR_VPS_IP`** بعنوان IP الفعلي لـ VPS الخاص بك
2. **استبدل `yourdomain.com`** بالدومين الخاص بك (إذا كان لديك)
3. **غيّر جميع كلمات المرور** إلى قيم قوية وآمنة
4. **استخدم HTTPS** في الإنتاج لحماية البيانات
5. **قم بعمل Backup** لقاعدة البيانات بانتظام

---

## 🎯 الخلاصة

بعد اتباع هذه الخطوات:
- ✅ Backend يعمل على `http://YOUR_VPS_IP:3006`
- ✅ Frontend يعمل على `http://YOUR_VPS_IP:3007`
- ✅ CORS مُعد بشكل صحيح
- ✅ Firewall يسمح بالاتصالات
- ✅ PM2 يدير العمليات تلقائياً
- ✅ النظام جاهز للاستخدام!

---

**تاريخ الدليل:** 30 يناير 2026  
**الإصدار:** 1.0  
**الحالة:** جاهز للنشر
