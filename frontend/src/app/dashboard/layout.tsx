import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { UserProvider } from '@/hooks/useUser'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Topbar />
          <main className="p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  )
}
