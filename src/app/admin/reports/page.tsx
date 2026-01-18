'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, DollarSign, Star, CheckCircle, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/admin'

interface ReportMetrics {
  totalAppointments: number
  totalRevenue: number
  averageRating: number
  completedAppointments: number
  cancelledAppointments: number
  pendingAppointments: number
  topServices: Array<{
    name: string
    count: number
    revenue: number
  }>
  monthlyStats: Array<{
    month: string
    appointments: number
    revenue: number
  }>
  staffPerformance: Array<{
    name: string
    appointments: number
    rating: number
    revenue: number
  }>
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount)
}

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null)
  const [timeRange, setTimeRange] = useState('last30days')
  const [loading, setLoading] = useState(true)

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/reports/metrics?timeRange=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [timeRange])

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Reportes y Metricas"
          description="Analisis del rendimiento del negocio"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-gray-100 rounded p-4 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-3/4 mb-2"></div>
              <div className="h-5 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Reportes y Metricas"
        description="Analisis del rendimiento del negocio"
        actions={
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Ultimos 7 dias</SelectItem>
                <SelectItem value="last30days">Ultimos 30 dias</SelectItem>
                <SelectItem value="last3months">Ultimos 3 meses</SelectItem>
                <SelectItem value="last6months">Ultimos 6 meses</SelectItem>
                <SelectItem value="lastyear">Ultimo ano</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => fetchMetrics()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        }
      />

      {metrics && (
        <div className="space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 rounded p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Citas</p>
                  <p className="text-lg font-semibold text-gray-900">{metrics.totalAppointments}</p>
                </div>
                <div className="w-9 h-9 bg-blue-50 rounded flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Ingresos Totales</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.totalRevenue)}</p>
                </div>
                <div className="w-9 h-9 bg-green-50 rounded flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Promedio Rating</p>
                  <p className="text-lg font-semibold text-gray-900">{metrics.averageRating.toFixed(1)}</p>
                </div>
                <div className="w-9 h-9 bg-yellow-50 rounded flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Tasa Completadas</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {metrics.totalAppointments > 0
                      ? ((metrics.completedAppointments / metrics.totalAppointments) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div className="w-9 h-9 bg-purple-50 rounded flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-100 rounded p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Estado de las Citas</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Completadas</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-900">{metrics.completedAppointments}</span>
                    <div className="w-20 h-1.5 bg-gray-100 rounded">
                      <div
                        className="h-1.5 bg-green-500 rounded"
                        style={{
                          width: `${metrics.totalAppointments > 0
                            ? (metrics.completedAppointments / metrics.totalAppointments) * 100
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Pendientes</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-900">{metrics.pendingAppointments}</span>
                    <div className="w-20 h-1.5 bg-gray-100 rounded">
                      <div
                        className="h-1.5 bg-yellow-500 rounded"
                        style={{
                          width: `${metrics.totalAppointments > 0
                            ? (metrics.pendingAppointments / metrics.totalAppointments) * 100
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Canceladas</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-900">{metrics.cancelledAppointments}</span>
                    <div className="w-20 h-1.5 bg-gray-100 rounded">
                      <div
                        className="h-1.5 bg-red-500 rounded"
                        style={{
                          width: `${metrics.totalAppointments > 0
                            ? (metrics.cancelledAppointments / metrics.totalAppointments) * 100
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Servicios Mas Solicitados</h3>
              <div className="space-y-2">
                {metrics.topServices.slice(0, 5).map((service, index) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-xs font-medium text-gray-900">{service.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-900">{service.count} citas</span>
                      <span className="text-xs text-gray-500 ml-2">{formatCurrency(service.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Staff Performance */}
          <div className="bg-white border border-gray-100 rounded p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Rendimiento del Personal</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Staff</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Citas</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Rating</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Ingresos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {metrics.staffPerformance.map((staff, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2 font-medium text-gray-900">{staff.name}</td>
                      <td className="px-3 py-2 text-gray-600">{staff.appointments}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{staff.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900">{formatCurrency(staff.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white border border-gray-100 rounded p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Tendencias Mensuales</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {metrics.monthlyStats.slice(0, 6).map((stat) => (
                <div key={stat.month} className="bg-gray-50 rounded p-3">
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-500 mb-1">{stat.month}</div>
                    <div className="text-sm font-semibold text-gray-900">{stat.appointments}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(stat.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}