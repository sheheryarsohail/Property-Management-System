import subprocess

sql = """
SELECT r.id, r.code, r.amount, r.method, r.reference, r."chequeNumber", r."bankName", r."receivedAt", p.code as plot_code, c."fullName" as cust_name
FROM "Receipt" r
LEFT JOIN "Property" p ON r."propertyId" = p.id
LEFT JOIN "Customer" c ON r."customerId" = c.id
WHERE r.method = 'CASH' AND (
  r.reference ~* 'cheque|chq|cheaque'
  OR (r."chequeNumber" IS NOT NULL AND r."chequeNumber" != '')
)
ORDER BY r.code;
"""

cmd = ["docker", "exec", "-i", "pms_postgres", "psql", "-U", "pms", "-d", "pms_test", "-t", "-A", "-F|", "-c", sql]
res = subprocess.run(cmd, capture_output=True, text=True)
lines = [l.strip() for l in res.stdout.strip().split("\n") if l.strip()]

print(f"Total matching CASH receipts: {len(lines)}\n")
for l in lines:
    parts = l.split("|")
    rid, code, amount, method, ref, chq_num, bank, received_at, plot, cust = parts
    print(f"Code: {code:<10} | Plot: {plot:<8} | Cust: {cust:<20} | Amount: {amount:<10} | Ref: {ref}")
