'use client'

import Link from 'next/link'
import {
  Car,
  CheckCircle2,
  DollarSign,
  Users,
  Accessibility,
  Clock,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Shield,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <Accessibility className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                Movilidad Diversa
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/booking">
                <Button size="sm">
                  Reservar
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs text-gray-500 mb-6">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Servicio activo en Medellín y área metropolitana
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4 leading-tight">
                Transporte especializado para personas con movilidad reducida
              </h1>
              <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                Vehículos adaptados con rampa y tecnología de silla robótica para escaleras.
                Atención profesional y precios transparentes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/booking">
                  <Button>
                    Reservar servicio
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </Link>
                <Link href="/admin/tariffs">
                  <Button variant="outline">
                    Ver tarifas
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-4 h-4 text-gray-700" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Reserva fácil</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Sistema de reservas con cotización instantánea y confirmación inmediata por WhatsApp.
                </p>
              </div>

              <div className="p-5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="w-4 h-4 text-gray-700" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Precios claros</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Tarifas por zona y tipo de servicio. Sin sorpresas ni costos ocultos.
                </p>
              </div>

              <div className="p-5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-4 h-4 text-gray-700" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">100% seguro</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Conductores capacitados, vehículos asegurados y equipos certificados.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-12 bg-gray-50/50">
          <div className="max-w-5xl mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Servicios</h2>
              <p className="text-xs text-gray-500">Soluciones adaptadas a cada necesidad</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-lg border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Vehículo con Rampa</h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Transporte en vehículo adaptado con rampa eléctrica para silla de ruedas.
                    </p>
                    <ul className="space-y-1.5">
                      <li className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        Rampa eléctrica de acceso
                      </li>
                      <li className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        Asistente profesional incluido
                      </li>
                      <li className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        Cobertura área metropolitana
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Accessibility className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Silla Robótica</h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Tecnología avanzada para superar escaleras y obstáculos arquitectónicos.
                    </p>
                    <ul className="space-y-1.5">
                      <li className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        Sube y baja escaleras
                      </li>
                      <li className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        Sistema 100% seguro
                      </li>
                      <li className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        Operador certificado
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Coverage */}
        <section className="py-12 border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Cobertura</h2>
              <p className="text-xs text-gray-500">Zonas de servicio disponibles</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: 'Medellín', type: 'Metro' },
                { name: 'Envigado', type: 'Metro' },
                { name: 'Itagüí', type: 'Metro' },
                { name: 'Bello', type: 'Metro' },
                { name: 'Sabaneta', type: 'Metro' },
                { name: 'La Estrella', type: 'Metro' },
                { name: 'Caldas', type: 'Metro' },
                { name: 'Aeropuerto JMC', type: 'Ruta' },
              ].map((zone) => (
                <div key={zone.name} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">{zone.name}</p>
                    <p className="text-[10px] text-gray-400">{zone.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-gray-900">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-lg font-semibold text-white mb-2">
              ¿Necesitas un servicio?
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Reserva en línea o contáctanos por WhatsApp
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/booking">
                <Button variant="secondary" size="sm">
                  Reservar ahora
                </Button>
              </Link>
              <a href="https://wa.me/573001234567" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Accessibility className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <span className="text-xs font-medium text-gray-300">Movilidad Diversa</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Transporte especializado para personas con movilidad reducida en Medellín y área metropolitana.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-medium text-gray-300 mb-3">Contacto</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-[11px] text-gray-500">
                  <Phone className="w-3 h-3" />
                  +57 300 123-4567
                </li>
                <li className="flex items-center gap-2 text-[11px] text-gray-500">
                  <Mail className="w-3 h-3" />
                  info@movilidaddiversa.co
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-medium text-gray-300 mb-3">Horarios</h3>
              <ul className="space-y-1 text-[11px] text-gray-500">
                <li>Lun - Vie: 6:00 AM - 10:00 PM</li>
                <li>Sábados: 7:00 AM - 8:00 PM</li>
                <li>Dom y Festivos: 8:00 AM - 6:00 PM</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-[10px] text-gray-600">
              © 2024 Movilidad Diversa. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
