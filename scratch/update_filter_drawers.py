import os

test_base = '/home/sheheryar-sohail/Downloads/Property-Management-System-test'
main_base = '/home/sheheryar-sohail/Downloads/Property-Management-System-main'

# 1. Properties
props_file = os.path.join(test_base, 'apps/web/src/app/(dashboard)/properties/page.tsx')
with open(props_file, 'r', encoding='utf-8') as f:
    content = f.read()

target_props = '''        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          title="Filter Properties"
          activeCount={statusFilter !== 'all' ? 1 : 0}
          onReset={() => setStatusFilter('all')}
          onApply={() => setIsFilterDrawerOpen(false)}
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Property Status
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'all', label: 'All Properties', desc: 'Show all available, reserved, and sold plots' },
                { value: 'AVAILABLE', label: 'Available', desc: 'Ready for new bookings and assignment' },
                { value: 'RESERVED', label: 'Reserved', desc: 'Temporarily blocked or pending confirmation' },
                { value: 'SOLD', label: 'Sold', desc: 'Fully allocated with active payment plans' },
                { value: 'CANCELLED', label: 'Cancelled', desc: 'Surrendered or cancelled plots' },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatusFilter(s.value)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 text-left transition",
                    statusFilter === s.value
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-slate-900">{s.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{s.desc}</div>
                  </div>
                  {statusFilter === s.value && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </FilterDrawer>'''

replacement_props = '''        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          title="Filter"
          activeCount={statusFilter !== 'all' ? 1 : 0}
          onReset={() => setStatusFilter('all')}
          onApply={() => setIsFilterDrawerOpen(false)}
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Property Status
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'all', label: 'All Properties' },
                { value: 'AVAILABLE', label: 'Available' },
                { value: 'RESERVED', label: 'Reserved' },
                { value: 'SOLD', label: 'Sold' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatusFilter(s.value)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3.5 py-3 text-left transition",
                    statusFilter === s.value
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary font-semibold"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="text-xs sm:text-sm text-slate-900">{s.label}</span>
                  {statusFilter === s.value && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </FilterDrawer>'''

if target_props in content:
    content = content.replace(target_props, replacement_props)
    with open(props_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated properties/page.tsx")
else:
    print("WARNING: target_props not found!")

# 2. Transfers
transfers_file = os.path.join(test_base, 'apps/web/src/app/(dashboard)/transfers/page.tsx')
with open(transfers_file, 'r', encoding='utf-8') as f:
    content = f.read()

target_transfers = '''        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          title="Filter Transfers"
          activeCount={statusFilter !== 'all' ? 1 : 0}
          onReset={() => setStatusFilter('all')}
          onApply={() => setIsFilterDrawerOpen(false)}
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Transfer Status
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'all', label: 'All Transfers', desc: 'Show all transfer records' },
                { value: 'SUBMITTED', label: 'Submitted', desc: 'Pending verification and final approval' },
                { value: 'APPROVED', label: 'Approved', desc: 'Ownership successfully transferred' },
                { value: 'DRAFT', label: 'Draft', desc: 'Saved applications awaiting submission' },
                { value: 'REJECTED', label: 'Rejected', desc: 'Disapproved or cancelled transfers' },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatusFilter(s.value)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 text-left transition",
                    statusFilter === s.value
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-slate-900">{s.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{s.desc}</div>
                  </div>
                  {statusFilter === s.value && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </FilterDrawer>'''

replacement_transfers = '''        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          title="Filter"
          activeCount={statusFilter !== 'all' ? 1 : 0}
          onReset={() => setStatusFilter('all')}
          onApply={() => setIsFilterDrawerOpen(false)}
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Transfer Status
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'all', label: 'All Transfers' },
                { value: 'SUBMITTED', label: 'Submitted' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'REJECTED', label: 'Rejected' },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatusFilter(s.value)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3.5 py-3 text-left transition",
                    statusFilter === s.value
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary font-semibold"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="text-xs sm:text-sm text-slate-900">{s.label}</span>
                  {statusFilter === s.value && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </FilterDrawer>'''

if target_transfers in content:
    content = content.replace(target_transfers, replacement_transfers)
    with open(transfers_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated transfers/page.tsx")
else:
    print("WARNING: target_transfers not found!")

# 3. Receipts
receipts_file = os.path.join(test_base, 'apps/web/src/app/(dashboard)/receipts/page.tsx')
with open(receipts_file, 'r', encoding='utf-8') as f:
    content = f.read()

target_receipts = '''        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          title="Filter Receipts"
          activeCount={activeFilterCount}
          onReset={resetFilters}
          onApply={() => setIsFilterDrawerOpen(false)}
        >
          {/* Category Section */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Category
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { value: 'all', label: 'All Categories', desc: 'Installment & Development receipts', icon: Layers },
                { value: 'INSTALLMENT', label: 'Installments / Booking', desc: 'Plot installments, down payments & possession', icon: CreditCard },
                { value: 'DEVELOPMENT', label: 'Development Charges', desc: 'Phase 1 & Phase 2 infrastructure charges', icon: Hammer },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = categoryFilter === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategoryFilter(cat.value)}
                    className={cn(
                      "flex items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 text-primary shadow-xs ring-2 ring-primary/20"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition",
                      isSelected ? "bg-primary text-white shadow-2xs" : "bg-white border border-slate-200 text-slate-500"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-900 leading-tight">{cat.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-snug">{cat.desc}</div>
                    </div>
                    {isSelected && (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-2xs">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time Range Section */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Date & Time Range
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'current_month', label: 'Current Month' },
                { value: 'prev_90_days', label: 'Past 90 Days' },
                { value: 'custom', label: 'Custom Range' },
              ].map((tf) => (
                <button
                  key={tf.value}
                  type="button"
                  onClick={() => setTimeFilter(tf.value)}
                  className={cn(
                    "flex items-center justify-center rounded-xl border py-2.5 px-3 text-xs font-medium transition",
                    timeFilter === tf.value
                      ? "border-primary bg-primary text-white shadow-2xs font-semibold"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            {timeFilter === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 animate-in fade-in duration-200">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">From Date</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">To Date</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Section */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              Payment Method
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All Methods' },
                { value: 'CASH', label: 'Cash' },
                { value: 'CHEQUE', label: 'Cheque / PDC' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                { value: 'ONLINE', label: 'Online / Card' },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethodFilter(m.value)}
                  className={cn(
                    "flex items-center justify-center rounded-xl border py-2 px-2.5 text-xs font-medium transition",
                    methodFilter === m.value
                      ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </FilterDrawer>'''

replacement_receipts = '''        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          title="Filter"
          activeCount={activeFilterCount}
          onReset={resetFilters}
          onApply={() => setIsFilterDrawerOpen(false)}
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Category
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'all', label: 'All Categories', icon: Layers },
                { value: 'INSTALLMENT', label: 'Installments / Booking', icon: CreditCard },
                { value: 'DEVELOPMENT', label: 'Development Charges', icon: Hammer },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = categoryFilter === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategoryFilter(cat.value)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary font-semibold"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                      isSelected ? "bg-primary text-white shadow-2xs" : "bg-slate-100 text-slate-500"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="flex-1 text-xs sm:text-sm text-slate-900 leading-tight">{cat.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Date & Time Range
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'current_month', label: 'Current Month' },
                { value: 'prev_90_days', label: 'Past 90 Days' },
                { value: 'custom', label: 'Custom Range' },
              ].map((tf) => (
                <button
                  key={tf.value}
                  type="button"
                  onClick={() => setTimeFilter(tf.value)}
                  className={cn(
                    "flex items-center justify-center rounded-xl border py-2.5 px-3 text-xs font-medium transition",
                    timeFilter === tf.value
                      ? "border-primary bg-primary text-white shadow-2xs font-semibold"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {timeFilter === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 animate-in fade-in duration-200">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">From Date</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">To Date</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              Payment Method
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All Methods' },
                { value: 'CASH', label: 'Cash' },
                { value: 'CHEQUE', label: 'Cheque / PDC' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                { value: 'ONLINE', label: 'Online / Card' },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethodFilter(m.value)}
                  className={cn(
                    "flex items-center justify-center rounded-xl border py-2 px-2.5 text-xs font-medium transition",
                    methodFilter === m.value
                      ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </FilterDrawer>'''

if target_receipts in content:
    content = content.replace(target_receipts, replacement_receipts)
    with open(receipts_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated receipts/page.tsx")
else:
    print("WARNING: target_receipts not found!")

# 4. Expenses
expenses_file = os.path.join(test_base, 'apps/web/src/app/(dashboard)/expenses/page.tsx')
with open(expenses_file, 'r', encoding='utf-8') as f:
    content = f.read()

target_expenses = '''        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          title="Filter Expenses"
          activeCount={categoryFilter !== 'all' ? 1 : 0}
          onReset={() => setCategoryFilter('all')}
          onApply={() => setIsFilterDrawerOpen(false)}
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Expense Category
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'all', label: 'All Categories', desc: 'Office and site development expenses' },
                { value: 'OFFICE', label: 'Office Expenses', desc: 'Administrative, rent, utilities, and daily operations' },
                { value: 'DEVELOPMENT', label: 'Development / Site', desc: 'Civil works, road construction, sewerage, electrical' },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategoryFilter(c.value)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 text-left transition",
                    categoryFilter === c.value
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-slate-900">{c.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{c.desc}</div>
                  </div>
                  {categoryFilter === c.value && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </FilterDrawer>'''

replacement_expenses = '''        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          title="Filter"
          activeCount={categoryFilter !== 'all' ? 1 : 0}
          onReset={() => setCategoryFilter('all')}
          onApply={() => setIsFilterDrawerOpen(false)}
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Expense Category
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'all', label: 'All Categories' },
                { value: 'OFFICE', label: 'Office Expenses' },
                { value: 'DEVELOPMENT', label: 'Development / Site' },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategoryFilter(c.value)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3.5 py-3 text-left transition",
                    categoryFilter === c.value
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary font-semibold"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="text-xs sm:text-sm text-slate-900">{c.label}</span>
                  {categoryFilter === c.value && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </FilterDrawer>'''

if target_expenses in content:
    content = content.replace(target_expenses, replacement_expenses)
    with open(expenses_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated expenses/page.tsx")
else:
    print("WARNING: target_expenses not found!")

# 5. Invoices
invoices_file = os.path.join(test_base, 'apps/web/src/app/(dashboard)/invoices/page.tsx')
with open(invoices_file, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('title="Filter Installments"', 'title="Filter"')
content = content.replace('          {/* Status Section */}\n', '')
content = content.replace('          {/* Date & Time Range Section */}\n', '')
content = content.replace('            {/* Custom Date Pickers */}\n', '')
with open(invoices_file, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated invoices/page.tsx")

# 6. PDC
pdc_file = os.path.join(test_base, 'apps/web/src/app/(dashboard)/pdc/page.tsx')
with open(pdc_file, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('title="Filter PDCs"', 'title="Filter"')
content = content.replace('          {/* Status Section */}\n', '')
content = content.replace('          {/* Due Date Range Section */}\n', '')
with open(pdc_file, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated pdc/page.tsx")
