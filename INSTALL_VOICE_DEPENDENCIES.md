# تثبيت متطلبات ميزة التسجيل الصوتي

## 1. تثبيت المكتبات في Backend

```bash
cd backend
npm install groq-sdk
npm install @nestjs/platform-express
npm install multer
npm install @types/multer --save-dev
```

## 2. تثبيت Whisper AI

```bash
# تثبيت Whisper
pip3 install -U openai-whisper

# تأكد من التثبيت
whisper --help
```

## 3. تثبيت FFmpeg (مطلوب لـ Whisper)

### Windows:
```bash
# استخدم Chocolatey
choco install ffmpeg

# أو حمل من الموقع الرسمي
# https://ffmpeg.org/download.html
```

### Linux:
```bash
sudo apt update
sudo apt install ffmpeg
```

### macOS:
```bash
brew install ffmpeg
```

## 4. تحميل نموذج Whisper (أول مرة فقط)

```bash
# نموذج medium (موصى به للعربي)
whisper test.wav --model medium --language Arabic
```

## 5. إعداد المتغيرات البيئية

أضف في ملف `.env`:

```env
# Groq API Key
GROQ_API_KEY=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
```

## 6. إعادة تشغيل Backend

```bash
cd backend
npm run start:dev
```

## التحقق من التثبيت

### تحقق من Whisper:
```bash
whisper --help
```

### تحقق من FFmpeg:
```bash
ffmpeg -version
```

### تحقق من Node Modules:
```bash
cd backend
npm list groq-sdk
```

## الاستخدام

1. افتح لوحة التحكم (Admin Dashboard)
2. اضغط على زر "تسجيل المعلومات صوتياً" (الزر البنفسجي)
3. سجل صوتك بالعربية
4. انتظر المعالجة
5. اختر المورد وأكد الحفظ

## ملاحظات مهمة

- ✅ **Groq API** مجاني وسريع جداً
- ✅ **Whisper** يعمل محلياً (لا يحتاج API)
- ✅ نموذج **medium** أفضل للعربية
- ✅ التسجيلات تُحذف تلقائياً بعد المعالجة
