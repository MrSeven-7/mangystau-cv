# Mangystau CV

Монорепозиторий MVP сервиса резюме и вакансий для Мангистауской области.

## Быстрый старт

1. Установите Node.js 20+ и PostgreSQL.
2. Скопируйте `.env.example` в `.env` и задайте `DATABASE_URL`.
3. Выполните `npm install`, затем `npm run db:migrate`.
4. Запустите веб-приложение командой `npm run dev`; API запускается отдельно командой `npm run dev:api`.

Веб-приложение доступно по адресу `http://localhost:3000`, API — `http://localhost:4000/api`. Создайте первую миграцию Prisma командой `npm run db:migrate --workspace @mangystau/api`.
Рабочие части MVP: каталог демонстрационных вакансий с фильтрами в URL, гостевой редактор с автосохранением в браузере, регистрация и вход через API с argon2 и access/refresh JWT. Для регистрации API должен быть запущен, а PostgreSQL — доступен.

Пока не реализованы: CRUD вакансий и отклики, RBAC guards для закрытых маршрутов, PDF рендер через Playwright, публичные резюме, Redis/поисковый индекс и мультиязычность. Кнопка скачивания резюме сейчас выгружает текстовый черновик.

## Структура

- `apps/web` — Next.js App Router.
- `apps/api` — NestJS, Prisma и PostgreSQL.
- `packages/shared` — общие Zod-схемы.

## Развёртывание на Vercel

Веб-приложение и API разворачиваются как два проекта из одного Git-репозитория:

1. Создайте PostgreSQL-базу данных у провайдера, доступного из Vercel, и сохраните строку подключения.
2. Импортируйте репозиторий в Vercel дважды. Для проекта сайта укажите **Root Directory** `apps/web`, для проекта API — `apps/api`. Разрешите Vercel доступ к файлам вне корневой директории проекта, так как оба workspace используют `packages/shared`.
3. В проекте API задайте `DATABASE_URL`, `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET`. Для секретов используйте разные случайные значения; не используйте значения из `.env.example`.
4. Разверните API и скопируйте его домен, например `https://mangystau-api.vercel.app`.
5. В настройках проекта сайта задайте переменную `API_URL` равной домену API без завершающего слеша, например `https://mangystau-api.vercel.app`, затем разверните сайт.
6. После настройки `DATABASE_URL` примените миграции из корня репозитория: `npx prisma migrate deploy --schema apps/api/prisma/schema.prisma`. Для создания администратора задайте `ADMIN_EMAIL` и `ADMIN_PASSWORD` (не короче 12 символов), затем выполните `npm run admin:reset`.

Для локальной разработки оставьте `API_URL=http://localhost:4000`; `.env` и `.env.local` не добавляйте в Git. После изменения `API_URL` пересоберите проект сайта.
