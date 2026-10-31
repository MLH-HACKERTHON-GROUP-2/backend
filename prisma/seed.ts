import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@healthsystem.local' },
    update: {},
    create: {
      role: Role.SYSTEM_ADMIN,
      email: 'admin@healthsystem.local',
      name: 'System Admin',
    },
  });

  console.log('Seeded system admin:', admin.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
