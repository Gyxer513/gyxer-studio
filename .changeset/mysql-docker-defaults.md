---
'@gyxer-studio/generator': patch
---

fix: MySQL docker-compose and .env used postgres-flavored defaults (user `postgres`, port 5432), so the generated app could not connect to the database; defaults now translate to `root`/3306, and a custom dbUser is created via MYSQL_USER
