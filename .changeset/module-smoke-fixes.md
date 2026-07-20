---
'@gyxer-studio/generator': patch
---

fix: plugin modules survive a real docker-compose run (found by live smoke)

- cache: generated module used a `Cacheable`-in-stores pattern that does not compile against @nestjs/cache-manager v3 / cache-manager v6 — replaced with the official Keyv multi-store pattern; `get()` return type is now `T | null`
- queues: BullMQ read only REDIS_HOST/REDIS_PORT while docker-compose exports REDIS_URL, so workers connected to localhost — REDIS_URL is now the canonical setting with host/port as overrides
- search: docker-compose sets MEILI_MASTER_KEY on the meilisearch service but never passed MEILISEARCH_API_KEY to the app — every search request got 401
- compose healthchecks for minio/meilisearch probed `localhost`, which resolves to IPv6 ::1 inside the containers while the services listen on IPv4 — switched to 127.0.0.1 (meilisearch never became healthy)
- file-storage: `.env` hardcoded S3_BUCKET=uploads, ignoring the module's `bucket` option
