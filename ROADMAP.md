# Roadmap to 1.0

Цель: стабильная 1.0, пригодная как основной инструмент оптимизации разработки внутренних проектов.

## Статус после аудита 2026-07-20

Полный цикл проверен вручную: все 5 примеров (`examples/*.json`) проходят
generate → npm install → prisma generate → build → тесты. Сгенерированное
приложение (blog, sqlite) поднимается, Swagger отвечает, CRUD работает.
Editor, CLI (generate/validate/editor), MCP-сервер (14 tools) — рабочие.

## Блокеры 1.0

- [x] **Опубликовать 0.6.0** — все 4 пакета в npm, образ на Docker Hub, теги в git (2026-07-20). Секреты NPM_TOKEN/DOCKERHUB_TOKEN обновлены, для publish подключена 2FA (security key).
- [x] **`gyxer generate --force`** — флаг добавлен; без TTY и без флага — быстрый отказ с подсказкой вместо зависания (войдёт в 0.7.0).
- [x] **Runtime-smoke в CI** — job `runtime-smoke`: generate (sqlite) → install → migrate → build → тесты → boot → curl Swagger + POST/GET. Зелёный с первого прогона.

## Важное до 1.0

- [x] **Smoke всех модулей** — прогнан вживую (kitchen-sink: postgres+redis+minio+meili, docker-compose). Найдено и починено 5 багов: cache не компилировался (Keyv-паттерн), queues игнорировал REDIS_URL, приложению не передавался MEILISEARCH_API_KEY, healthcheck'и minio/meili били в ::1, S3_BUCKET игнорировал опцию. Проверено: auth, CRUD, upload/download, reindex+поиск, socket.io. Не прогнаны: auth-oauth (нужны реальные OAuth-креды), auth-keycloak (рантайм; сборка проверена).
- [x] **Сборка сгенерированной админки** — проверено вручную: admin/ SPA из media-cms собирается. TODO: включить в CI smoke.
- [x] **MySQL-путь** — полный живой прогон против mysql:8 в docker: db push, FK, float, дефолты — ок (после фикса compose root/3306).
- [ ] **vitepress 2.x** — пока в альфе (stable = 1.6.4, наша). Обновить, когда выйдет стабильная двойка; 2 оставшиеся уязвимости — только dev-сервер доков.

## Косметика / после 1.0

- [ ] Search-модуль: маппить ошибки Meili в 404/400 (сейчас неизвестный индекс и пустое тело reindex дают 500); валидировать обязательный `?index=`.
- [ ] Search-модуль: серверный reindex из БД (сейчас `POST /search/:index/reindex` ждёт документы в теле — это bulk-index, а не reindex).
- [ ] Code-splitting редактора (чанк 525 kB, React Flow).
- [x] Почистить мёртвые ветки на origin (10 удалено, осталась рабочая changeset-release/master).
- [ ] `configs/` из редактора: кнопка Generate пишет конфиг молча в `./configs/` — стоит показывать путь в UI.

## Исправлено в рамках аудита (войдёт в 0.6.0)

- CLI `--version` показывал 0.2.0, MCP serverInfo — 0.5.0 (захардкожено) → читаются из package.json.
- Поле с `default` было обязательным в Create DTO → теперь опционально, БД подставляет default.
- sqlite `DATABASE_URL` задваивал папку prisma; в Docker база лежала вне персистентного тома → данные терялись при пересоздании контейнера.
- Добавлен недостающий skill `.claude/commands/validate.md` (в changelog заявлено 6, было 5).
- Актуализировано число тестов в доках (367 → 382).
