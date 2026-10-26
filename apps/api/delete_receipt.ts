import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const receipt = await prisma.receipt.findFirst({
    where: { code: '02066311' }
  });
  
  if (receipt) {
    console.log(`Found receipt ${receipt.id}. Deleting...`);
    await prisma.receipt.delete({
      where: { id: receipt.id }
    });
    console.log('Receipt deleted successfully.');
  } else {
    console.log('Receipt 02066311 not found.');
  }
}
main().then(() => prisma.$disconnect());
