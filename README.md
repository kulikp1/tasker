# Tasker — спільний Kanban + персональні фінанси

Приватний застосунок для двох користувачів: спільна Kanban-дошка та персональна сторінка фінансової аналітики з інтеграцією Monobank. Весь стек — на безкоштовних тарифах (див. розділ «Бюджет» нижче).

## Стек і архітектурні рішення

- **Frontend**: Vue 3 (Composition API) + TypeScript + Vite, Pinia, Tailwind CSS, vuedraggable, vue-chartjs (Chart.js), vue-sonner, lucide-vue-next, @vueuse/motion.
- **Backend**: Node.js + Express + TypeScript, MongoDB + Mongoose, JWT (access+refresh, httpOnly cookies), Cloudinary (signed upload через backend), Monobank Personal API.
- **Realtime**: **Pusher Channels**, а не власний Socket.io-сервер. Причина: Vercel хостить backend як serverless-функції без довготривалих з'єднань, тому "звичайний" Socket.io там не працює стабільно. Замість другого деплойменту (окремий WS-сервер на Render/Railway з cross-origin cookies) весь застосунок — **один Vercel-проєкт** (фронтенд + backend-функції на тому самому домені), а Pusher бере на себе доставку подій у реальному часі. Це просто, безкоштовно (Pusher free: 100 з'єднань, 200k повідомлень/день — з великим запасом для 2 користувачів) і дає онлайн/офлайн-статус "з коробки" через presence-канал.
- **Хостинг**: Vercel (Hobby, безкоштовний). `/api` — Express-застосунок, задеплоєний як serverless-функція (catch-all). Решта — статична збірка Vite.

## Бюджет: усе безкоштовно

| Сервіс | Тариф | Нюанс |
|---|---|---|
| MongoDB Atlas | Free M0 (512MB) | достатньо для 2 користувачів |
| Vercel | Hobby | serverless-функції + статика в одному проєкті |
| Cloudinary | Free tier | ліміт ~25 "credits"/міс (storage+transformations+bandwidth разом). Фронтенд стискає зображення в браузері (canvas, до ~1600px) перед завантаженням, щоб економити квоту — якщо будете вантажити багато великих фото, слідкуйте за використанням у Cloudinary-дашборді |
| Pusher Channels | Free | 100 з'єднань, 200k повідомлень/день |
| Monobank Personal API | безкоштовний персональний токен | ліміт 1 запит на statement/60с і 31 день за раз — тому синхронізація в застосунку по кнопці, а не по cron |

Якщо для якогось функціоналу вам не вистачить безкоштовних лімітів — насамперед перевіряйте Cloudinary (найшвидше вичерпується на фото) і Pusher (при активному використанні понад 100 одночасних з'єднань, що для 2 людей малоймовірно).

## Структура проєкту

```
/tasker
  /api          — Vercel serverless entrypoint (catch-all, обортає Express-app з /backend)
  /backend      — Express+TS: models, routes, services, middleware
  /frontend     — Vue3+Vite+TS SPA
  vercel.json   — build/routing конфіг для Vercel
```

## Запуск локально

Потрібен Node.js 20+.

```bash
npm install                 # встановить залежності і backend, і frontend (npm workspaces)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# заповніть обидва .env реальними значеннями (див. чек-лист креденшелів нижче)

npm run seed                 # створить 2 юзерів (Паша/admin, Ліза/user) + стандартні колонки дошки
npm run dev                  # backend на :4000, frontend на :5173 (з проксі /api -> :4000)
```

Відкрийте http://localhost:5173. Юзернейми і тимчасові паролі виводяться в консоль після `npm run seed` — **збережіть їх, вони показуються лише один раз** (далі зберігається тільки хеш). При першому вході застосунок наполегливо попросить змінити пароль.

## Чек-лист креденшелів (в порядку отримання)

### 1. MongoDB Atlas (безкоштовна БД)
1. Зареєструйтесь на [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → створіть організацію/проєкт.
2. Створіть кластер **M0 Free**.
3. Database Access → створіть юзера БД (username+password).
4. Network Access → додайте `0.0.0.0/0` (для Vercel, де IP непередбачувані) або конкретні IP.
5. Connect → Drivers → скопіюйте рядок підключення, підставте свій пароль → це `MONGODB_URI` у `backend/.env`.

### 2. Cloudinary (зображення)
1. Зареєструйтесь на [cloudinary.com](https://cloudinary.com/) (Free tier).
2. Dashboard → Account Details → скопіюйте `Cloud name`, `API Key`, `API Secret`.
3. Впишіть у `backend/.env`: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Ці значення **лишаються тільки на backend** — фронтенд про них нічого не знає, завантаження йде проксі через наш `/api/uploads`.

### 3. Pusher Channels (realtime)
1. Зареєструйтесь на [pusher.com](https://pusher.com/) → Channels → Create app (Free tier).
2. App Keys → скопіюйте `app_id`, `key`, `secret`, `cluster`.
3. У `backend/.env`: `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`.
4. У `frontend/.env`: `VITE_PUSHER_KEY` (те саме значення `key`, воно публічне за задумом) та `VITE_PUSHER_CLUSTER`. **`PUSHER_SECRET` ніколи не йде у frontend.**

### 4. Monobank (фінанси) — робить кожен користувач для себе
1. Кожен з двох юзерів окремо заходить на [api.monobank.ua](https://api.monobank.ua/) і отримує свій персональний токен (потрібен додаток Monobank для підтвердження).
2. Токен вводиться прямо в застосунку, на сторінці «Фінанси» → «Підключити Monobank» (не в `.env` — токен зберігається зашифрованим в БД для конкретного юзера).
3. Для шифрування токена в БД потрібен свій секрет у `backend/.env`: `TOKEN_ENCRYPTION_KEY` — 32-байтний hex-ключ, згенеруйте:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### 5. JWT-секрети (свої, не від стороннього сервісу)
Згенеруйте два незалежні секрети для `backend/.env`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
→ `JWT_ACCESS_SECRET` і `JWT_REFRESH_SECRET` (два різних значення).

### 6. Деплой на Vercel
1. Заведіть репозиторій на GitHub, підключіть до [vercel.com](https://vercel.com/) (Hobby plan).
2. Project Settings → Environment Variables — додайте **всі** змінні з `backend/.env` (окрім `PORT`, він не потрібен на Vercel) та `VITE_PUSHER_KEY`/`VITE_PUSHER_CLUSTER`/`VITE_API_BASE_URL=/api` з `frontend/.env`. За потреби розділяйте значення між Production/Preview/Development.
3. Root Directory лишається кореневим (не `/frontend`) — `vercel.json` сам вказує, що білдити і куди роутити `/api`.
4. Після першого деплою підключіться до продової БД і запустіть `npm run seed` **локально** з `MONGODB_URI`, що вказує на той самий Atlas-кластер (сідування — одноразова операція, окремого прод-скрипта на Vercel для цього немає).

## Безпека секретів

- `.env`, `.env.local`, `.env.*.local` — у `.gitignore` з самого початку, ніколи не комітяться.
- `.env.example` (в `backend/` і `frontend/`) містить лише назви змінних, без значень.
- Cloudinary secret, Pusher secret, Monobank-токени (шифровані) — виключно на backend. У клієнтський бандл потрапляють тільки `VITE_*`-змінні, і серед них немає жодного секрету.
- Перед комітом: `git status` / `git diff` — переконайтесь, що жоден `.env`-файл не потрапив у staged-зміни.

## Ролі та права

- **admin** (Паша): усе, що може user, + `/admin` — створення юзерів, журнал дій усіх юзерів (фільтр по юзеру, дефолт «усі, крім мене»), онлайн-статус і остання активність.
- **user** (Ліза): Kanban, фінанси (свої), список покупок. `/admin` повертає 403 і на фронті, і на бекенді.
- Kanban-таску може редагувати/видаляти лише її автор (`task.createdBy`); призначений виконавець може лише перетягувати таску між колонками. Перевірка — і на фронті (дизейблені поля), і на бекенді (403).
- Список покупок — спільний, без обмежень по автору: обидва юзери мають рівні права.

## Що перевірено

- `npm run build` проходить без помилок і для `backend` (`tsc`), і для `frontend` (`vue-tsc` + `vite build`).
- Backend піднімається і коректно обробляє запити/помилки (перевірено локальним смоук-тестом).
- iOS Safari: viewport з `user-scalable=no`, `font-size: 16px` на всіх `input/select/textarea`, прибраний tap-highlight, `touch-action: manipulation`, `100dvh` замість `100vh`, `env(safe-area-inset-*)`, `overscroll-behavior-y: contain`, PWA-маніфест + apple-touch-icon для «Add to Home Screen».

Реальний онлайн-флоу (логін під обома юзерами, DnD-синхронізація, Monobank-синк) можна перевірити тільки після того, як будуть підключені справжні MongoDB/Cloudinary/Pusher/Monobank креденшели за чек-листом вище — без них застосунок піднімається, але падає на будь-якому запиті до БД.
