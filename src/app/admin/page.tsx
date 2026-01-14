'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Panel de Administración</h1>
        <p className="page-subtitle">Gestiona tu servicio de movilidad diversa</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">📅</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">Hoy</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">12</div>
          <div className="text-sm text-gray-600">Citas Programadas</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">🚗</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Activos</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">8</div>
          <div className="text-sm text-gray-600">Vehículos Disponibles</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">👥</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">245</div>
          <div className="text-sm text-gray-600">Clientes Registrados</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">💰</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">Mes</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">$2.4M</div>
          <div className="text-sm text-gray-600">Ingresos del Mes</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="dashboard-card">
          <div className="dashboard-icon">
            📅
          </div>
          <h2 className="dashboard-title">Calendario</h2>
          <p className="dashboard-description">
            Vista calendario con todas las citas programadas estilo Brisk
          </p>
          <Link href="/admin/calendar" className="pro-btn pro-btn-primary w-full">
            Ver Calendario
          </Link>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon">
            👥
          </div>
          <h2 className="dashboard-title">Staff</h2>
          <p className="dashboard-description">
            Gestionar vehículos, conductores y asistentes con disponibilidad
          </p>
          <Link href="/admin/staff" className="pro-btn pro-btn-primary w-full">
            Administrar Staff
          </Link>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon">
            🧑‍🦽
          </div>
          <h2 className="dashboard-title">Clientes</h2>
          <p className="dashboard-description">
            Base de datos de clientes con historial médico y preferencias
          </p>
          <Link href="/admin/customers" className="pro-btn pro-btn-primary w-full">
            Gestionar Clientes
          </Link>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon">
            📋
          </div>
          <h2 className="dashboard-title">Nueva Cita</h2>
          <p className="dashboard-description">
            Crear nueva cita con selección de cliente, staff y horario
          </p>
          <Link href="/admin/appointments/new" className="pro-btn pro-btn-primary w-full">
            Crear Cita
          </Link>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon">
            ⚙️
          </div>
          <h2 className="dashboard-title">Servicios</h2>
          <p className="dashboard-description">
            Gestionar tipos de servicios y configuración
          </p>
          <Link href="/admin/services" className="pro-btn pro-btn-primary w-full">
            Administrar Servicios
          </Link>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon">
            🗺️
          </div>
          <h2 className="dashboard-title">Zonas</h2>
          <p className="dashboard-description">
            Configurar zonas geográficas y tarifas
          </p>
          <Link href="/admin/zones" className="pro-btn pro-btn-primary w-full">
            Administrar Zonas
          </Link>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon">
            💰
          </div>
          <h2 className="dashboard-title">Tarifas</h2>
          <p className="dashboard-description">
            Configurar precios dinámicos por servicio y ruta
          </p>
          <Link href="/admin/tariffs" className="pro-btn pro-btn-primary w-full">
            Administrar Tarifas
          </Link>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon">
            📊
          </div>
          <h2 className="dashboard-title">Reportes</h2>
          <p className="dashboard-description">
            Estadísticas de citas, ingresos y rendimiento del staff
          </p>
          <Link href="/admin/reports" className="pro-btn pro-btn-primary w-full">
            Ver Reportes
          </Link>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon">
            🔧
          </div>
          <h2 className="dashboard-title">Configuración</h2>
          <p className="dashboard-description">
            Ajustes generales del sistema y preferencias
          </p>
          <Link href="/admin/settings" className="pro-btn pro-btn-primary w-full">
            Configuración
          </Link>
        </div>
      </div>
    </div>
  )
}