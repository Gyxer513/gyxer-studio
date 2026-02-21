import type { GyxerProject } from '@gyxer/schema';

export interface SecurityCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface SecurityReport {
  projectName: string;
  timestamp: string;
  checks: SecurityCheck[];
  passed: number;
  failed: number;
  score: number;
}

/**
 * Generate a security report for the project configuration.
 */
export function generateSecurityReport(project: GyxerProject): SecurityReport {
  const checks: SecurityCheck[] = [];

  // Helmet
  checks.push({
    name: 'Helmet (Security Headers)',
    passed: project.settings.enableHelmet,
    message: project.settings.enableHelmet
      ? 'Helmet is enabled — security headers will be set'
      : 'Helmet is disabled — consider enabling for security headers (XSS, CSP, etc.)',
    severity: 'critical',
  });

  // CORS
  checks.push({
    name: 'CORS Configuration',
    passed: project.settings.enableCors,
    message: project.settings.enableCors
      ? 'CORS is enabled — configure allowed origins for production'
      : 'CORS is disabled — API won\'t be accessible from browsers on other domains',
    severity: 'warning',
  });

  // Rate Limiting
  checks.push({
    name: 'Rate Limiting',
    passed: project.settings.enableRateLimit,
    message: project.settings.enableRateLimit
      ? `Rate limiting: ${project.settings.rateLimitMax} requests per ${project.settings.rateLimitTtl}s`
      : 'Rate limiting is disabled — API is vulnerable to brute force attacks',
    severity: 'critical',
  });

  // Validation Pipe (always enabled)
  checks.push({
    name: 'Input Validation',
    passed: true,
    message: 'ValidationPipe with whitelist enabled — unknown properties will be stripped',
    severity: 'info',
  });

  // Docker
  checks.push({
    name: 'Docker Configuration',
    passed: project.settings.docker,
    message: project.settings.docker
      ? 'Docker setup included — multi-stage build for smaller image'
      : 'Docker setup skipped — consider containerizing for consistent deployments',
    severity: 'info',
  });

  // .env.example
  checks.push({
    name: 'Environment Variables',
    passed: true,
    message: '.env.example generated — secrets are not hardcoded',
    severity: 'critical',
  });

  // Authentication
  const hasAuthJwt = project.modules?.some((m) => m.name === 'auth-jwt' && m.enabled !== false);
  checks.push({
    name: 'Authentication',
    passed: !!hasAuthJwt,
    message: hasAuthJwt
      ? 'JWT authentication enabled — routes protected by default, bcrypt password hashing'
      : 'No authentication module — API endpoints are publicly accessible',
    severity: 'critical',
  });

  // Swagger in production warning
  if (project.settings.enableSwagger) {
    checks.push({
      name: 'Swagger Docs',
      passed: true,
      message: 'Swagger is enabled — consider disabling in production or adding auth',
      severity: 'warning',
    });
  }

  const passed = checks.filter((c) => c.passed).length;
  const failed = checks.filter((c) => !c.passed).length;
  const score = Math.round((passed / checks.length) * 100);

  return {
    projectName: project.name,
    timestamp: new Date().toISOString(),
    checks,
    passed,
    failed,
    score,
  };
}

/**
 * Format security report for console output.
 */
export function formatSecurityReport(report: SecurityReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('=== GYXER SECURITY REPORT ===');
  lines.push(`Project: ${report.projectName}`);
  lines.push(`Score: ${report.score}%`);
  lines.push('');

  for (const check of report.checks) {
    const icon = check.passed ? '[PASS]' : '[FAIL]';
    const severity = check.severity.toUpperCase();
    lines.push(`  ${icon} [${severity}] ${check.name}`);
    lines.push(`         ${check.message}`);
  }

  lines.push('');
  lines.push(`Results: ${report.passed} passed, ${report.failed} failed`);
  lines.push('=============================');

  return lines.join('\n');
}
