# 🎤 دليل التشغيل السريع - ميزة التسجيل الصوتي

## ✅ تم إنجازه:

### 1. المكتبات المثبتة:
- ✅ `groq-sdk` - للتحليل الذكي
- ✅ `multer` - لرفع الملفات
- ✅ `@types/multer` - TypeScript types

### 2. الإعدادات:
- ✅ `GROQ_API_KEY` مضاف في `.env`
- ✅ الكود محدث لاستخدام Groq بدلاً من OpenAI

## 📋 الخطوات المتبقية:

### 1. تثبيت Whisper AI:
```bash
pip3 install -U openai-whisper
```

### 2. تثبيت FFmpeg:

**Windows (PowerShell كمسؤول):**
```powershell
choco install ffmpeg
```

**إذا لم يكن Chocolatey مثبت:**
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

**أو حمل FFmpeg يدوياً:**
https://ffmpeg.org/download.html

### 3. تحميل نموذج Whisper (أول مرة):
```bash
# سجل أي ملف صوتي قصير واحفظه كـ test.wav
whisper test.wav --model medium --language Arabic
```

سيتم تحميل النموذج تلقائياً (حوالي 1.5 GB)

### 4. إعادة تشغيل Backend:
```bash
cd backend
npm run start:dev
```

## 🧪 اختبار الميزة:

1. افتح المتصفح: `http://localhost:3007/admin/dashboard`
2. اضغط على زر **"تسجيل المعلومات صوتياً"** (الزر البنفسجي)
3. اضغط **"بدء التسجيل"**
4. قل بوضوح:
   ```
   "دفعت اليوم 1500 شيكل للمورد أحمد بتاريخ 3 فبراير"
   ```
5. اضغط **"إيقاف التسجيل"**
6. انتظر المعالجة (5-10 ثوانٍ)
7. اختر المورد من القائمة
8. اضغط **"تأكيد وحفظ الدفعة"**

## 🔍 التحقق من التثبيت:

### تحقق من Whisper:
```bash
whisper --help
```

### تحقق من FFmpeg:
```bash
ffmpeg -version
```

### تحقق من المكتبات:
```bash
cd backend
npm list groq-sdk
npm list multer
```

## ⚡ نصائح للأداء الأفضل:

1. **الوضوح في النطق:** تحدث بوضوح وببطء
2. **البيئة الهادئة:** قلل الضوضاء في الخلفية
3. **الصيغة الموحدة:** استخدم صيغة ثابتة مثل:
   - "دفعت [المبلغ] للمورد [الاسم] بتاريخ [التاريخ]"
   - "دفعة [المبلغ] شيكل لـ [الاسم]"

## 🎯 الميزات:

- ✅ تحويل صوتي إلى نص (Whisper AI)
- ✅ تحليل ذكي للنص (Groq AI - Llama 4)
- ✅ استخراج تلقائي للبيانات
- ✅ بحث ذكي عن الموردين
- ✅ حفظ مباشر في CashFlow
- ✅ مجاني تماماً!

## 🆘 حل المشاكل:

### "Whisper command not found"
```bash
pip3 install -U openai-whisper
# تأكد من إضافة Python إلى PATH
```

### "FFmpeg not found"
```bash
# أعد تثبيت FFmpeg وأعد تشغيل Terminal
```

### "Microphone access denied"
- افتح إعدادات المتصفح
- اسمح بالوصول للميكروفون
- أعد تحميل الصفحة

### "Groq API error"
- تأكد من صحة `GROQ_API_KEY` في `.env`
- أعد تشغيل Backend

## 📊 الأداء المتوقع:

- **سرعة التحويل:** 3-5 ثوانٍ (Whisper)
- **سرعة التحليل:** 1-2 ثانية (Groq)
- **الدقة:** 90-95% للعربية الفصحى
- **التكلفة:** مجاني 100%

---

**جاهز للاستخدام! 🚀**
