import { Sidebar, SidebarProvider } from '@/components/layout/sidebar'
import { AuthGuard } from '@/components/auth-guard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex h-screen bg-transparent">
          {/* Desktop sidebar */}
          <Sidebar />

          {/* Main content area */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto bg-transparent">
              <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-6 sm:py-6">
                {children}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  )
}