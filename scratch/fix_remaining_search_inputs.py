import os

TEST_DIR = "/home/sheheryar-sohail/Downloads/Property-Management-System-test"

def update_file(rel_path, update_fn):
    full_path = os.path.join(TEST_DIR, rel_path)
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()
    new_content = update_fn(content)
    if new_content != content:
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated: {rel_path}")
    else:
        print(f"No changes: {rel_path}")

# 1. customers/page.tsx
def fix_customers(content):
    old_block = '''          <div className="relative flex-1">
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

    new_block = '''          <div className="flex items-center h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
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
    return content.replace(old_block, new_block)

update_file("apps/web/src/app/(dashboard)/customers/page.tsx", fix_customers)

# 2. users/page.tsx
def fix_users(content):
    old_block = '''        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border-slate-200 pl-8 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow border"
          />
        </div>'''

    new_block = '''        <div className="flex items-center h-10 flex-1 max-w-md rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
          <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm(\'\')}
              className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>'''
    return content.replace(old_block, new_block)

update_file("apps/web/src/app/(dashboard)/users/page.tsx", fix_users)

# 3. cancellations/page.tsx
def fix_cancellations(content):
    old_block = '''        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-2.5 top-3 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plot, customer, CNIC, phone..."
            className="w-full pl-8 pr-4 py-2 rounded-xl border bg-card text-sm text-foreground focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>'''

    new_block = '''        <div className="flex items-center h-10 flex-1 max-w-md rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
          <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plot, customer, CNIC, phone..."
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
    return content.replace(old_block, new_block)

update_file("apps/web/src/app/(dashboard)/cancellations/page.tsx", fix_cancellations)

# 4. merges/page.tsx
def fix_merges(content):
    # Search 1
    old_s1 = '''              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by client name, CNIC, or plot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-muted/30 border rounded-xl pl-8 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>'''

    new_s1 = '''              <div className="flex items-center h-10 w-full sm:w-80 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
                <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by client name, CNIC, or plot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery(\'\')}
                    className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>'''
    content = content.replace(old_s1, new_s1)

    # Search 2
    old_s2 = '''            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search history by client, plot, or voucher..."
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
                className="w-full text-xs bg-muted/30 border rounded-xl pl-8 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>'''

    new_s2 = '''            <div className="flex items-center h-10 w-full sm:w-80 rounded-xl border border-slate-200 bg-white px-3 gap-2 shadow-2xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
              <Search className="h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
              <input
                type="text"
                placeholder="Search history by client, plot, or voucher..."
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
                className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none border-none p-0"
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch(\'\')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>'''
    content = content.replace(old_s2, new_s2)
    return content

update_file("apps/web/src/app/(dashboard)/merges/page.tsx", fix_merges)
