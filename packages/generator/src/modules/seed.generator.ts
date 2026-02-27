import type { GyxerProject } from '@gyxer-studio/schema';

/**
 * Generate prisma/seed.ts for seeding a test user.
 * Only called when auth-jwt module is enabled.
 */
export function generateSeedFile(project: GyxerProject): string {
  // Collect required User fields without defaults (except email — already handled)
  const userEntity = project.entities.find((e) => e.name === 'User');
  const extraFields = (userEntity?.fields ?? []).filter(
    (f) => f.required && f.name !== 'email' && f.default === undefined,
  );

  // Build extra field assignments for the create call
  const extraData = extraFields
    .map((f) => {
      if (f.type === 'boolean') return `      ${f.name}: false,`;
      if (f.type === 'int' || f.type === 'float') return `      ${f.name}: 0,`;
      return `      ${f.name}: '${f.name}',`;
    })
    .join('\n');

  const extraDataBlock = extraData ? '\n' + extraData : '';

  return `import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12); // pragma: allowlist secret

  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash,${extraDataBlock}
    },
  });

  console.log('Seeded user:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;
}
