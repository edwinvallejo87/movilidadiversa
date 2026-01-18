'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCircle,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Package,
  Wrench,
  MapPin
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/calendar', label: 'Calendario', icon: Calendar },
  { href: '/admin/staff', label: 'Conductores', icon: Users },
  { href: '/admin/customers', label: 'Clientes', icon: UserCircle },
  { href: '/admin/equipment-types', label: 'Tipos Equipo', icon: Wrench },
  { href: '/admin/zones', label: 'Zonas', icon: MapPin },
  { href: '/admin/tariffs', label: 'Tarifas', icon: DollarSign },
  { href: '/admin/extras', label: 'Extras', icon: Package },
  { href: '/admin/reports', label: 'Reportes', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gray-900 text-white z-50
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[52px]' : 'w-[180px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className={`h-10 flex items-center border-b border-gray-800 ${collapsed ? 'px-3 justify-center' : 'px-3 justify-between'}`}>
          {!collapsed && (
            <Link href="/admin" className="font-medium text-xs truncate">
              Movilidad Diversa
            </Link>
          )}

          {/* Close button mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Collapse button desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-2 px-2 py-1.5 rounded
                  transition-colors duration-150
                  ${active
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-[11px] font-medium truncate">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-gray-800/50">
          <Link
            href="/admin/settings"
            className={`
              flex items-center gap-2 px-2 py-1.5 rounded
              text-gray-400 hover:bg-white/5 hover:text-gray-200
              transition-colors duration-150
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? 'Config' : undefined}
          >
            <Settings className="w-3.5 h-3.5 flex-shrink-0" />
            {!collapsed && (
              <span className="text-[11px] font-medium">Config</span>
            )}
          </Link>
        </div>
      </aside>
    </>
  )
}
