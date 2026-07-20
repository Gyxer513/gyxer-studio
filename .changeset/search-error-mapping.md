---
'@gyxer-studio/generator': patch
---

fix: search endpoints validate input instead of leaking MeiliSearch errors as 500 — missing `q`/`index` and an empty reindex body return 400, an unknown index returns 404 with the list of available indexes
