# تغييرات البورتات - Ports Configuration

## 📌 البورتات الجديدة

تم تغيير البورتات إلى:

| الخدمة | البورت القديم | البورت الجديد |
|--------|---------------|---------------|
| **Frontend** | 3001 | **3007** |
| **Backend** | 3000 | **3008** |
| **Database** | 5432 | **5432** (لم يتغير) |

---

## ⚙️ الملفات التي تم تحديثها

### ✅ Backend:
- `backend/.env.example`
  - `PORT=3008`
  - `DB_PORT=5432`
  - `CORS_ORIGIN=http://localhost:3007`

### ✅ Frontend:
- `frontend/package.json`
  - `"dev": "next dev -p 3007"`
  - `"start": "next start -p 3007"`
- `frontend/.env.local.example`
  - `NEXT_PUBLIC_API_URL=http://localhost:3008`
- `frontend/src/config/api.ts`
  - Default URL: `http://localhost:3008`

### ✅ Documentation:
- `DEPLOYMENT_GUIDE.md` - تم تحديث جميع البورتات
- `UPDATE_API_URLS.md` - تم تحديث جميع البورتات

---

## 🚀 كيفية التشغيل

### 1. Backend (Port 3008):
```bash
cd backend
# أنشئ ملف .env وضع فيه:
PORT=3008
DB_PORT=5432
CORS_ORIGIN=http://localhost:3007

npm run start:dev
# أو للإنتاج:
npm run build
npm run start:prod
```

### 2. Frontend (Port 3007):
```bash
cd frontend
# أنشئ ملف .env.local وضع فيه:
NEXT_PUBLIC_API_URL=http://localhost:3008

npm run dev
# أو للإنتاج:
npm run build
npm run start
```

### 3. Database (Port 5432 - لم يتغير):
```bash
# تشغيل PostgreSQL على البورت 5433
sudo -u postgres psql
ALTER SYSTEM SET port = 5432;
# أو في ملف postgresql.conf:
sudo nano /etc/postgresql/14/main/postgresql.conf
# غير: port = 5432

sudo systemctl restart postgresql
```

---

## 🔧 PostgreSQL على البورت الافتراضي 5432

**ملاحظة:** بورت قاعدة البيانات لم يتغير، يبقى على البورت الافتراضي **5432**

لا حاجة لتغيير أي إعدادات في PostgreSQL، استخدم البورت الافتراضي.

---

## 🌐 الوصول إلى التطبيق

### Development:
- **Frontend:** http://localhost:3007
- **Backend API:** http://localhost:3008
- **Database:** localhost:5432

### Production (على VPS):
- **Frontend:** http://your-vps-ip:3007 أو https://yourdomain.com
- **Backend API:** http://your-vps-ip:3008 أو https://api.yourdomain.com
- **Database:** localhost:5432 (داخلي فقط)

---

## 🔥 Firewall Configuration

إذا كنت تستخدم Firewall، افتح البورتات الجديدة:

```bash
# Frontend
sudo ufw allow 3007/tcp

# Backend
sudo ufw allow 3008/tcp

# Database (لا تفتحه للخارج!)
# sudo ufw deny 5432/tcp
```

---

## 📝 Nginx Configuration (للإنتاج)

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3008;
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
        proxy_pass http://localhost:3007;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## ✅ التحقق من التشغيل

### Backend:
```bash
curl http://localhost:3008
# يجب أن يرجع استجابة من API
```

### Frontend:
```bash
curl http://localhost:3007
# يجب أن يرجع HTML
```

### Database:
```bash
psql -h localhost -p 5433 -U alaml_user -d alaml
# يجب أن يتصل بقاعدة البيانات
```

---

## 🔄 PM2 Configuration (للإنتاج)

### Backend:
```bash
cd backend
pm2 start dist/main.js --name alaml-backend
pm2 save
```

### Frontend:
```bash
cd frontend
pm2 start npm --name alaml-frontend -- start
pm2 save
```

**ملاحظة:** Frontend سيعمل تلقائياً على البورت 3007 لأننا حددناه في `package.json`

---

## ⚠️ ملاحظات مهمة

1. **Database Port:** تأكد من تحديث بورت PostgreSQL قبل تشغيل Backend
2. **CORS:** تأكد من تحديث `CORS_ORIGIN` في Backend ليطابق بورت Frontend
3. **Environment Variables:** أنشئ ملفات `.env` و `.env.local` بالبورتات الجديدة
4. **Firewall:** لا تفتح بورت Database (5433) للخارج، فقط للـ localhost

---

## 🎯 الخلاصة

البورتات الجديدة:
- ✅ Frontend: **3007**
- ✅ Backend: **3008**
- ✅ Database: **5433**

جميع الملفات تم تحديثها تلقائياً! 🚀
