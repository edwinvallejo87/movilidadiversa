'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader, StatCard } from '@/components/admin'
import { Calendar, Car, Users, DollarSign, Plus, BarChart3, Clock } from 'lucide-react'

interface DashboardStats {
  todayAppointments: number
  activeResources: number
  totalCustomers: number
  monthRevenue: string
}

interface TodayAppointment {
  id: string
  scheduledAt: string
  customerName: string
  serviceName: string
  serviceColor: string
  staffName: string
  status: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    activeResources: 0,
    totalCustomers: 0,
    monthRevenue: '$0'
  })
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard')
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
          setTodayAppointments(data.todayAppointmentsList || [])
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      'PENDING': { label: 'Programada', color: 'bg-blue-100 text-blue-700' },
      'SCHEDULED': { label: 'Programada', color: 'bg-blue-100 text-blue-700' },
      'CONFIRMED': { label: 'Programada', color: 'bg-blue-100 text-blue-700' },
      'IN_PROGRESS': { label: 'En curso', color: 'bg-yellow-100 text-yellow-700' },
      'COMPLETED': { label: 'Completada', color: 'bg-green-100 text-green-700' },
      'CANCELLED': { label: 'Cancelada', color: 'bg-red-100 text-red-700' }
    }
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700' }
  }

  return (
    <div>
      <PageHeader
        title="Panel de Administracion"
        description="Gestiona tu servicio de movilidad diversa"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Citas Programadas"
          value={loading ? '-' : stats.todayAppointments}
          icon={Calendar}
          badge="Hoy"
          badgeColor="gray"
        />
        <StatCard
          title="Conductores Activos"
          value={loading ? '-' : stats.activeResources}
          icon={Car}
          badge="Activos"
          badgeColor="green"
        />
        <StatCard
          title="Clientes Registrados"
          value={loading ? '-' : stats.totalCustomers}
          icon={Users}
          badge="Total"
          badgeColor="blue"
        />
        <StatCard
          title="Ingresos del Mes"
          value={loading ? '-' : stats.monthRevenue}
          icon={DollarSign}
          badge="Mes"
          badgeColor="gray"
        />
      </div>

      {/* Today's Appointments */}
      {todayAppointments.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-3">Citas de Hoy</h2>
          <div className="bg-white border border-gray-100 rounded overflow-hidden">
            <div className="divide-y divide-gray-50">
              {todayAppointments.map((apt) => {
                const statusInfo = getStatusBadge(apt.status)
                return (
                  <div key={apt.id} className="flex items-center justify-between p-3 hover:bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-gray-500 min-w-[60px]">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{formatTime(apt.scheduledAt)}</span>
                      </div>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: apt.serviceColor }}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{apt.customerName}</p>
                        <p className="text-xs text-gray-500">{apt.serviceName} - {apt.staffName}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                )
              })}
            </div>
            <Link
              href="/admin/calendar"
              className="block text-center py-2 text-xs text-blue-600 hover:bg-blue-50/50 border-t border-gray-100"
            >
              Ver todas las citas
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h2 className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-3">Accesos Rapidos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link
          href="/admin/calendar"
          className="bg-white border border-gray-100 rounded p-4 hover:border-gray-200 transition-colors group"
        >
          <div className="p-1.5 bg-blue-50 rounded w-fit mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-0.5">Calendario</h3>
          <p className="text-xs text-gray-500">
            Vista calendario con todas las citas programadas
          </p>
        </Link>

        <Link
          href="/admin/calendar"
          className="bg-white border border-gray-100 rounded p-4 hover:border-gray-200 transition-colors group"
        >
          <div className="p-1.5 bg-green-50 rounded w-fit mb-2">
            <Plus className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-0.5">Nueva Cita</h3>
          <p className="text-xs text-gray-500">
            Crear nueva cita con seleccion de cliente y horario
          </p>
        </Link>

        <Link
          href="/admin/reports"
          className="bg-white border border-gray-100 rounded p-4 hover:border-gray-200 transition-colors group"
        >
          <div className="p-1.5 bg-purple-50 rounded w-fit mb-2">
            <BarChart3 className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-0.5">Reportes</h3>
          <p className="text-xs text-gray-500">
            Estadisticas de citas, ingresos y rendimiento
          </p>
        </Link>
      </div>
    </div>
  )
}
