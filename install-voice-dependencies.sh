#!/bin/bash

echo "🎤 تثبيت متطلبات ميزة التسجيل الصوتي..."
echo ""

# 1. تثبيت المكتبات في Backend
echo "📦 تثبيت المكتبات في Backend..."
cd backend
npm install groq-sdk
npm install @nestjs/platform-express
npm install multer
npm install @types/multer --save-dev

echo ""
echo "✅ تم تثبيت المكتبات في Backend بنجاح!"
echo ""

# 2. تثبيت Whisper
echo "🤖 تثبيت Whisper AI..."
pip3 install -U openai-whisper

echo ""
echo "✅ تم تثبيت Whisper بنجاح!"
echo ""

# 3. التحقق من FFmpeg
echo "🔍 التحقق من FFmpeg..."
if command -v ffmpeg &> /dev/null
then
    echo "✅ FFmpeg مثبت بالفعل"
    ffmpeg -version | head -n 1
else
    echo "❌ FFmpeg غير مثبت!"
    echo "يرجى تثبيت FFmpeg:"
    echo "  - Windows: choco install ffmpeg"
    echo "  - Linux: sudo apt install ffmpeg"
    echo "  - macOS: brew install ffmpeg"
fi

echo ""
echo "🎉 اكتمل التثبيت!"
echo ""
echo "الخطوات التالية:"
echo "1. تأكد من إضافة GROQ_API_KEY في ملف .env"
echo "2. قم بتحميل نموذج Whisper: whisper test.wav --model medium --language Arabic"
echo "3. أعد تشغيل Backend: npm run start:dev"
