# Security Report

Every generated project includes a `security-report.json` with an automated security assessment.

## Report Structure

```typescript
interface SecurityReport {
  projectName: string;
  timestamp: string;
  checks: SecurityCheck[];
  passed: number;
  failed: number;
  score: number; // percentage (0-100)
}

interface SecurityCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}
```

## Security Checks

| # | Check | Severity | Pass Condition |
|---|-------|----------|---------------|
| 1 | Helmet (Security Headers) | critical | `enableHelmet: true` |
| 2 | CORS Configuration | warning | `enableCors: true` |
| 3 | Rate Limiting | critical | `enableRateLimit: true` |
| 4 | Input Validation | info | Always passes (ValidationPipe is always enabled) |
| 5 | Docker Configuration | info | `docker: true` |
| 6 | Environment Variables | critical | Always passes (.env.example is always generated) |
| 7 | Authentication | critical | `auth-jwt` module enabled |
| 8 | Swagger Docs | warning | Only shown when Swagger is enabled |

## Score Calculation

```
score = Math.round((passed / total) * 100)
```

- **100%** — all security features enabled including auth
- **88%** — typical project without auth module
- **< 50%** — multiple critical features disabled

## Recommendations

### Critical

- **Helmet** — enables security headers (XSS protection, CSP, HSTS). Always keep enabled.
- **Rate Limiting** — protects against brute force and DDoS. Default: 100 requests per 60 seconds.
- **Authentication** — enable `auth-jwt` module so API endpoints are protected by default.
- **Environment Variables** — never hardcode secrets. Use `.env` file.

### Warning

- **CORS** — required for browser access from other domains. Configure allowed origins for production.
- **Swagger** — useful in development, consider disabling or adding authentication in production.

### Info

- **Input Validation** — `ValidationPipe` with `whitelist: true` strips unknown properties. Always enabled.
- **Docker** — containerization ensures consistent deployments.

## CLI Output

The security report is displayed in the CLI with color-coded output:

```
✔ Project generated!

  ✅ 35 files created in ./my-blog-auth
  🛡️  Security: 100%
```

Score colors: green (>= 80%), yellow (>= 50%), red (< 50%).
