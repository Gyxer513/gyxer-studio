import type { GyxerProject } from '@gyxer-studio/schema';

interface SeedUser {
  email: string;
  password: string;
  [key: string]: unknown;
}

const DEFAULT_SEED_USERS: SeedUser[] = [
  { email: 'admin@example.com', password: 'password123' }, // pragma: allowlist secret
];

/**
 * Generate prisma/seed.ts for seeding test users.
 * Only called when auth-jwt module is enabled.
 *
 * Reads seedUsers from auth-jwt module options, falling back to a single
 * admin@example.com user when none are configured.
 */
export function generateSeedFile(project: GyxerProject): string {
  // Extract seedUsers from auth-jwt module options
  const authModule = project.modules?.find((m) => m.name === 'auth-jwt' && m.enabled !== false);
  const rawSeedUsers = authModule?.options?.seedUsers as SeedUser[] | undefined;
  const seedUsers: SeedUser[] = rawSeedUsers?.length ? rawSeedUsers : DEFAULT_SEED_USERS;

  // Collect required User fields without defaults (except email — already handled)
  const userEntity = project.entities.find((e) => e.name === 'User');
  const extraFields = (userEntity?.fields ?? []).filter(
    (f) => f.required && f.name !== 'email' && f.default === undefined,
  );

  /** Build the extra field assignments for a single user create block. */
  function buildExtraData(user: SeedUser): string {
    return extraFields
      .map((f) => {
        // If the seedUser has this field explicitly, use it
        if (user[f.name] !== undefined) {
          const val = user[f.name];
          if (typeof val === 'boolean') return `      ${f.name}: ${val},`;
          if (typeof val === 'number') return `      ${f.name}: ${val},`;
          return `      ${f.name}: '${val}',`;
        }
        // Fallback defaults by type
        if (f.type === 'boolean') return `      ${f.name}: false,`;
        if (f.type === 'int' || f.type === 'float') return `      ${f.name}: 0,`;
        return `      ${f.name}: '${f.name}',`;
      })
      .join('\n');
  }

  // Generate upsert blocks for each seed user
  const upsertBlocks = seedUsers.map((user, i) => {
    const extraData = buildExtraData(user);
    const extraDataBlock = extraData ? '\n' + extraData : '';
    const varName = i === 0 ? 'user' : `user${i + 1}`;

    return `  const passwordHash${i > 0 ? i + 1 : ''} = await bcrypt.hash('${user.password}', 12); // pragma: allowlist secret

  const ${varName} = await prisma.user.upsert({
    where: { email: '${user.email}' },
    update: {},
    create: {
      email: '${user.email}',
      passwordHash${i > 0 ? i + 1 : ''},${extraDataBlock}
    },
  });

  console.log('Seeded user:', ${varName}.email);`;
  });

  return `import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
${upsertBlocks.join('\n\n')}
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
