import os

env_path = "/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/.env"

with open(env_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.startswith("SMTP_PASS="):
        new_lines.append('SMTP_PASS="rzfo vdjr bazz pgua"\n')
    else:
        new_lines.append(line)

with open(env_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Updated SMTP_PASS in apps/api/.env with working app password")
