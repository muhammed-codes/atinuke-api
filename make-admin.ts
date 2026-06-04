import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.profile.updateMany({
    data: {
      role: 'ADMIN',
      status: 'APPROVED'
    }
  });
  console.log(`Updated ${count.count} profiles to ADMIN/APPROVED`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
