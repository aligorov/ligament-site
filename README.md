# Презентационный сайт Ligament 2FA/MFA

Официальный статический презентационный сайт-лендинг продукта **Ligament** (on-premise MFA/2FA платформа для корпоративной инфраструктуры).

Сайт построен по принципу **нулевых внешних зависимостей**:
- Чистый HTML5 + CSS3 + Vanilla JS без зависимостей и сборщиков (`site.js` ~34 КБ, ~10 КБ gzip; Node.js/npm не требуются).
- Без внешних CDN, веб-шрифтов, сторонних трекеров и сборщиков (Node.js/npm не требуются).
- Строгая политика безопасности CSP (`connect-src 'none'`, без инлайн-скриптов и `innerHTML`).
- Две полноценные статические языковые версии: `index.html` (RU, канонический) и `en/index.html` (EN).

---

## 📁 Структура репозитория

```
ligament-site/
├── index.html                 # Русская версия (канонический URL)
├── en/
│   └── index.html             # Английская версия (hreflang-пара)
├── 404.html                   # Брендированная страница ошибки (сохраняет статус 404)
├── styles.css                 # Единый файл стилей (CSS3 переменные, темная/светлая темы)
├── site.js                    # Vanilla JS (язык, темы, калькулятор, граф, буфер обмена)
├── robots.txt                 # Директивы для поисковых систем
├── sitemap.xml                # Карта сайта с разметкой hreflang
├── nginx.conf                 # Контейнерный Nginx (error_page, кэш, gzip)
├── Caddyfile                  # Альтернатива Nginx: авто-HTTPS + заголовки
├── security-headers.conf      # Готовый сниппет заголовков безопасности для Nginx
├── assets/
│   ├── brand/                 # SVG-логотипы (вариант 01 Связка), favicon, og-image
│   ├── media/                 # Скриншоты и видео интерфейса
│   │   ├── manifest.json      # Манифест слотов медиа
│   │   └── README.md          # Требования к скриншотам и видео
│   └── downloads/             # PDF-презентация продукта (22 слайда)
└── README.md                  # Данное руководство
```

---

## 🚀 Локальный запуск и тестирование

Для локального просмотра сайта достаточно запустить встроенный веб-сервер Python:

```bash
# Из корневой папки сайта:
python3 -m http.server 8080
```

Откройте в браузере:
- Русская версия: [http://localhost:8080/](http://localhost:8080/)
- Английская версия: [http://localhost:8080/en/](http://localhost:8080/en/)

Проверьте:
- Навигацию по якорным ссылкам (`#features`, `#pricing`, `#comparison`, `#install` и т.д.).
- Переключение языка (сохраняет текущий якорь; выбор запоминается в `localStorage`, вместо принудительного редиректа показывается открываемая подсказка).
- Переключение темы (светлая/тёмная, сохраняется в `localStorage`).
- Интерактивный калькулятор стоимости лицензии (табы работают с клавиатуры: стрелки/Home/End).
- Копирование адреса USDT-кошелька и консольных команд в буфер обмена (с резервным режимом для не-HTTPS).

---

## 🌐 Деплой на продакшен-сервер (Nginx)

1. Скопируйте содержимое каталога в директорию вашего веб-сервера (например `/var/www/ligament-site`).
2. Подключите сниппет `security-headers.conf` в конфигурацию вашего виртуального хоста Nginx:

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name ligam.org www.ligam.org;

    root /var/www/ligament-site;
    index index.html;

    # Брендированная 404 с сохранением статуса (без soft-404)
    error_page 404 /404.html;

    # Подключение строгих заголовков безопасности (CSP, HSTS, X-Frame-Options)
    include /var/www/ligament-site/security-headers.conf;

    location / {
        try_files $uri $uri/ =404;
    }

    # Кэширование статических ассетов (один Cache-Control без дублей)
    location ~* \.(css|js|svg|png|jpg|ico|pdf|webm|mp4)$ {
        add_header Cache-Control "public, max-age=2592000, immutable, no-transform";
        include /var/www/ligament-site/security-headers.conf;
    }
}
```

---

## 📸 Добавление скриншотов и видео

Все медиафайлы управляются через `assets/media/manifest.json`.
Если файла в каталоге `assets/media/` пока нет, сайт автоматически отображает стилизованный плейсхолдер с правильными пропорциями (`16/9` для видео и `16/10` для скриншотов).

- **Скриншоты**: сохраняйте в `assets/media/screen-<id>.png` (PNG 1600×1000 px, сжатие pngquant ≤ 350 КБ, единая тёмная тема `#111827`, замаскированные IP/домены/коды).
- **Видео**: сохраняйте в `assets/media/demo-<id>.webm` + fallback `.mp4` (1920×1080 px, ≤ 90 с, постер `<id>-poster.jpg`).
- Подробные инструкции и регламент — в [assets/media/README.md](assets/media/README.md).

---

## 🔒 Публикация в приватный репозиторий GitHub

1. Авторизуйтесь в GitHub CLI (если еще не авторизованы):
   ```bash
   gh auth status
   ```

2. Создайте приватный репозиторий и загрузите ветку `main`:
   ```bash
   gh repo create aligorov/ligament-site --private --source=. --remote=origin --push
   ```

Либо вручную:
```bash
git remote add origin https://github.com/aligorov/ligament-site.git
git push -u origin main
```
