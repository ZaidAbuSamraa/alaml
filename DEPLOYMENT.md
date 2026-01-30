# دليل نشر التطبيق على VPS

## المشكلة الحالية ⚠️

حالياً، جميع ملفات Frontend تحتوي على عناوين API ثابتة (hardcoded) مثل:
```typescript
fetch('http://localhost:3000/employees', ...)
```

هذا **لن يعمل** عند النشر على VPS لأن:
- `localhost` يشير إلى جهاز المستخدم وليس السيرفر
- البورت قد يكون مختلف في الإنتاج

## الحل ✅

### 1. استخدام متغيرات البيئة (Environment Variables)

تم إنشاء ملف `frontend/src/lib/api.ts` الذي يدير جميع عناوين API بشكل مركزي.

### 2. إعداد ملف `.env.local`

**للتطوير المحلي:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**للإنتاج على VPS:**
```bash
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:3000
# أو
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### 3. تحديث جميع ملفات Frontend

يجب استبدال جميع الـ hardcoded URLs بـ:

**قبل:**
```typescript
const response = await fetch('http://localhost:3000/employees', {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

**بعد:**
```typescript
import { apiCall, API_ENDPOINTS } from '@/lib/api';

const response = await apiCall(API_ENDPOINTS.EMPLOYEES);
```

أو بشكل مباشر:
```typescript
import { API_URL } from '@/lib/api';

const response = await fetch(`${API_URL}/employees`, {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

## خطوات النشر على VPS 🚀

### 1. إعداد VPS

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# تثبيت PM2 لإدارة العمليات
sudo npm install -g pm2
```

### 2. إعداد قاعدة البيانات

```bash
# الدخول إلى PostgreSQL
sudo -u postgres psql

# إنشاء قاعدة البيانات والمستخدم
CREATE DATABASE alaml;
CREATE USER alaml_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE alaml TO alaml_user;
\q
```

### 3. رفع الكود إلى VPS

```bash
# على جهازك المحلي
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/ZaidAbuSamraa/alaml.git
git push -u origin main

# على VPS
cd /var/www
git clone https://github.com/ZaidAbuSamraa/alaml.git
cd alaml
```

### 4. إعداد Backend

```bash
cd backend

# تثبيت المكتبات
npm install

# إنشاء ملف .env
nano .env
```

محتوى ملف `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=alaml_user
DB_PASSWORD=your_secure_password
DB_DATABASE=alaml
JWT_SECRET=your_very_secure_jwt_secret_key_here
PORT=3000
```

```bash
# بناء التطبيق
npm run build

# تشغيل التطبيق مع PM2
pm2 start dist/main.js --name alaml-backend
pm2 save
pm2 startup
```

### 5. إعداد Frontend

```bash
cd ../frontend

# تثبيت المكتبات
npm install

# إنشاء ملف .env.local
nano .env.local
```

محتوى ملف `.env.local`:
```env
# استخدم IP الخاص بـ VPS أو Domain
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:3000
# أو
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

```bash
# بناء التطبيق
npm run build

# تشغيل التطبيق مع PM2
pm2 start npm --name alaml-frontend -- start
pm2 save
```

### 6. إعداد Nginx (اختياري لكن موصى به)

```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/alaml
```

محتوى ملف Nginx:
```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/alaml /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. إعداد SSL (HTTPS) مع Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

## الملفات التي تحتاج تحديث 📝

يجب تحديث جميع ملفات Frontend التالية لاستخدام `API_URL` بدلاً من `localhost:3000`:

1. `frontend/src/app/admin/employees/page.tsx`
2. `frontend/src/app/admin/employees/[id]/page.tsx`
3. `frontend/src/app/admin/sales/page.tsx`
4. `frontend/src/app/admin/suppliers/page.tsx`
5. `frontend/src/app/admin/suppliers/[id]/page.tsx`
6. `frontend/src/app/admin/dashboard/page.tsx`
7. `frontend/src/app/admin/analytics/page.tsx`
8. `frontend/src/app/admin/requests/page.tsx`
9. `frontend/src/app/employee/dashboard/page.tsx`
10. `frontend/src/app/employee/requests/page.tsx`
11. `frontend/src/app/login/page.tsx`

## أوامر مفيدة 🛠️

```bash
# عرض حالة التطبيقات
pm2 status

# عرض logs
pm2 logs alaml-backend
pm2 logs alaml-frontend

# إعادة تشغيل
pm2 restart alaml-backend
pm2 restart alaml-frontend

# إيقاف
pm2 stop alaml-backend
pm2 stop alaml-frontend

# حذف من PM2
pm2 delete alaml-backend
pm2 delete alaml-frontend
```

## ملاحظات مهمة ⚠️

1. **الأمان**: غير `JWT_SECRET` إلى قيمة عشوائية قوية
2. **قاعدة البيانات**: استخدم كلمة مرور قوية لقاعدة البيانات
3. **Firewall**: تأكد من فتح البورتات المطلوبة (80, 443, 3000)
4. **Backup**: قم بعمل نسخ احتياطية دورية لقاعدة البيانات
5. **Updates**: قم بتحديث النظام والمكتبات بانتظام

## استكشاف الأخطاء 🔍

### المشكلة: التطبيق لا يتصل بـ API

**الحل:**
1. تأكد من أن `NEXT_PUBLIC_API_URL` في `.env.local` صحيح
2. تأكد من أن Backend يعمل: `pm2 status`
3. تأكد من أن Firewall لا يحجب البورت

### المشكلة: CORS Errors

**الحل:** أضف CORS في Backend (`main.ts`):
```typescript
app.enableCors({
  origin: ['http://your-domain.com', 'https://your-domain.com'],
  credentials: true,
});
```

### المشكلة: قاعدة البيانات لا تتصل

**الحل:**
1. تأكد من أن PostgreSQL يعمل: `sudo systemctl status postgresql`
2. تأكد من بيانات الاتصال في `.env`
3. تأكد من صلاحيات المستخدم في PostgreSQL
