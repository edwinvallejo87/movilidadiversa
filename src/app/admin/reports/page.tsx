'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Reportes y Métricas</h1>
            <p className="text-gray-600 mt-1">Análisis del rendimiento del negocio</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Reportes y Métricas</h1>
          <p className="text-gray-600 mt-1">Análisis del rendimiento del negocio</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Últimos 7 días</SelectItem>
              <SelectItem value="last30days">Últimos 30 días</SelectItem>
              <SelectItem value="last3months">Últimos 3 meses</SelectItem>
              <SelectItem value="last6months">Últimos 6 meses</SelectItem>
              <SelectItem value="lastyear">Último año</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => fetchMetrics()}>
            Actualizar
          </Button>
        </div>
      </div>

      {metrics && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Citas</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalAppointments}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xl">📅</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">💰</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Promedio Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.averageRating.toFixed(1)}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-xl">⭐</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasa Completadas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.totalAppointments > 0 
                      ? ((metrics.completedAppointments / metrics.totalAppointments) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-xl">✓</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de las Citas</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Completadas</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{metrics.completedAppointments}</span>
                    <div className="w-24 h-2 bg-gray-200 rounded">
                      <div 
                        className="h-2 bg-green-500 rounded" 
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
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Pendientes</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{metrics.pendingAppointments}</span>
                    <div className="w-24 h-2 bg-gray-200 rounded">
                      <div 
                        className="h-2 bg-yellow-500 rounded" 
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
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Canceladas</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{metrics.cancelledAppointments}</span>
                    <div className="w-24 h-2 bg-gray-200 rounded">
                      <div 
                        className="h-2 bg-red-500 rounded" 
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
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Servicios Más Solicitados</h3>
              <div className="space-y-3">
                {metrics.topServices.slice(0, 5).map((service, index) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{service.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{service.count} citas</div>
                      <div className="text-sm text-gray-600">{formatCurrency(service.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Staff Performance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento del Personal</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-gray-700">Staff</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Citas</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Rating</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.staffPerformance.map((staff, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{staff.name}</td>
                      <td className="p-3 text-gray-600">{staff.appointments}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="font-medium">{staff.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-gray-900">{formatCurrency(staff.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Monthly Trends */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencias Mensuales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.monthlyStats.slice(0, 6).map((stat, index) => (
                <div key={stat.month} className="bg-gray-50 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-600 mb-1">{stat.month}</div>
                    <div className="text-lg font-bold text-gray-900">{stat.appointments} citas</div>
                    <div className="text-sm text-gray-600">{formatCurrency(stat.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}