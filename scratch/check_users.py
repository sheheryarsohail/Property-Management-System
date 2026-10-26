import psycopg2

conn = psycopg2.connect("postgresql://pms:pms@127.0.0.1:5432/pms_test?schema=public")
cur = conn.cursor()
cur.execute('SELECT id, email, name, role FROM "User"')
rows = cur.fetchall()
print("Users in pms_test:")
for r in rows:
    print(r)
cur.close()
conn.close()
