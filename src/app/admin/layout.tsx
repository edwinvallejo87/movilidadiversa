import { Sidebar } from '@/components/admin'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main content */}
      <main className="lg:pl-[200px] transition-all duration-300">
        {/* Mobile padding to account for menu button */}
        <div className="pt-24 lg:pt-8 px-4 pb-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
