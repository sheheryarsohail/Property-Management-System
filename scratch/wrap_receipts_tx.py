import re

path = '/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/src/receipts/receipts.service.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace this.prisma with tx inside create()
# We will do a targeted replacement of the create method:
old_start = "  async create(tenantId: string, input: CreateReceiptDto) {"
assert old_start in content, "create method start not found"

# Let's inspect where create ends
parts = content.split(old_start)
pre = parts[0]
post = parts[1]

# In post, find where "return receipt;\n  }" occurs
end_marker = "    return receipt;\n  }"
assert end_marker in post, "end marker not found"
post_parts = post.split(end_marker, 1)
create_body = post_parts[0]
after_create = post_parts[1]

# Inside create_body:
# Replace this.prisma. with tx.
tx_body = create_body.replace("this.prisma.", "tx.")
# Also update checkAndGenerateInstallments to pass tx:
tx_body = tx_body.replace(
    "await this.paymentPlansService.checkAndGenerateInstallments(tenantId, propertyId);",
    "await this.paymentPlansService.checkAndGenerateInstallments(tenantId, propertyId, tx);"
)

# Indent tx_body by two extra spaces
indented_body = "\n".join("  " + line if line.strip() else line for line in tx_body.split("\n"))

new_create_method = f"""  async create(tenantId: string, input: CreateReceiptDto) {{
    return this.prisma.$transaction(async (tx) => {{{indented_body}
      return receipt;
    }});
  }}"""

final_content = pre + new_create_method + after_create

with open(path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print("SUCCESS: Successfully wrapped receipts.service.ts create() in prisma.$transaction!")
