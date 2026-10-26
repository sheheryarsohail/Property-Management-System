import os
import re

TEST_DIR = "/home/sheheryar-sohail/Downloads/Property-Management-System-test"

def update_file(rel_path, update_fn):
    full_path = os.path.join(TEST_DIR, rel_path)
    if not os.path.exists(full_path):
        print(f"File not found: {full_path}")
        return False
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()
    new_content = update_fn(content)
    if new_content != content:
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated: {rel_path}")
        return True
    else:
        print(f"No changes needed: {rel_path}")
        return False

# 1. FilterDrawer.tsx
def fix_filter_drawer(content):
    # Ensure portal container has !m-0 !p-0 and starts top-0 left-0
    old_portal = '<div className="fixed inset-0 top-0 left-0 right-0 bottom-0 m-0 p-0 z-[100] flex justify-start">'
    new_portal = '<div className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 !p-0 z-[100] flex justify-start">'
    content = content.replace(old_portal, new_portal)
    
    # Ensure drawer panel has !m-0 !p-0 and h-full
    panel_pattern = r'<div className="relative z-\[101\] flex h-screen w-full sm:max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-250 ease-out border-r border-slate-200">'
    new_panel = '<div className="relative z-[101] flex h-full w-full sm:max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-250 ease-out border-r border-slate-200 !m-0 !p-0">'
    content = re.sub(panel_pattern, new_panel, content)

    # In case previous class was different
    old_panel_alt = '<div className="relative z-[101] flex h-screen w-full sm:max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-250 ease-out border-r border-slate-200 !m-0 !p-0">'
    content = content.replace(old_panel_alt, new_panel)
    return content

update_file("apps/web/src/components/FilterDrawer.tsx", fix_filter_drawer)

# 2. receipts/page.tsx
def fix_receipts_page(content):
    # Search bar replacement
    old_search = '''            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search receipts, customer, plot..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-8 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch(\'\')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>'''

    new_search = '''            {/* Search Input */}
            <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
              <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
              <input
                type="text"
                placeholder="Search receipts, customer, plot..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch(\'\')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>'''
    content = content.replace(old_search, new_search)

    # FilterDrawer options: replace translucent bg-slate-50/50 with crisp solid white
    content = content.replace(
        'border-slate-200/90 bg-slate-50/50 text-slate-700 hover:bg-slate-100/70 hover:border-slate-300',
        'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
    )
    return content

update_file("apps/web/src/app/(dashboard)/receipts/page.tsx", fix_receipts_page)

# 3. customers/page.tsx
def fix_customers_page(content):
    old_search = '''          {/* Search Bar & Add Button in ONE responsive row */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search customers by name, phone, CNIC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-8 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch(\'\')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>'''

    new_search = '''          {/* Search Bar & Add Button in ONE responsive row */}
          <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
            <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
            <input
              type="text"
              placeholder="Search customers by name, phone, CNIC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch(\'\')}
                className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>'''
    return content.replace(old_search, new_search)

update_file("apps/web/src/app/(dashboard)/customers/page.tsx", fix_customers_page)

# 4. properties/page.tsx
def fix_properties_page(content):
    old_search = '''            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search properties by code, block, phase..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-8 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch(\'\')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>'''

    new_search = '''            {/* Search Input */}
            <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
              <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
              <input
                type="text"
                placeholder="Search properties by code, block, phase..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch(\'\')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>'''
    return content.replace(old_search, new_search)

update_file("apps/web/src/app/(dashboard)/properties/page.tsx", fix_properties_page)

# 5. invoices/page.tsx
def fix_invoices_page(content):
    old_search = '''            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search installments, customer, plot..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-8 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch(\'\')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>'''

    new_search = '''            {/* Search Input */}
            <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
              <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
              <input
                type="text"
                placeholder="Search installments, customer, plot..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch(\'\')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>'''
    return content.replace(old_search, new_search)

update_file("apps/web/src/app/(dashboard)/invoices/page.tsx", fix_invoices_page)

# 6. transfers/page.tsx
def fix_transfers_page(content):
    old_search = '''            {/* Search Input with clean placeholder padding */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search transfers by plot, buyer, seller..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-8 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch(\'\')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>'''

    new_search = '''            {/* Search Input with clean placeholder padding */}
            <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
              <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
              <input
                type="text"
                placeholder="Search transfers by plot, buyer, seller..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch(\'\')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>'''
    return content.replace(old_search, new_search)

update_file("apps/web/src/app/(dashboard)/transfers/page.tsx", fix_transfers_page)

# 7. pdc/page.tsx
def fix_pdc_page(content):
    old_search = '''            {/* Search Input with snug placeholder spacing */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search PDCs by cheque no, customer, bank..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-8 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch(\'\')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>'''

    new_search = '''            {/* Search Input with snug placeholder spacing */}
            <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
              <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
              <input
                type="text"
                placeholder="Search PDCs by cheque no, customer, bank..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch(\'\')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>'''
    return content.replace(old_search, new_search)

update_file("apps/web/src/app/(dashboard)/pdc/page.tsx", fix_pdc_page)

# 8. expenses/page.tsx
def fix_expenses_page(content):
    old_search = '''            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search expenses by payee, description, invoice..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-8 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch(\'\')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>'''

    new_search = '''            {/* Search Input */}
            <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
              <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
              <input
                type="text"
                placeholder="Search expenses by payee, description, invoice..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch(\'\')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>'''
    return content.replace(old_search, new_search)

update_file("apps/web/src/app/(dashboard)/expenses/page.tsx", fix_expenses_page)

# 9. payment-plans/page.tsx
def fix_payment_plans_page(content):
    old_search = '''          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search payment plans by name, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-8 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch(\'\')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>'''

    new_search = '''          <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
            <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
            <input
              type="text"
              placeholder="Search payment plans by name, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch(\'\')}
                className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>'''
    return content.replace(old_search, new_search)

update_file("apps/web/src/app/(dashboard)/payment-plans/page.tsx", fix_payment_plans_page)

# 10. users/page.tsx
def fix_users_page(content):
    old_search = '''        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>'''
    new_search = '''        <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
          <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch(\'\')}
              className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>'''
    return content.replace(old_search, new_search)

update_file("apps/web/src/app/(dashboard)/users/page.tsx", fix_users_page)

# 11. cancellations/page.tsx
def fix_cancellations_page(content):
    # Tab 1 search
    old_s1 = '''                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search plot code, customer..."
                    value={searchAllotted}
                    onChange={(e) => setSearchAllotted(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition"
                  />
                </div>'''
    new_s1 = '''                <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
                  <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search plot code, customer..."
                    value={searchAllotted}
                    onChange={(e) => setSearchAllotted(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
                  />
                  {searchAllotted && (
                    <button
                      type="button"
                      onClick={() => setSearchAllotted(\'\')}
                      className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>'''
    content = content.replace(old_s1, new_s1)

    # Tab 2 search
    old_s2 = '''          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search plot, customer, CNIC, phone..."
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition"
            />
          </div>'''
    new_s2 = '''          <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
            <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
            <input
              type="text"
              placeholder="Search plot, customer, CNIC, phone..."
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
            />
            {searchHistory && (
              <button
                type="button"
                onClick={() => setSearchHistory(\'\')}
                className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>'''
    content = content.replace(old_s2, new_s2)
    return content

update_file("apps/web/src/app/(dashboard)/cancellations/page.tsx", fix_cancellations_page)

# 12. development-charges/page.tsx
def fix_dev_charges_page(content):
    # Search input
    old_search = '''                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search plot code, owner..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition"
                  />
                </div>'''
    new_search = '''                <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
                  <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search plot code, owner..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch(\'\')}
                      className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>'''
    content = content.replace(old_search, new_search)

    # Modal styling: remove backdrop-blur, make solid off-white card
    old_modal = '''      {/* MODAL: Set / Edit Development Charges for a Property */}
      {isModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-6">'''
    new_modal = '''      {/* MODAL: Set / Edit Development Charges for a Property */}
      {isModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-[#fafafa] p-6 shadow-2xl space-y-6">'''
    content = content.replace(old_modal, new_modal)
    return content

update_file("apps/web/src/app/(dashboard)/development-charges/page.tsx", fix_dev_charges_page)

# 13. merges/page.tsx
def fix_merges_page(content):
    # Step 1 search
    old_s1 = '''                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by client name, CNIC, or plot..."
                    value={searchClient}
                    onChange={(e) => setSearchClient(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition"
                  />
                </div>'''
    new_s1 = '''                <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
                  <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by client name, CNIC, or plot..."
                    value={searchClient}
                    onChange={(e) => setSearchClient(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
                  />
                  {searchClient && (
                    <button
                      type="button"
                      onClick={() => setSearchClient(\'\')}
                      className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>'''
    content = content.replace(old_s1, new_s1)

    # History search
    old_s2 = '''              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search history by client, plot, or voucher..."
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition"
                />
              </div>'''
    new_s2 = '''              <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
                <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search history by client, plot, or voucher..."
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
                />
                {searchHistory && (
                  <button
                    type="button"
                    onClick={() => setSearchHistory(\'\')}
                    className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>'''
    content = content.replace(old_s2, new_s2)
    return content

update_file("apps/web/src/app/(dashboard)/merges/page.tsx", fix_merges_page)

# 14. CancellationModal.tsx
def fix_cancellation_modal(content):
    content = content.replace(
        '<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">',
        '<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto animate-in fade-in duration-200">'
    )
    content = content.replace(
        '<div className="w-full max-w-2xl bg-card rounded-2xl border shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">',
        '<div className="w-full max-w-2xl bg-[#fafafa] rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">'
    )
    content = content.replace(
        '<div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">',
        '<div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">'
    )
    return content

update_file("apps/web/src/app/(dashboard)/cancellations/CancellationModal.tsx", fix_cancellation_modal)

# 15. CancellationSuccessDialog.tsx
def fix_cancellation_success_dialog(content):
    content = content.replace(
        '<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">',
        '<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-200">'
    )
    content = content.replace(
        '<div className="w-full max-w-lg bg-card rounded-2xl border shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">',
        '<div className="w-full max-w-lg bg-[#fafafa] rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">'
    )
    return content

update_file("apps/web/src/app/(dashboard)/cancellations/CancellationSuccessDialog.tsx", fix_cancellation_success_dialog)

# 16. MergeSuccessDialog.tsx
def fix_merge_success_dialog(content):
    content = content.replace(
        '<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">',
        '<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-200">'
    )
    content = content.replace(
        '<div className="w-full max-w-lg bg-card rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">',
        '<div className="w-full max-w-lg bg-[#fafafa] rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">'
    )
    return content

update_file("apps/web/src/app/(dashboard)/merges/MergeSuccessDialog.tsx", fix_merge_success_dialog)

# 17. users/user-dialog.tsx
def fix_user_dialog(content):
    content = content.replace(
        '<Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" />',
        '<Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 animate-fade-in" />'
    )
    content = content.replace(
        '<Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">',
        '<Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-[#fafafa] border border-slate-200 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">'
    )
    return content

update_file("apps/web/src/app/(dashboard)/users/user-dialog.tsx", fix_user_dialog)

# 18. properties/[id]/page.tsx
def fix_property_detail_modal(content):
    content = content.replace(
        '<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">',
        '<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">'
    )
    content = content.replace(
        '<div className="w-full max-w-md rounded-2xl bg-white/90 p-6 shadow-xl backdrop-blur-md border border-white/20">',
        '<div className="w-full max-w-md rounded-2xl bg-[#fafafa] border border-slate-200 p-6 shadow-2xl">'
    )
    return content

update_file("apps/web/src/app/(dashboard)/properties/[id]/page.tsx", fix_property_detail_modal)

# 19. receipts/new/page.tsx
def fix_receipts_new_modal(content):
    content = content.replace(
        '<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">',
        '<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-200">'
    )
    content = content.replace(
        '<div className="mx-4 w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl space-y-4">',
        '<div className="mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-[#fafafa] p-6 shadow-2xl space-y-4">'
    )
    return content

update_file("apps/web/src/app/(dashboard)/receipts/new/page.tsx", fix_receipts_new_modal)

# 20. invoices/new/page.tsx
def fix_invoices_new_modal(content):
    content = content.replace(
        '<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">',
        '<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-200">'
    )
    content = content.replace(
        '<div className="mx-4 w-full max-w-md rounded-2xl border border-white/20 bg-white/90 p-6 shadow-2xl backdrop-blur-xl">',
        '<div className="mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-[#fafafa] p-6 shadow-2xl">'
    )
    return content

update_file("apps/web/src/app/(dashboard)/invoices/new/page.tsx", fix_invoices_new_modal)

# 21. header.tsx quick search modal
def fix_header_modal(content):
    content = content.replace(
        '<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm animate-fade-in">',
        '<div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 animate-fade-in">'
    )
    content = content.replace(
        '<div className="mx-4 mt-16 w-full max-w-lg rounded-2xl border border-white/20 bg-white/95 p-5 shadow-2xl backdrop-blur sm:mt-24 sm:rounded-3xl sm:p-6">',
        '<div className="mx-4 mt-16 w-full max-w-lg rounded-2xl border border-slate-200 bg-[#fafafa] p-5 shadow-2xl sm:mt-24 sm:rounded-3xl sm:p-6">'
    )
    return content

update_file("apps/web/src/components/layout/header.tsx", fix_header_modal)

print("All updates processed.")
