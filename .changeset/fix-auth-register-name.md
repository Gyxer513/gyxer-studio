---
'@gyxer-studio/generator': patch
---

fix: auth register endpoint includes required User fields (name) when User entity is not on canvas

When User entity is not explicitly added to the editor canvas, the auto-generated User model
has a required `name` field. The auth service register method and RegisterDto now correctly
include this field, matching the existing fallback behavior in the seed generator.
