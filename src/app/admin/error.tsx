'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminError({ error }: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error('Admin page error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-red-100 bg-white p-6 text-center shadow-sm">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-500" />
        <h2 className="text-base font-semibold text-gray-900">No pudimos cargar esta sección</h2>
        <p className="mt-2 text-sm text-gray-600">
          La acción puede haberse completado. Recarga y verifica antes de repetirla para
          evitar registros duplicados.
        </p>
        <Button className="mt-5" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Recargar y verificar
        </Button>
      </div>
    </div>
  )
}
