# تثبيت FFmpeg على Windows

## المشكلة:
FFmpeg فشل في التثبيت عبر Chocolatey بسبب صلاحيات المسؤول.

## ✅ الحل 1: تثبيت يدوي (موصى به)

### الخطوات:

1. **حمل FFmpeg:**
   - اذهب إلى: https://www.gyan.dev/ffmpeg/builds/
   - حمل: `ffmpeg-release-essentials.zip`

2. **فك الضغط:**
   - فك ضغط الملف في مجلد مثل: `C:\ffmpeg`

3. **إضافة إلى PATH:**
   - اضغط `Win + X` واختر "System"
   - اضغط "Advanced system settings"
   - اضغط "Environment Variables"
   - في "System variables" ابحث عن `Path`
   - اضغط "Edit"
   - اضغط "New"
   - أضف: `C:\ffmpeg\bin`
   - اضغط "OK" على جميع النوافذ

4. **تأكد من التثبيت:**
   ```powershell
   # أعد فتح PowerShell
   ffmpeg -version
   ```

## الحل 2: استخدام Scoop (بديل Chocolatey)

```powershell
# تثبيت Scoop
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# تثبيت FFmpeg
scoop install ffmpeg
```

## الحل 3: Chocolatey كمسؤول

1. **افتح PowerShell كمسؤول:**
   - اضغط `Win + X`
   - اختر "Windows PowerShell (Admin)"

2. **احذف الملفات المقفلة:**
   ```powershell
   Remove-Item "C:\ProgramData\chocolatey\lib\c00565a56f0e64a50f2ea5badcb97694d43e0755" -Force -ErrorAction SilentlyContinue
   Remove-Item "C:\ProgramData\chocolatey\lib-bad" -Force -Recurse -ErrorAction SilentlyContinue
   ```

3. **أعد المحاولة:**
   ```powershell
   choco install ffmpeg -y
   ```

## ✅ التحقق من التثبيت:

```powershell
ffmpeg -version
```

يجب أن ترى معلومات FFmpeg.

## 🚀 بعد التثبيت:

1. **أعد فتح PowerShell/Terminal**
2. **حمل نموذج Whisper:**
   ```bash
   # سجل ملف صوتي قصير واحفظه كـ test.wav
   whisper test.wav --model medium --language Arabic
   ```
3. **شغل Backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

## 🎯 جاهز!

الآن يمكنك استخدام ميزة التسجيل الصوتي من لوحة التحكم!
