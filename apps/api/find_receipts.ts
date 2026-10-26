import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Searching for Receipt 014662...')
  const r1 = await prisma.receipt.findMany({
    where: { 
      OR: [
        { code: { contains: '14662' } },
        { reference: { contains: '14662' } }
      ]
    },
    include: { invoice: true }
  })
  console.log('Receipt 014662 results:', JSON.stringify(r1, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
