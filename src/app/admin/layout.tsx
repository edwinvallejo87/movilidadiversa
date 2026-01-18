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
      <main className="lg:pl-[180px] transition-all duration-300">
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  )
}
