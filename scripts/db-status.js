const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const total = await p.challenge.count();
  const activeCount = await p.challenge.count({ where: { isActive: true } });
  const byCategory = await p.challenge.groupBy({ by: ['categoryId'], _count: true });
  const categories = await p.category.findMany();
  const teams = await p.team.count();
  const users = await p.user.count();
  const solves = await p.solve.count();
  const submissions = await p.submission.count();
  
  console.log('=== UNDERGROUND_0x1 DATABASE STATUS ===\n');
  console.log('CHALLENGES');
  console.log('  Total:', total);
  console.log('  Active:', activeCount);
  console.log('\nCHALLENGES BY CATEGORY:');
  for (const c of byCategory) {
    const cat = categories.find(x => x.id === c.categoryId);
    console.log(' ', cat?.name || c.categoryId, ':', c._count);
  }
  console.log('\nPLATFORM STATS');
  console.log('  Total Teams:', teams);
  console.log('  Total Users:', users);
  console.log('  Total Solves:', solves);
  console.log('  Total Submissions:', submissions);
}

main()
  .catch(e => console.error(e))
  .finally(() => p.$disconnect());
