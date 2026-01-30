# تحديث روابط API للإنتاج

## ⚠️ مهم جداً: يجب تحديث جميع روابط API

حالياً، جميع الملفات تستخدم `http://localhost:3008` مباشرة.
يجب تحديثها لاستخدام متغير البيئة.

---

## 📝 الخطوات المطلوبة

### 1. إنشاء ملف `.env.local` في Frontend:
```bash
cd frontend
nano .env.local
```

أضف:
```env
NEXT_PUBLIC_API_URL=http://your-vps-ip:3008
```

### 2. استخدام ملف التكوين:

تم إنشاء ملف `frontend/src/config/api.ts` يحتوي على:
```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008';
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};
```

### 3. تحديث جميع الملفات:

**قبل:**
```typescript
fetch('http://localhost:3008/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(credentials)
})
```

**بعد:**
```typescript
import { getApiUrl } from '@/config/api';

fetch(getApiUrl('/auth/login'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(credentials)
})
```

---

## 📂 الملفات التي تحتاج تحديث (44 موضع)

### ✅ صفحات الأدمن:

#### 1. `frontend/src/app/login/page.tsx` (1 موضع)
- `/auth/login`

#### 2. `frontend/src/app/admin/dashboard/page.tsx` (7 مواضع)
- `/cash`
- `/cash` (PUT)
- `/sales`
- `/sales` (POST)
- `/analytics`
- `/notifications`
- `/notifications/:id/read` (PUT)

#### 3. `frontend/src/app/admin/employees/page.tsx` (5 مواضع)
- `/employees`
- `/employees` (POST)
- `/employees/:id` (DELETE)
- `/employees/:id` (PUT)
- `/time-logs/active-sessions`

#### 4. `frontend/src/app/admin/employees/[id]/page.tsx` (3 مواضع)
- `/employees/:id`
- `/time-logs/employee/:id`
- `/time-logs/employee/:id/total-earnings`

#### 5. `frontend/src/app/admin/suppliers/page.tsx` (3 مواضع)
- `/suppliers`
- `/suppliers` (POST)
- `/suppliers/:id` (DELETE)

#### 6. `frontend/src/app/admin/suppliers/[id]/page.tsx` (9 مواضع)
- `/suppliers/:id`
- `/invoices` (POST)
- `/invoices/:id` (DELETE)
- `/payments` (POST)
- `/payments/:id` (DELETE)
- `/payments/:id` (PUT)
- `/transactions/supplier/:id`
- `/cash`
- `/cash` (PUT)

#### 7. `frontend/src/app/admin/requests/page.tsx` (3 مواضع)
- `/resource-requests`
- `/resource-requests/:id/status` (PUT)
- `/resource-requests/:id` (DELETE)

#### 8. `frontend/src/app/admin/sales/page.tsx` (4 مواضع)
- `/sales`
- `/sales` (POST)
- `/sales/:id` (PUT)
- `/sales/:id` (DELETE)

#### 9. `frontend/src/app/admin/analytics/page.tsx` (2 مواضع)
- `/analytics`
- `/transactions`

### ✅ صفحات الموظف:

#### 10. `frontend/src/app/employee/dashboard/page.tsx` (5 مواضع)
- `/time-logs/active/:employeeId`
- `/time-logs/employee/:employeeId`
- `/time-logs/employee/:employeeId/total-earnings`
- `/time-logs/clock-in` (POST)
- `/time-logs/clock-out/:employeeId` (POST)

#### 11. `frontend/src/app/employee/requests/page.tsx` (2 مواضع)
- `/resource-requests/employee/:employeeId`
- `/resource-requests` (POST)

---

## 🔧 مثال كامل للتحديث

### ملف: `frontend/src/app/login/page.tsx`

**قبل:**
```typescript
const response = await fetch('http://localhost:3008/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(credentials),
});
```

**بعد:**
```typescript
import { getApiUrl } from '@/config/api';

const response = await fetch(getApiUrl('/auth/login'), {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(credentials),
});
```

---

## ⚡ سكريبت سريع للتحديث

يمكنك استخدام هذا الأمر لإيجاد جميع الملفات:

```bash
cd frontend/src
grep -r "http://localhost:3008" . --include="*.tsx" --include="*.ts"
```

---

## ✅ بعد التحديث

1. تأكد من إنشاء ملف `.env.local` في Frontend
2. أعد بناء المشروع: `npm run build`
3. أعد تشغيل Frontend: `pm2 restart alaml-frontend`

---

## 🎯 ملاحظة مهمة

**لا تنسى:**
- تحديث `NEXT_PUBLIC_API_URL` في `.env.local` بعد رفع المشروع
- إعادة بناء Frontend بعد أي تغيير في متغيرات البيئة
- التأكد من أن Backend يعمل على نفس الرابط المحدد

---

**هذا التحديث ضروري لكي يعمل المشروع على VPS! 🚀**
