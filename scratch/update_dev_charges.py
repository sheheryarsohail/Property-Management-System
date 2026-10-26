import os

target_path = '/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/src/development-charges/development-charges.service.ts'

with open(target_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Update bulkSetCharges
old_bulk = '''    let count = 0;
    for (const pid of input.propertyIds) {
      await this.setPropertyCharge(tenantId, pid, {
        amount: input.amount,
        dueDate: input.dueDate,
        phase: input.phase,
      });
      count++;
    }

    return { success: true, updatedCount: count };'''

new_bulk = '''    const CHUNK_SIZE = 10;
    let count = 0;
    for (let i = 0; i < input.propertyIds.length; i += CHUNK_SIZE) {
      const chunk = input.propertyIds.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (pid) => {
          await this.setPropertyCharge(tenantId, pid, {
            amount: input.amount,
            dueDate: input.dueDate,
            phase: input.phase,
          });
          count++;
        }),
      );
    }

    return { success: true, updatedCount: count };'''

assert old_bulk in text, "Could not find old_bulk in development-charges.service.ts"
text = text.replace(old_bulk, new_bulk, 1)

# Update generateCharges
old_generate = '''    let count = 0;
    for (const property of properties) {
      if (!property.sizeSqYd) continue;
      const size = Number(property.sizeSqYd);
      const totalAmount = size * input.pricePerSqYd;
      const activeOwnership = property.ownerships[0];
      if (!activeOwnership) continue;

      await this.setPropertyCharge(tenantId, property.id, {
        amount: totalAmount,
        dueDate: input.dueDate,
        phase: input.phase,
      });
      count++;
    }

    return { success: true, count };'''

new_generate = '''    const eligibleProperties = properties.filter((p) => p.sizeSqYd && p.ownerships?.[0]);
    const CHUNK_SIZE = 10;
    let count = 0;

    for (let i = 0; i < eligibleProperties.length; i += CHUNK_SIZE) {
      const chunk = eligibleProperties.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (property) => {
          const size = Number(property.sizeSqYd);
          const totalAmount = size * input.pricePerSqYd;
          await this.setPropertyCharge(tenantId, property.id, {
            amount: totalAmount,
            dueDate: input.dueDate,
            phase: input.phase,
          });
          count++;
        }),
      );
    }

    return { success: true, count };'''

assert old_generate in text, "Could not find old_generate in development-charges.service.ts"
text = text.replace(old_generate, new_generate, 1)

with open(target_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("SUCCESS: Successfully added bounded concurrency batching to development-charges.service.ts!")
