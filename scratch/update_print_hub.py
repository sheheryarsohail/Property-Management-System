import os

path = '/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/web/src/app/print/page.tsx'
with open(path, 'r') as f:
    c = f.read()

target = """    {
      title: 'Site Plan',
      description: 'Surveyor plot plan with boundary dimension table, cardinal compass rose (N/S/E/W labels), extended corner ticks, and Managing Director signature.',
      filledUrl: `/print/site-plan/${targetId}`,
      blankUrl: '/print/site-plan/blank',
      features: ['Surveyor square with corner tics (#)', 'North/South/East/West boundary table', 'Full Cardinal Compass Rose (N, S, E, W)', 'Managing Director & Applicant signatures'],
    },
  ];"""

replacement = """    {
      title: 'Site Plan',
      description: 'Surveyor plot plan with boundary dimension table, cardinal compass rose (N/S/E/W labels), extended corner ticks, and Managing Director signature.',
      filledUrl: `/print/site-plan/${targetId}`,
      blankUrl: '/print/site-plan/blank',
      features: ['Surveyor square with corner tics (#)', 'North/South/East/West boundary table', 'Full Cardinal Compass Rose (N, S, E, W)', 'Managing Director & Applicant signatures'],
    },
    {
      title: 'Transfer Form',
      description: 'Official Plot Transfer Agreement between Buyer and Seller with complete plot specifications, terms & conditions, seller & buyer photo boxes, and leveled signatures.',
      filledUrl: `/print/transfer-form/${targetId}`,
      blankUrl: '/print/transfer-form/blank',
      features: ['Seller & Buyer photo boxes', 'Corner/West Open/Facing specs', 'Legal transfer terms & clauses', 'Seller, Buyer & MD signatures'],
    },
    {
      title: 'Transfer Letter',
      description: 'Official Allottee Application & Transfer Letter with 5 key terms & conditions, plot specs, allottee photo box, and Managing Director signature.',
      filledUrl: `/print/transfer-letter/${targetId}`,
      blankUrl: '/print/transfer-letter/blank',
      features: ['Allottee photograph box', '90-day payment & 20% cancellation terms', 'Complete plot dimension details', 'Managing Director & Allottee signatures'],
    },
  ];"""

assert target in c, "target not found"
c = c.replace(target, replacement, 1)

# Update grid to lg:grid-cols-3
c = c.replace('<div className="grid grid-cols-1 md:grid-cols-3 gap-6">', '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">')

with open(path, 'w') as f:
    f.write(c)
print("Updated print/page.tsx successfully")
