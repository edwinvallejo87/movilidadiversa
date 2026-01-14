import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="professional-layout">
      <header className="professional-header">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="header-brand">
                Movilidad Diversa
              </Link>
              
              <nav className="hidden md:flex space-x-2">
                <Link href="/admin/calendar" className="nav-link">
                  Calendario
                </Link>
                <Link href="/admin/staff" className="nav-link">
                  Personal
                </Link>
                <Link href="/admin/customers" className="nav-link">
                  Clientes
                </Link>
                <Link href="/admin/services" className="nav-link">
                  Servicios
                </Link>
                <Link href="/admin/zones" className="nav-link">
                  Zonas
                </Link>
                <Link href="/admin/tariffs" className="nav-link">
                  Tarifas
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/" className="pro-btn pro-btn-secondary">
                Portal Público
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="main-content fade-in">
        {children}
      </main>
    </div>
  )
}