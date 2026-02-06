# إعداد ميزة التسجيل الصوتي مع Whisper AI

## المتطلبات

### 1. تثبيت Python و Whisper

```bash
# تثبيت Whisper
pip3 install -U openai-whisper

# تأكد من التثبيت
whisper --help
```

### 2. تثبيت FFmpeg (مطلوب لـ Whisper)

**Windows:**
```bash
# استخدم Chocolatey
choco install ffmpeg

# أو حمل من الموقع الرسمي
# https://ffmpeg.org/download.html
```

**Linux:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

### 3. تحميل نموذج Whisper (أول مرة فقط)

```bash
# نموذج medium (موصى به للعربي)
whisper test.wav --model medium --language Arabic
```

**النماذج المتاحة:**
- `tiny` - الأسرع (أقل دقة)
- `base` - سريع
- `small` - متوازن
- `medium` ✅ **موصى به للعربية**
- `large` - الأدق (أبطأ)

### 4. إعداد Groq API Key

أضف API Key في ملف `.env`:

```env
GROQ_API_KEY=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
```

احصل على API Key من: https://console.groq.com/keys

**مميزات Groq:**
- ✅ مجاني
- ✅ سريع جداً (أسرع من OpenAI)
- ✅ يدعم العربية بشكل ممتاز
- ✅ نموذج Llama 4 Scout

### 5. تثبيت المكتبات المطلوبة في Backend

```bash
cd backend
npm install groq-sdk
npm install @nestjs/platform-express
npm install multer
npm install @types/multer --save-dev
```

## كيفية الاستخدام

### من واجهة الأدمن:

1. **افتح لوحة التحكم** (Admin Dashboard)

2. **اضغط على زر "تسجيل المعلومات صوتياً"** (الزر البنفسجي في الأعلى)

3. **اضغط "بدء التسجيل"** وتحدث بوضوح:
   ```
   مثال: "دفعت اليوم 1500 شيكل للمورد أحمد بتاريخ 3 فبراير"
   ```

4. **اضغط "إيقاف التسجيل"**

5. **انتظر المعالجة:**
   - سيتم تحويل الصوت إلى نص باستخدام Whisper
   - سيتم تحليل النص باستخدام GPT-4 لاستخراج:
     - اسم المورد
     - المبلغ
     - التاريخ
     - الوصف

6. **اختر المورد:**
   - إذا وُجد مورد واحد مطابق → يتم اختياره تلقائياً
   - إذا وُجدت عدة موردين → اختر المورد الصحيح من القائمة
   - يتم عرض نسبة التطابق لكل مورد

7. **تأكيد وحفظ:**
   - راجع البيانات المستخرجة
   - اضغط "تأكيد وحفظ الدفعة"
   - سيتم حفظ الدفعة في CashFlow

## البنية التقنية

### Backend (NestJS)

**الملفات:**
- `backend/src/voice/voice.controller.ts` - API endpoints
- `backend/src/voice/voice.service.ts` - منطق المعالجة
- `backend/src/voice/voice.module.ts` - Module configuration

**API Endpoints:**
- `POST /voice/transcribe` - تحويل الصوت إلى نص وتحليله
- `POST /voice/confirm-payment` - حفظ الدفعة
- `GET /voice/suppliers/search` - البحث عن الموردين

### Frontend (React/Next.js)

**الملفات:**
- `frontend/src/components/VoiceRecorder.tsx` - مكون التسجيل الصوتي
- `frontend/src/app/admin/dashboard/page.tsx` - دمج في لوحة التحكم

## سير العمل (Workflow)

```
1. المستخدم يسجل الصوت
   ↓
2. إرسال الصوت إلى Backend
   ↓
3. Whisper يحول الصوت إلى نص عربي
   ↓
4. Groq AI (Llama 4 Scout) يحلل النص ويستخرج:
   - اسم المورد
   - المبلغ
   - التاريخ
   ↓
5. البحث عن الموردين المطابقين في Database
   ↓
6. عرض النتائج للمستخدم:
   - إذا مورد واحد → اختيار تلقائي
   - إذا عدة موردين → المستخدم يختار
   - إذا لا يوجد → رسالة خطأ
   ↓
7. المستخدم يؤكد البيانات
   ↓
8. حفظ الدفعة في CashFlowDay
```

## استكشاف الأخطاء

### خطأ: "Whisper command not found"
```bash
# تأكد من تثبيت Whisper
pip3 install -U openai-whisper

# أضف Python إلى PATH
```

### خطأ: "FFmpeg not found"
```bash
# ثبت FFmpeg حسب نظام التشغيل (انظر أعلاه)
```

### خطأ: "OpenAI API Key not found"
```bash
# تأكد من وجود OPENAI_API_KEY في ملف .env
```

### خطأ: "Microphone access denied"
```
- تأكد من السماح للمتصفح بالوصول للميكروفون
- في Chrome: Settings → Privacy → Microphone
```

## ملاحظات مهمة

1. **الخصوصية:** التسجيلات الصوتية يتم حذفها فوراً بعد المعالجة
2. **الأمان:** استخدم HTTPS في Production
3. **التكلفة:** ✅ **Groq API مجاني تماماً!** (لا توجد تكلفة)
4. **الدقة:** نموذج Whisper `medium` يعطي أفضل نتائج للعربية
5. **الأداء:** المعالجة تأخذ 3-10 ثوانٍ حسب طول التسجيل (Groq أسرع من OpenAI)
6. **السرعة:** Groq أسرع 10x من OpenAI في تحليل النصوص

## التحسينات المستقبلية

- [ ] دعم لغات أخرى
- [ ] حفظ سجل التسجيلات
- [ ] تحسين دقة التعرف على الأسماء العربية
- [ ] إضافة اختصارات صوتية (مثل "اليوم" → التاريخ الحالي)
- [ ] دعم أنواع معاملات أخرى (فواتير، مبيعات، إلخ)
