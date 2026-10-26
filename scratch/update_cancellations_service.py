import os

file_path = "/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/src/cancellations/cancellations.service.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = """  /**
   * Get single cancellation record by ID
   */
  async getCancellation(tenantId: string, id: string) {
    const record = await this.prisma.plotCancellation.findFirst({
      where: { tenantId, id },
      include: {
        property: true,
        customer: true,
        receipt: true,
      },
    });

    if (!record) throw new NotFoundException('Cancellation record not found');
    return record;
  }
}"""

replacement = """  /**
   * Get single cancellation record by ID, propertyId, or plot code (with previous and new allottee)
   */
  async getCancellation(tenantId: string, id: string) {
    const record = await this.prisma.plotCancellation.findFirst({
      where: {
        tenantId,
        OR: [
          { id },
          { propertyId: id },
          { property: { code: { equals: id, mode: 'insensitive' } } },
        ],
      },
      orderBy: { cancelledAt: 'desc' },
      include: {
        property: {
          include: {
            ownerships: {
              orderBy: { startDate: 'asc' },
              include: { customer: true },
            },
          },
        },
        customer: true,
        receipt: true,
      },
    });

    if (!record) throw new NotFoundException('Cancellation record not found');

    let newAllottee = null;
    if (record.property && record.property.ownerships) {
      const subsequentOwnerships = record.property.ownerships.filter(
        (o) =>
          o.customerId !== record.customerId &&
          (new Date(o.startDate) >= new Date(record.cancelledAt) || o.endDate === null || !o.endDate),
      );
      if (subsequentOwnerships.length > 0) {
        newAllottee = subsequentOwnerships[0].customer;
      }
    }

    return {
      ...record,
      newAllottee,
    };
  }
}"""

if target in content:
    content = content.replace(target, replacement)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("SUCCESS: Updated cancellations.service.ts in test repository")
else:
    print("ERROR: Target block not found in cancellations.service.ts")
