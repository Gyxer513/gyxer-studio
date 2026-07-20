---
'@gyxer-studio/cli': minor
---

feat: `gyxer generate --force` overwrites an existing output directory without asking; without the flag in a non-interactive shell (CI, scripts) the command now fails fast with a clear message instead of hanging on a hidden prompt
