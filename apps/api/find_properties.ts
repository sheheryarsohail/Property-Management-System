import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const p222Id = 'cmt45805501h4kyc7qxs55kp1'
  const p54Id = 'cmt1rx53e011mkyc7kda97msc'

  console.log('Searching for R-222 occurrences in related tables...')
  const plans = await prisma.paymentPlan.findMany({ where: { propertyId: p222Id } })
  console.log('Payment Plans for 222:', plans.map(p => p.title))

  const invoices = await prisma.invoice.findMany({ where: { propertyId: p222Id } })
  console.log('Invoices for 222 notes:', invoices.map(i => i.notes).filter(Boolean))

  const receipts = await prisma.receipt.findMany({ where: { propertyId: p222Id } })
  console.log('Receipts for 222 notes/reference:', receipts.map(r => ({ note: r.notes, ref: r.reference })))

  console.log('\nSearching for R-54 occurrences in related tables...')
  const plans54 = await prisma.paymentPlan.findMany({ where: { propertyId: p54Id } })
  console.log('Payment Plans for 54:', plans54.map(p => p.title))

  const invoices54 = await prisma.invoice.findMany({ where: { propertyId: p54Id } })
  console.log('Invoices for 54 notes:', invoices54.map(i => i.notes).filter(Boolean))
}

main().catch(console.error).finally(() => prisma.$disconnect())
