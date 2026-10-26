import os

test_root = '/home/sheheryar-sohail/Downloads/Property-Management-System-test'

# 1. Update transfer-letter/[id]/page.tsx - REMOVE EAST OPEN
path_tl = os.path.join(test_root, 'apps/web/src/app/print/transfer-letter/[id]/page.tsx')
with open(path_tl, 'r') as f:
    c = f.read()

old_tl_east = """                <div className="flex justify-between px-3 py-1.5">
                  <span className="font-bold text-neutral-700">EAST OPEN:</span>
                  <span className="font-medium text-neutral-900">{data.isEastOpen ? 'Yes' : 'No'}</span>
                </div>"""

assert old_tl_east in c, 'old_tl_east not found in transfer-letter'
c = c.replace(old_tl_east + '\n', '')
c = c.replace(old_tl_east, '')

with open(path_tl, 'w') as f:
    f.write(c)
print('Successfully removed EAST OPEN from transfer-letter/[id]/page.tsx')

# 2. Clean transfer-form/[id]/page.tsx
path_tf = os.path.join(test_root, 'apps/web/src/app/print/transfer-form/[id]/page.tsx')
with open(path_tf, 'r') as f:
    c = f.read()

old_tf_blank = """                <div className="flex justify-between px-3 py-1 text-transparent select-none">
                  <span>&nbsp;</span>
                  <span>&nbsp;</span>
                </div>"""

if old_tf_blank in c:
    c = c.replace(old_tf_blank + '\n', '')
    c = c.replace(old_tf_blank, '')

# Also remove comment if present
c = c.replace('{/* Right Column (EAST OPEN removed) */}', '{/* Right Column */}')

with open(path_tf, 'w') as f:
    f.write(c)
print('Successfully cleaned transfer-form/[id]/page.tsx')

# 3. Clean usePrintTransfer.ts
path_upt = os.path.join(test_root, 'apps/web/src/lib/usePrintTransfer.ts')
with open(path_upt, 'r') as f:
    c = f.read()

c = c.replace('  isEastOpen?: boolean;\n', '')
c = c.replace('  isEastOpen?: boolean;', '')
c = c.replace('    isEastOpen: false,\n', '')
c = c.replace('    isEastOpen: false,', '')
c = c.replace('        isEastOpen: false,\n', '')
c = c.replace('        isEastOpen: false,', '')

with open(path_upt, 'w') as f:
    f.write(c)
print('Successfully cleaned usePrintTransfer.ts')
