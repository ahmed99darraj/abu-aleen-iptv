# ABU-ALEEN IPTV Player

مشغل IPTV عربي مفتوح المصدر يدعم آلاف القنوات من مختلف أنحاء العالم.

## المميزات
- دعم آلاف القنوات العالمية
- واجهة مستخدم عربية سهلة الاستخدام
- تصنيف القنوات حسب النوع واللغة
- دعم البحث في القنوات
- تصميم متجاوب يعمل على جميع الأجهزة
- دعم مشغل HLS للبث المباشر
- قوائم تشغيل متعددة المصادر

## التقنيات المستخدمة
- Frontend: HTML5, CSS3, JavaScript
- Backend: Python, Flask
- Video Player: HLS.js
- API: RESTful API

## التثبيت والتشغيل

### متطلبات النظام
- Python 3.8+
- Node.js (اختياري، للتطوير)

### تثبيت المتطلبات
```bash
# تثبيت متطلبات الباك إند
cd backend
pip install -r requirements.txt

# تشغيل الباك إند
python app.py
```

### تشغيل التطبيق
1. شغل الباك إند:
```bash
cd backend
python app.py
```

2. افتح الفرونت إند:
- افتح ملف `frontend/index.html` في المتصفح
- أو استخدم خادم ويب بسيط:
```bash
cd frontend
python -m http.server 8000
```

## المساهمة
نرحب بمساهماتكم! يرجى اتباع الخطوات التالية:
1. Fork المشروع
2. إنشاء فرع جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى الفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## الترخيص
هذا المشروع مرخص تحت رخصة MIT - انظر ملف [LICENSE](LICENSE) للتفاصيل.

## شكر وتقدير
- [iptv-org](https://github.com/iptv-org/iptv) لتوفير قوائم القنوات
- [Free-TV](https://github.com/Free-TV/IPTV) للقنوات الإضافية
- [HLS.js](https://github.com/video-dev/hls.js/) لمشغل الفيديو
