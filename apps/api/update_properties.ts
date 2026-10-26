import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const p222Id = 'cmt45805501h4kyc7qxs55kp1'
  const p54Id = 'cmt1rx53e011mkyc7kda97msc'

  console.log('Updating R-222 to R-223...')
  const updated223 = await prisma.property.update({
    where: { id: p222Id },
    data: {
      code: 'R-223',
      title: 'Plot R-223'
    }
  })
  console.log('Successfully updated:', updated223.code, updated223.title)

  console.log('\nUpdating R-R-54 to R-54...')
  const updated54 = await prisma.property.update({
    where: { id: p54Id },
    data: {
      code: 'R-54',
      title: 'Plot R-54'
    }
  })
  console.log('Successfully updated:', updated54.code, updated54.title)
}

main().catch(console.error).finally(() => prisma.$disconnect())
