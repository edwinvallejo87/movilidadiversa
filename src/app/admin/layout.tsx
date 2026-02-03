import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { Sidebar } from '@/components/admin'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={{ name: user.name, email: user.email }} />

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
