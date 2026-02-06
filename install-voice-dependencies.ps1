# PowerShell script for Windows
Write-Host "🎤 تثبيت متطلبات ميزة التسجيل الصوتي..." -ForegroundColor Cyan
Write-Host ""

# 1. تثبيت المكتبات في Backend
Write-Host "📦 تثبيت المكتبات في Backend..." -ForegroundColor Yellow
Set-Location backend
npm install groq-sdk
npm install @nestjs/platform-express
npm install multer
npm install @types/multer --save-dev

Write-Host ""
Write-Host "✅ تم تثبيت المكتبات في Backend بنجاح!" -ForegroundColor Green
Write-Host ""

# 2. تثبيت Whisper
Write-Host "🤖 تثبيت Whisper AI..." -ForegroundColor Yellow
pip3 install -U openai-whisper

Write-Host ""
Write-Host "✅ تم تثبيت Whisper بنجاح!" -ForegroundColor Green
Write-Host ""

# 3. التحقق من FFmpeg
Write-Host "🔍 التحقق من FFmpeg..." -ForegroundColor Yellow
$ffmpegInstalled = Get-Command ffmpeg -ErrorAction SilentlyContinue
if ($ffmpegInstalled) {
    Write-Host "✅ FFmpeg مثبت بالفعل" -ForegroundColor Green
    ffmpeg -version | Select-Object -First 1
} else {
    Write-Host "❌ FFmpeg غير مثبت!" -ForegroundColor Red
    Write-Host "يرجى تثبيت FFmpeg باستخدام Chocolatey:" -ForegroundColor Yellow
    Write-Host "  choco install ffmpeg" -ForegroundColor White
}

Write-Host ""
Write-Host "🎉 اكتمل التثبيت!" -ForegroundColor Green
Write-Host ""
Write-Host "الخطوات التالية:" -ForegroundColor Cyan
Write-Host "1. تأكد من إضافة GROQ_API_KEY في ملف .env ✅" -ForegroundColor White
Write-Host "2. قم بتحميل نموذج Whisper: whisper test.wav --model medium --language Arabic" -ForegroundColor White
Write-Host "3. أعد تشغيل Backend: npm run start:dev" -ForegroundColor White
Write-Host ""

Set-Location ..
