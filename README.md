# PopCorn TMA

تطبيق تيليغرام مصغر (Telegram Mini App) لمشاهدة الأفلام والمسلسلات.

## النشر

### GitHub Pages

ادفع الملفات إلى مستودع GitHub وفعّل GitHub Pages من الإعدادات.

### محلياً

افتح `index.html` في متصفحك.

## الهيكل

```
frontend/
├── index.html
├── style.css
├── manifest.json
├── _config.yml
├── src/
│   ├── config.js
│   ├── telegram.js
│   ├── api.js
│   └── app.js
└── README.md
```

## API

التطبيق يتواصل مع Gateway API عبر المسارات المحددة في `src/config.js`.
