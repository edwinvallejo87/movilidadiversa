import jsPDF from 'jspdf'

export interface ReceiptData {
  id: string
  scheduledAt: Date | string
  originAddress: string
  destinationAddress: string
  distanceKm?: number
  equipmentType: string
  totalAmount: number
  pricingSnapshot?: {
    tripType?: string
    equipmentType?: string
    breakdown?: Array<{ item: string; subtotal: number; quantity?: number }>
    totalPrice?: number
  }
  customer: {
    name: string
    phone?: string
    email?: string
  }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatTime = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

const getEquipmentLabel = (type: string): string => {
  return type === 'ROBOTICA_PLEGABLE' ? 'Silla Robotica/Plegable' : 'Vehiculo con Rampa'
}

const getTripTypeLabel = (type?: string): string => {
  if (!type) return 'Servicio'
  return type === 'DOBLE' ? 'Viaje Doble (Ida y Vuelta)' : 'Viaje Sencillo (Solo Ida)'
}

const loadLogoAsBase64 = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/jpeg'))
      } else {
        reject(new Error('Could not get canvas context'))
      }
    }
    img.onerror = () => reject(new Error('Could not load logo'))
    img.src = '/logo-movilidad-diversa-601-YNq9g7O3JECXj96E.jpeg'
  })
}

export const generateReceiptPDF = async (data: ReceiptData): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  // Colors
  const primaryColor: [number, number, number] = [41, 128, 185]
  const darkGray: [number, number, number] = [51, 51, 51]
  const lightGray: [number, number, number] = [128, 128, 128]
  const lineColor: [number, number, number] = [220, 220, 220]

  // Try to load and add logo
  try {
    const logoBase64 = await loadLogoAsBase64()
    doc.addImage(logoBase64, 'JPEG', margin, y, 25, 25)
  } catch {
    // Continue without logo if loading fails
  }

  // Header - Company name
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('MOVILIDAD DIVERSA', margin + 30, y + 10)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...lightGray)
  doc.text('Transporte Especializado', margin + 30, y + 17)

  y += 35

  // Separator line
  doc.setDrawColor(...lineColor)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Receipt title and number
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkGray)
  doc.text('RECIBO DE SERVICIO', pageWidth / 2, y, { align: 'center' })
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...lightGray)
  const receiptNumber = data.id.substring(0, 8).toUpperCase()
  doc.text(`No. ${receiptNumber}`, pageWidth / 2, y, { align: 'center' })
  y += 5

  const emissionDate = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.text(`Fecha de emision: ${emissionDate}`, pageWidth / 2, y, { align: 'center' })
  y += 12

  // Section: Customer Data
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F')
  y += 7

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('DATOS DEL CLIENTE', margin + 5, y)
  y += 7

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)
  doc.text(`Nombre: ${data.customer.name}`, margin + 5, y)
  y += 5

  if (data.customer.phone) {
    doc.text(`Telefono: ${data.customer.phone}`, margin + 5, y)
    y += 5
  }

  if (data.customer.email) {
    doc.text(`Email: ${data.customer.email}`, margin + 5, y)
  }
  y += 12

  // Section: Service Details
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(margin, y, contentWidth, 35, 2, 2, 'F')
  y += 7

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('DETALLES DEL SERVICIO', margin + 5, y)
  y += 7

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)

  const scheduledDate = formatDate(data.scheduledAt)
  const scheduledTime = formatTime(data.scheduledAt)

  doc.text(`Fecha: ${scheduledDate}`, margin + 5, y)
  y += 5
  doc.text(`Hora: ${scheduledTime}`, margin + 5, y)
  y += 5
  doc.text(`Equipo: ${getEquipmentLabel(data.equipmentType)}`, margin + 5, y)
  y += 5
  doc.text(`Tipo: ${getTripTypeLabel(data.pricingSnapshot?.tripType)}`, margin + 5, y)
  y += 12

  // Section: Route
  doc.setFillColor(245, 247, 250)
  const routeHeight = data.distanceKm ? 32 : 27
  doc.roundedRect(margin, y, contentWidth, routeHeight, 2, 2, 'F')
  y += 7

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('RUTA', margin + 5, y)
  y += 7

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)

  // Truncate addresses if too long
  const maxAddressLength = 60
  const originTruncated =
    data.originAddress.length > maxAddressLength
      ? data.originAddress.substring(0, maxAddressLength) + '...'
      : data.originAddress
  const destTruncated =
    data.destinationAddress.length > maxAddressLength
      ? data.destinationAddress.substring(0, maxAddressLength) + '...'
      : data.destinationAddress

  doc.text(`Origen: ${originTruncated}`, margin + 5, y)
  y += 5
  doc.text(`Destino: ${destTruncated}`, margin + 5, y)

  if (data.distanceKm) {
    y += 5
    doc.text(`Distancia: ${data.distanceKm} km`, margin + 5, y)
  }
  y += 12

  // Section: Price Breakdown
  const breakdown = data.pricingSnapshot?.breakdown || []
  const breakdownHeight = Math.max(40, 25 + breakdown.length * 6 + 12)

  doc.setFillColor(245, 247, 250)
  doc.roundedRect(margin, y, contentWidth, breakdownHeight, 2, 2, 'F')
  y += 7

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('DESGLOSE DE PRECIO', margin + 5, y)
  y += 8

  // Breakdown items
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)

  if (breakdown.length > 0) {
    breakdown.forEach((item) => {
      const itemText = item.quantity ? `${item.item} (x${item.quantity})` : item.item
      doc.text(itemText, margin + 5, y)
      doc.text(formatCurrency(item.subtotal), pageWidth - margin - 5, y, { align: 'right' })
      y += 6
    })
  } else {
    doc.text('Servicio de transporte', margin + 5, y)
    doc.text(formatCurrency(data.totalAmount), pageWidth - margin - 5, y, { align: 'right' })
    y += 6
  }

  // Separator line before total
  y += 2
  doc.setDrawColor(...lineColor)
  doc.line(margin + 5, y, pageWidth - margin - 5, y)
  y += 6

  // Total
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL', margin + 5, y)
  doc.setTextColor(...primaryColor)
  doc.text(formatCurrency(data.totalAmount), pageWidth - margin - 5, y, { align: 'right' })
  y += 20

  // Footer message
  doc.setFontSize(10)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...lightGray)
  doc.text('Gracias por confiar en nosotros', pageWidth / 2, y, { align: 'center' })
  y += 5
  doc.setFontSize(8)
  doc.text('Este documento es un comprobante de su reserva de servicio', pageWidth / 2, y, {
    align: 'center',
  })

  // Generate filename
  const dateStr = new Date(data.scheduledAt).toISOString().split('T')[0]
  const filename = `recibo-${receiptNumber}-${dateStr}.pdf`

  // Download the PDF
  doc.save(filename)
}
