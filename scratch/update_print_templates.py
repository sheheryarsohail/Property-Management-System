import os

test_root = '/home/sheheryar-sohail/Downloads/Property-Management-System-test'

# 1. Update usePrintTransfer.ts
path_use_print = os.path.join(test_root, 'apps/web/src/lib/usePrintTransfer.ts')
with open(path_use_print, 'r') as f:
    c = f.read()

# Add nominee fields to TransferPrintData interface
if 'nomineeName?: string;' not in c:
    old_interface_part = """  // Buyer / Allottee
  buyerName?: string;
  buyerFatherHusband?: string;
  buyerCnic?: string;
  buyerPhone?: string;
  buyerAddress?: string;"""

    new_interface_part = """  // Buyer / Allottee
  buyerName?: string;
  buyerFatherHusband?: string;
  buyerCnic?: string;
  buyerPhone?: string;
  buyerAddress?: string;

  // Nominee Details (for Buyer)
  nomineeName?: string;
  nomineeRelation?: string;
  nomineeCnic?: string;
  nomineeAddress?: string;"""

    assert old_interface_part in c, 'old_interface_part not found'
    c = c.replace(old_interface_part, new_interface_part)

# Add to sampleData
if "'Sameer Khan'" not in c:
    old_sample = """    buyerAddress: 'H # D-713 Block R Usman Ghani Colony North Nazimabad Karachi',"""
    new_sample = """    buyerAddress: 'H # D-713 Block R Usman Ghani Colony North Nazimabad Karachi',

    nomineeName: 'Sameer Khan',
    nomineeRelation: 'Brother',
    nomineeCnic: '42201-1234567-1',
    nomineeAddress: 'Freer Town Clifton Karachi',"""
    assert old_sample in c, 'old_sample not found'
    c = c.replace(old_sample, new_sample)

# Add to directTransfer resolution
old_direct_trans = """        buyerAddress: to.address || '',

        plotNo: p.code || '',"""

new_direct_trans = """        buyerAddress: to.address || '',

        nomineeName: to.nomineeName || '',
        nomineeRelation: to.nomineeRelation || '',
        nomineeCnic: to.nomineeNIC || to.nomineeCnic || '',
        nomineeAddress: to.nomineeAddress || '',

        plotNo: p.code || '',"""

if old_direct_trans in c:
    c = c.replace(old_direct_trans, new_direct_trans)

# Add to directProperty resolution
if old_direct_trans in c:
    c = c.replace(old_direct_trans, new_direct_trans)

with open(path_use_print, 'w') as f:
    f.write(c)
print('Updated usePrintTransfer.ts')

# 2. Update transfer-form/[id]/page.tsx
path_tf = os.path.join(test_root, 'apps/web/src/app/print/transfer-form/[id]/page.tsx')
with open(path_tf, 'r') as f:
    c = f.read()

# Update Seller Details: make font bold and a bit bigger
old_seller_details = """              {/* Fields */}
              <div className="flex-1 divide-y divide-neutral-200 text-[11px]">
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">NAME:</span>
                  <span className="font-medium text-neutral-900">{data.sellerName || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">S/O, D/O, W/O:</span>
                  <span className="font-medium text-neutral-900">{data.sellerFatherHusband || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">CNIC:</span>
                  <span className="font-mono font-medium text-neutral-900">{data.sellerCnic || '—'}</span>
                  <span className="ml-auto font-bold text-neutral-700 shrink-0 mr-2">MOBILE NO:</span>
                  <span className="font-mono font-medium text-neutral-900">{data.sellerPhone || '—'}</span>
                </div>
                <div className="flex items-start px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">ADDRESS:</span>
                  <span className="font-medium text-neutral-900 leading-tight">{data.sellerAddress || '—'}</span>
                </div>
              </div>"""

new_seller_details = """              {/* Fields */}
              <div className="flex-1 divide-y divide-neutral-200 text-[11px]">
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">NAME:</span>
                  <span className="font-bold text-[13px] text-neutral-950 tracking-wide">{data.sellerName || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">S/O, D/O, W/O:</span>
                  <span className="font-bold text-[12px] text-neutral-950">{data.sellerFatherHusband || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">CNIC:</span>
                  <span className="font-mono font-bold text-[12px] text-neutral-950">{data.sellerCnic || '—'}</span>
                  <span className="ml-auto font-bold text-neutral-700 shrink-0 mr-2">MOBILE NO:</span>
                  <span className="font-mono font-bold text-[12px] text-neutral-950">{data.sellerPhone || '—'}</span>
                </div>
                <div className="flex items-start px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">ADDRESS:</span>
                  <span className="font-bold text-[11.5px] text-neutral-950 leading-tight">{data.sellerAddress || '—'}</span>
                </div>
              </div>"""

assert old_seller_details in c, 'old_seller_details not found'
c = c.replace(old_seller_details, new_seller_details)

# Update Plot Details: remove EAST OPEN and make values bold
old_plot_details = """            <div className="grid grid-cols-2 divide-x divide-neutral-800 text-[11px]">
              {/* Left Column */}
              <div className="divide-y divide-neutral-200">
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">PLOT NO:</span>
                  <span className="font-bold text-neutral-900">{data.plotNo || '—'}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">CATEGORY:</span>
                  <span className="font-semibold text-neutral-900">{data.category || 'RESIDENTIAL'}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">WEST OPEN:</span>
                  <span className="font-medium text-neutral-900">{data.isWestOpen ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">PARK FACING:</span>
                  <span className="font-medium text-neutral-900">{data.isParkFacing ? 'Yes' : 'No'}</span>
                </div>
              </div>
              {/* Right Column */}
              <div className="divide-y divide-neutral-200">
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">MEASURING:</span>
                  <span className="font-bold text-neutral-900">{data.measuring ? `${data.measuring} Sq. Yds.` : '—'}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">CORNER:</span>
                  <span className="font-medium text-neutral-900">{data.isCorner ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">EAST OPEN:</span>
                  <span className="font-medium text-neutral-900">{data.isEastOpen ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">ROAD FACING:</span>
                  <span className="font-medium text-neutral-900">{data.isRoadFacing ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>"""

new_plot_details = """            <div className="grid grid-cols-2 divide-x divide-neutral-800 text-[11px]">
              {/* Left Column */}
              <div className="divide-y divide-neutral-200">
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">PLOT NO:</span>
                  <span className="font-bold text-[12px] text-neutral-950">{data.plotNo || '—'}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">CATEGORY:</span>
                  <span className="font-bold text-[11.5px] text-neutral-950">{data.category || 'RESIDENTIAL'}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">WEST OPEN:</span>
                  <span className="font-bold text-[11.5px] text-neutral-950">{data.isWestOpen ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">PARK FACING:</span>
                  <span className="font-bold text-[11.5px] text-neutral-950">{data.isParkFacing ? 'Yes' : 'No'}</span>
                </div>
              </div>
              {/* Right Column (EAST OPEN removed) */}
              <div className="divide-y divide-neutral-200">
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">MEASURING:</span>
                  <span className="font-bold text-[12px] text-neutral-950">{data.measuring ? `${data.measuring} Sq. Yds.` : '—'}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">CORNER:</span>
                  <span className="font-bold text-[11.5px] text-neutral-950">{data.isCorner ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between px-3 py-1">
                  <span className="font-bold text-neutral-700">ROAD FACING:</span>
                  <span className="font-bold text-[11.5px] text-neutral-950">{data.isRoadFacing ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between px-3 py-1 text-transparent select-none">
                  <span>&nbsp;</span>
                  <span>&nbsp;</span>
                </div>
              </div>
            </div>"""

assert old_plot_details in c, 'old_plot_details not found'
c = c.replace(old_plot_details, new_plot_details)

# Update Buyer Details: add Nominee details, make font bold and slightly bigger
old_buyer_details = """              {/* Fields */}
              <div className="flex-1 divide-y divide-neutral-200 text-[11px]">
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">NAME:</span>
                  <span className="font-medium text-neutral-900">{data.buyerName || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">S/O, D/O, W/O:</span>
                  <span className="font-medium text-neutral-900">{data.buyerFatherHusband || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">CNIC:</span>
                  <span className="font-mono font-medium text-neutral-900">{data.buyerCnic || '—'}</span>
                  <span className="ml-auto font-bold text-neutral-700 shrink-0 mr-2">MOBILE NO:</span>
                  <span className="font-mono font-medium text-neutral-900">{data.buyerPhone || '—'}</span>
                </div>
                <div className="flex items-start px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">ADDRESS:</span>
                  <span className="font-medium text-neutral-900 leading-tight">{data.buyerAddress || '—'}</span>
                </div>
              </div>"""

new_buyer_details = """              {/* Fields */}
              <div className="flex-1 divide-y divide-neutral-200 text-[11px]">
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">NAME:</span>
                  <span className="font-bold text-[13px] text-neutral-950 tracking-wide">{data.buyerName || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">S/O, D/O, W/O:</span>
                  <span className="font-bold text-[12px] text-neutral-950">{data.buyerFatherHusband || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">CNIC:</span>
                  <span className="font-mono font-bold text-[12px] text-neutral-950">{data.buyerCnic || '—'}</span>
                  <span className="ml-auto font-bold text-neutral-700 shrink-0 mr-2">MOBILE NO:</span>
                  <span className="font-mono font-bold text-[12px] text-neutral-950">{data.buyerPhone || '—'}</span>
                </div>
                <div className="flex items-start px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">ADDRESS:</span>
                  <span className="font-bold text-[11.5px] text-neutral-950 leading-tight">{data.buyerAddress || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">NOMINEE:</span>
                  <span className="font-bold text-[12px] text-neutral-950">{data.nomineeName || '—'}</span>
                  <span className="ml-4 font-bold text-neutral-700 shrink-0 mr-1.5">RELATION:</span>
                  <span className="font-bold text-[11.5px] text-neutral-950">{data.nomineeRelation || '—'}</span>
                  <span className="ml-auto font-bold text-neutral-700 shrink-0 mr-2">NOMINEE CNIC:</span>
                  <span className="font-mono font-bold text-[12px] text-neutral-950">{data.nomineeCnic || '—'}</span>
                </div>
              </div>"""

assert old_buyer_details in c, 'old_buyer_details not found'
c = c.replace(old_buyer_details, new_buyer_details)

# Update Terms paragraph
old_terms = """                <span className="font-bold underline">{data.buyerName || '____________________'}</span> agrees to purchase and the seller, identified as{' '}
                <span className="font-bold underline">{data.sellerName || '____________________'}</span>"""
new_terms = """                <span className="font-bold underline text-[11.5px] text-neutral-950">{data.buyerName || '____________________'}</span> agrees to purchase and the seller, identified as{' '}
                <span className="font-bold underline text-[11.5px] text-neutral-950">{data.sellerName || '____________________'}</span>"""
if old_terms in c:
    c = c.replace(old_terms, new_terms)

with open(path_tf, 'w') as f:
    f.write(c)
print('Updated transfer-form/[id]/page.tsx')

# 3. Update transfer-letter/[id]/page.tsx
path_tl = os.path.join(test_root, 'apps/web/src/app/print/transfer-letter/[id]/page.tsx')
with open(path_tl, 'r') as f:
    c = f.read()

old_tl_allottee = """              {/* Fields */}
              <div className="flex-1 divide-y divide-neutral-200 text-[11px]">
                <div className="flex items-center px-3 py-1.5">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">NAME:</span>
                  <span className="font-medium text-neutral-900">{data.buyerName || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1.5">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">S/O, D/O, W/O:</span>
                  <span className="font-medium text-neutral-900">{data.buyerFatherHusband || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1.5">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">CNIC:</span>
                  <span className="font-mono font-medium text-neutral-900">{data.buyerCnic || '—'}</span>
                  <span className="ml-auto font-bold text-neutral-700 shrink-0 mr-2">MOBILE NO:</span>
                  <span className="font-mono font-medium text-neutral-900">{data.buyerPhone || '—'}</span>
                </div>
                <div className="flex items-start px-3 py-1.5">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">ADDRESS:</span>
                  <span className="font-medium text-neutral-900 leading-tight">{data.buyerAddress || '—'}</span>
                </div>
              </div>"""

new_tl_allottee = """              {/* Fields */}
              <div className="flex-1 divide-y divide-neutral-200 text-[11px]">
                <div className="flex items-center px-3 py-1.5">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">NAME:</span>
                  <span className="font-bold text-[13px] text-neutral-950 tracking-wide">{data.buyerName || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1.5">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">S/O, D/O, W/O:</span>
                  <span className="font-bold text-[12px] text-neutral-950">{data.buyerFatherHusband || '—'}</span>
                </div>
                <div className="flex items-center px-3 py-1.5">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">CNIC:</span>
                  <span className="font-mono font-bold text-[12px] text-neutral-950">{data.buyerCnic || '—'}</span>
                  <span className="ml-auto font-bold text-neutral-700 shrink-0 mr-2">MOBILE NO:</span>
                  <span className="font-mono font-bold text-[12px] text-neutral-950">{data.buyerPhone || '—'}</span>
                </div>
                <div className="flex items-start px-3 py-1.5">
                  <span className="w-28 font-bold text-neutral-700 shrink-0">ADDRESS:</span>
                  <span className="font-bold text-[11.5px] text-neutral-950 leading-tight">{data.buyerAddress || '—'}</span>
                </div>
              </div>"""

assert old_tl_allottee in c, 'old_tl_allottee not found'
c = c.replace(old_tl_allottee, new_tl_allottee)

# Also bold the plot details in transfer letter
c = c.replace('<span className="font-bold text-neutral-900">{data.plotNo || \'—\'}</span>',
              '<span className="font-bold text-[12px] text-neutral-950">{data.plotNo || \'—\'}</span>')
c = c.replace('<span className="font-bold text-neutral-900">{data.measuring ? `${data.measuring} Sq. Yds.` : \'—\'}</span>',
              '<span className="font-bold text-[12px] text-neutral-950">{data.measuring ? `${data.measuring} Sq. Yds.` : \'—\'}</span>')
c = c.replace('<span className="font-semibold text-neutral-900">{data.category || \'RESIDENTIAL\'}</span>',
              '<span className="font-bold text-[11.5px] text-neutral-950">{data.category || \'RESIDENTIAL\'}</span>')
c = c.replace('<span className="font-medium text-neutral-900">{data.isCorner ? \'Yes\' : \'No\'}</span>',
              '<span className="font-bold text-[11.5px] text-neutral-950">{data.isCorner ? \'Yes\' : \'No\'}</span>')
c = c.replace('<span className="font-medium text-neutral-900">{data.isWestOpen ? \'Yes\' : \'No\'}</span>',
              '<span className="font-bold text-[11.5px] text-neutral-950">{data.isWestOpen ? \'Yes\' : \'No\'}</span>')
c = c.replace('<span className="font-medium text-neutral-900">{data.isParkFacing ? \'Yes\' : \'No\'}</span>',
              '<span className="font-bold text-[11.5px] text-neutral-950">{data.isParkFacing ? \'Yes\' : \'No\'}</span>')
c = c.replace('<span className="font-medium text-neutral-900">{data.isRoadFacing ? \'Yes\' : \'No\'}</span>',
              '<span className="font-bold text-[11.5px] text-neutral-950">{data.isRoadFacing ? \'Yes\' : \'No\'}</span>')

with open(path_tl, 'w') as f:
    f.write(c)
print('Updated transfer-letter/[id]/page.tsx')

# 4. Update allocation-letter/[id]/page.tsx
path_al = os.path.join(test_root, 'apps/web/src/app/print/allocation-letter/[id]/page.tsx')
with open(path_al, 'r') as f:
    c = f.read()

old_al_name = """            {/* Name Line */}
            <div className="flex items-end text-sm pt-2">
              <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Mr. / Mrs. / Miss.</span>
              <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[24px] text-center">
                {activeData.applicantName}
              </div>
            </div>

            {/* Relation Line */}
            <div className="flex items-end text-sm pt-2">
              <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">S/o. W/o. D/o.</span>
              <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[24px] text-center">
                {activeData.relationName}
              </div>
            </div>"""

new_al_name = """            {/* Name Line */}
            <div className="flex items-end text-sm pt-2">
              <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Mr. / Mrs. / Miss.</span>
              <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-base min-h-[24px] text-center text-neutral-950 tracking-wide">
                {activeData.applicantName}
              </div>
            </div>

            {/* Relation Line */}
            <div className="flex items-end text-sm pt-2">
              <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">S/o. W/o. D/o.</span>
              <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-base min-h-[24px] text-center text-neutral-950">
                {activeData.relationName}
              </div>
            </div>"""

assert old_al_name in c, 'old_al_name not found'
c = c.replace(old_al_name, new_al_name)

# In signature column of allottee:
old_al_sig = """            <div className="flex items-end text-sm">
              <span className="font-bold text-neutral-800 mr-2 whitespace-nowrap">Mr. / Mrs. / Miss.</span>
              <div className="flex-1 border-b border-neutral-800 px-2 min-h-[20px] text-center">
                {activeData.applicantName}
              </div>
            </div>

            <div className="flex items-end text-sm">
              <span className="font-bold text-neutral-800 mr-2 whitespace-nowrap">S/o. W/o. D/o.</span>
              <div className="flex-1 border-b border-neutral-800 px-2 min-h-[20px] text-center">
                {activeData.relationName}
              </div>
            </div>"""

new_al_sig = """            <div className="flex items-end text-sm">
              <span className="font-bold text-neutral-800 mr-2 whitespace-nowrap">Mr. / Mrs. / Miss.</span>
              <div className="flex-1 border-b border-neutral-800 px-2 min-h-[20px] text-center font-bold text-sm text-neutral-950">
                {activeData.applicantName}
              </div>
            </div>

            <div className="flex items-end text-sm">
              <span className="font-bold text-neutral-800 mr-2 whitespace-nowrap">S/o. W/o. D/o.</span>
              <div className="flex-1 border-b border-neutral-800 px-2 min-h-[20px] text-center font-bold text-sm text-neutral-950">
                {activeData.relationName}
              </div>
            </div>"""

assert old_al_sig in c, 'old_al_sig not found'
c = c.replace(old_al_sig, new_al_sig)

with open(path_al, 'w') as f:
    f.write(c)
print('Updated allocation-letter/[id]/page.tsx')

# 5. Update application-form/[id]/page.tsx
path_app = os.path.join(test_root, 'apps/web/src/app/print/application-form/[id]/page.tsx')
with open(path_app, 'r') as f:
    c = f.read()

# Make applicant and nominee fields bold and clear
c = c.replace("""              {/* Field: Name */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Name of Applicant.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[22px] text-center">
                  {activeData.applicantName}
                </div>
              </div>""",
              """              {/* Field: Name */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Name of Applicant.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-base min-h-[22px] text-center text-neutral-950 tracking-wide">
                  {activeData.applicantName}
                </div>
              </div>""")

c = c.replace("""              {/* Field: Father's / Husband Name */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Father's / Husband's Name.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[22px] text-center">
                  {activeData.fatherHusbandName}
                </div>
              </div>""",
              """              {/* Field: Father's / Husband Name */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Father's / Husband's Name.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-base min-h-[22px] text-center text-neutral-950">
                  {activeData.fatherHusbandName}
                </div>
              </div>""")

c = c.replace("""              {/* Field: N.I.C. No */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">N.I.C. No.:</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[22px] text-center">
                  {activeData.cnic}
                </div>
              </div>""",
              """              {/* Field: N.I.C. No */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">N.I.C. No.:</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-mono font-bold text-base min-h-[22px] text-center text-neutral-950">
                  {activeData.cnic}
                </div>
              </div>""")

c = c.replace("""              {/* Field: Address line 1 */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Address.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[22px] text-center">
                  {activeData.addressLine1}
                </div>
              </div>""",
              """              {/* Field: Address line 1 */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Address.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-sm min-h-[22px] text-center text-neutral-950">
                  {activeData.addressLine1}
                </div>
              </div>""")

c = c.replace("""              {/* Field: Address line 2 */}
              <div className="flex items-end text-sm">
                <div className="w-full border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[22px] text-center">
                  {activeData.addressLine2}
                </div>
              </div>""",
              """              {/* Field: Address line 2 */}
              <div className="flex items-end text-sm">
                <div className="w-full border-b-2 border-dotted border-neutral-400 px-2 font-bold text-sm min-h-[22px] text-center text-neutral-950">
                  {activeData.addressLine2}
                </div>
              </div>""")

c = c.replace("""              {/* Field: Ph & Cell */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-end">
                  <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Ph.</span>
                  <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[22px] text-center">
                    {activeData.phone}
                  </div>
                </div>
                <div className="flex items-end">
                  <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Cell.</span>
                  <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[22px] text-center">
                    {activeData.cell}
                  </div>
                </div>
              </div>""",
              """              {/* Field: Ph & Cell */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-end">
                  <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Ph.</span>
                  <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-mono font-bold text-sm min-h-[22px] text-center text-neutral-950">
                    {activeData.phone}
                  </div>
                </div>
                <div className="flex items-end">
                  <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Cell.</span>
                  <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-mono font-bold text-sm min-h-[22px] text-center text-neutral-950">
                    {activeData.cell}
                  </div>
                </div>
              </div>""")

c = c.replace("""              {/* Field: Nominee */}
              <div className="flex items-end text-sm pt-0.5">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Nominee.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[22px] text-center">
                  {activeData.nomineeName}
                </div>
              </div>""",
              """              {/* Field: Nominee */}
              <div className="flex items-end text-sm pt-0.5">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Nominee.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-base min-h-[22px] text-center text-neutral-950">
                  {activeData.nomineeName}
                </div>
              </div>""")

c = c.replace("""              {/* Field: Nominee N.I.C. */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">N.I.C. No.:</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[22px] text-center">
                  {activeData.nomineeCnic}
                </div>
              </div>""",
              """              {/* Field: Nominee N.I.C. */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">N.I.C. No.:</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-mono font-bold text-base min-h-[22px] text-center text-neutral-950">
                  {activeData.nomineeCnic}
                </div>
              </div>""")

c = c.replace("""              {/* Field: Relation */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Relation.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[22px] text-center">
                  {activeData.nomineeRelation}
                </div>
              </div>""",
              """              {/* Field: Relation */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Relation.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-sm min-h-[22px] text-center text-neutral-950">
                  {activeData.nomineeRelation}
                </div>
              </div>""")

c = c.replace("""              {/* Field: Nominee Address */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Address.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[22px] text-center">
                  {activeData.nomineeAddress}
                </div>
              </div>""",
              """              {/* Field: Nominee Address */}
              <div className="flex items-end text-sm">
                <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Address.</span>
                <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-sm min-h-[22px] text-center text-neutral-950">
                  {activeData.nomineeAddress}
                </div>
              </div>""")

with open(path_app, 'w') as f:
    f.write(c)
print('Updated application-form/[id]/page.tsx')

# 6. Update site-plan/[id]/page.tsx
path_sp = os.path.join(test_root, 'apps/web/src/app/print/site-plan/[id]/page.tsx')
with open(path_sp, 'r') as f:
    c = f.read()

c = c.replace("""              <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Name Mr. /Miss /Mrs.:</span>
              <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-medium min-h-[22px] text-center">
                {activeData.applicantName}
              </div>""",
              """              <span className="font-bold text-neutral-800 whitespace-nowrap mr-2">Name Mr. /Miss /Mrs.:</span>
              <div className="flex-1 border-b-2 border-dotted border-neutral-400 px-2 font-bold text-base min-h-[22px] text-center text-neutral-950 tracking-wide">
                {activeData.applicantName}
              </div>""")

with open(path_sp, 'w') as f:
    f.write(c)
print('Updated site-plan/[id]/page.tsx')

print('All templates successfully updated!')
