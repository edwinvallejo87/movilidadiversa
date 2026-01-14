'use client'

import { useState } from 'react'
import { ButtonModern } from '@/components/ui/button-modern'
import { CardModern, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card-modern'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🚗</span>
              <span className="text-xl font-bold text-gray-900">
                Movilidad Diversa
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/booking">
                <button className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                  Reservar Servicio
                </button>
              </Link>
              <Link href="/admin">
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
                  Admin
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
            Servicio líder en Medellín
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Movilidad Inclusiva<br />para Todos
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transporte especializado con tecnología avanzada y atención personalizada para personas con movilidad reducida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking">
              <button className="bg-gray-900 text-white px-8 py-3 rounded-md font-semibold hover:bg-gray-800 transition-colors">
                Reservar Ahora
              </button>
            </Link>
            <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-md font-semibold hover:bg-gray-50 transition-colors">
              Ver Demo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Reserva Fácil</h3>
            <p className="text-gray-600">
              Sistema de reservas intuitivo con cotización instantánea y confirmación inmediata.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💲</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Precios Transparentes</h3>
            <p className="text-gray-600">
              Tarifas claras basadas en distancia y servicio. Sin sorpresas ni costos ocultos.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Atención Premium</h3>
            <p className="text-gray-600">
              Personal altamente capacitado con vehículos de última generación adaptados.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Nuestros Servicios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <span className="text-3xl mb-4 block">🚗</span>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Transporte Estándar</h3>
              <p className="text-gray-600 mb-4">
                Vehículos totalmente adaptados con la mejor tecnología para tu comodidad.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  Rampa eléctrica de acceso
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  Asistente profesional
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  Cobertura metropolitana
                </li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <span className="text-3xl mb-4 block">🤖</span>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Silla Robótica</h3>
              <p className="text-gray-600 mb-4">
                Tecnología de punta para superar cualquier obstáculo arquitectónico.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  Sube y baja escaleras
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  100% seguro y estable
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  Operador certificado
                </li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <span className="text-3xl mb-4 block">🏥</span>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Traslados Médicos</h3>
              <p className="text-gray-600 mb-4">
                Servicio especializado para citas médicas con máxima puntualidad.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  Horarios prioritarios
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  Acompañamiento incluido
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  Tiempo de espera flexible
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            ¿Listo para reservar tu servicio?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Únete a miles de usuarios satisfechos que confían en nosotros para su movilidad diaria.
          </p>
          <Link href="/booking">
            <button className="bg-gray-900 text-white px-8 py-3 rounded-md font-semibold hover:bg-gray-800 transition-colors">
              Comenzar Ahora
            </button>
          </Link>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-xl">🚗</span>
                <span className="text-lg font-semibold">Movilidad Diversa</span>
              </div>
              <p className="text-gray-400">
                Comprometidos con la movilidad inclusiva y la accesibilidad para todas las personas.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Teléfono: +57 4 123-4567</li>
                <li>Email: info@movilidaddiversa.co</li>
                <li>WhatsApp: +57 300 123-4567</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Horarios</h3>
              <ul className="space-y-1 text-gray-400 text-sm">
                <li>Lun - Vie: 6:00 AM - 10:00 PM</li>
                <li>Sábados: 7:00 AM - 8:00 PM</li>
                <li>Dom y Festivos: 8:00 AM - 6:00 PM</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; 2024 Movilidad Diversa. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
