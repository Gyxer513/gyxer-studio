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

- [ ] **Smoke всех модулей** — runtime проверен только базовый CRUD. file-storage / queues / search / cache / websockets / auth-* нужно поднимать хотя бы раз через docker-compose (Redis, MinIO, MeiliSearch) и дёргать healthcheck.
- [x] **Сборка сгенерированной админки** — проверено вручную: admin/ SPA из media-cms собирается. TODO: включить в CI smoke.
- [x] **MySQL-путь** — прогнан: генерация и сборка ок; найден и починен баг compose (postgres-юзер/порт вместо root/3306). Живой прогон с реальным MySQL — вместе со smoke модулей.
- [ ] **vitepress 2.x** — пока в альфе (stable = 1.6.4, наша). Обновить, когда выйдет стабильная двойка; 2 оставшиеся уязвимости — только dev-сервер доков.

## Косметика / после 1.0

- [ ] Code-splitting редактора (чанк 525 kB, React Flow).
- [x] Почистить мёртвые ветки на origin (10 удалено, осталась рабочая changeset-release/master).
- [ ] `configs/` из редактора: кнопка Generate пишет конфиг молча в `./configs/` — стоит показывать путь в UI.

## Исправлено в рамках аудита (войдёт в 0.6.0)

- CLI `--version` показывал 0.2.0, MCP serverInfo — 0.5.0 (захардкожено) → читаются из package.json.
- Поле с `default` было обязательным в Create DTO → теперь опционально, БД подставляет default.
- sqlite `DATABASE_URL` задваивал папку prisma; в Docker база лежала вне персистентного тома → данные терялись при пересоздании контейнера.
- Добавлен недостающий skill `.claude/commands/validate.md` (в changelog заявлено 6, было 5).
- Актуализировано число тестов в доках (367 → 382).
