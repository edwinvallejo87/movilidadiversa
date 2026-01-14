'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '🏠' },
    { href: '/admin/calendar', label: 'Calendario', icon: '📅' },
    { href: '/admin/staff', label: 'Staff', icon: '👥' },
    { href: '/admin/customers', label: 'Clientes', icon: '🧑‍🦽' },
    { href: '/admin/appointments/new', label: 'Nueva Cita', icon: '➕' },
    { href: '/admin/services', label: 'Servicios', icon: '⚙️' },
    { href: '/admin/zones', label: 'Zonas', icon: '🗺️' },
    { href: '/admin/tariffs', label: 'Tarifas', icon: '💰' },
    { href: '/admin/reports', label: 'Reportes', icon: '📊' },
    { href: '/admin/settings', label: 'Config', icon: '🔧' },
  ]

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="professional-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="header-brand flex items-center space-x-2">
                <span className="text-xl">🚗</span>
                <span>Movilidad Diversa</span>
              </Link>
              <nav className="hidden md:flex space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link flex items-center space-x-2 ${
                      isActive(item.href) 
                        ? 'bg-gray-100 text-gray-900 font-medium' 
                        : ''
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="hidden lg:inline">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="text-lg">🔔</span>
              </button>
              <Link href="/" className="nav-link">
                Ir al Sitio
              </Link>
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-medium">
                A
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="md:hidden bg-white border-t border-gray-200 sticky top-16 z-40">
        <nav className="flex overflow-x-auto px-4 py-2 space-x-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link flex items-center space-x-2 whitespace-nowrap ${
                isActive(item.href) 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : ''
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}