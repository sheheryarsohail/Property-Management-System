import os

path = '/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/web/src/app/print/page.tsx'
with open(path, 'r') as f:
    c = f.read()

target = "description: 'Official Allottee Application & Transfer Letter with 5 key terms & conditions, plot specs, allottee photo box, and Managing Director signature.'"
replacement = "description: 'Official Transfer Letter for allottee with 5 key terms & conditions, plot specs, allottee photo box, and Managing Director signature.'"

assert target in c, "target not found"
c = c.replace(target, replacement, 1)

with open(path, 'w') as f:
    f.write(c)
print("Updated print/page.tsx")
