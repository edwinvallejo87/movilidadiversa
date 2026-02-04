import jsPDF from 'jspdf'

export interface ReceiptData {
  id: string
  scheduledAt: Date | string
  returnAt?: Date | string | null  // Return pickup time for round trips
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
  staff?: {
    name: string
    phone?: string
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
  return type === 'DOBLE' ? 'Ida y Vuelta' : 'Solo Ida'
}

const loadLogoAsBase64 = (): Promise<{ data: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Use higher resolution canvas for better quality
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.scale(scale, scale)
        ctx.drawImage(img, 0, 0)
        resolve({
          data: canvas.toDataURL('image/png', 1.0),
          width: img.width,
          height: img.height
        })
      } else {
        reject(new Error('Could not get canvas context'))
      }
    }
    img.onerror = () => reject(new Error('Could not load logo'))
    img.src = '/logo.jpeg'
  })
}

export const generateReceiptPDF = async (data: ReceiptData): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  // Colors - Minimal palette
  const black: [number, number, number] = [0, 0, 0]
  const darkGray: [number, number, number] = [60, 60, 60]
  const mediumGray: [number, number, number] = [120, 120, 120]
  const lightGray: [number, number, number] = [200, 200, 200]

  // ============ HEADER ============
  // Logo - maintain aspect ratio
  const logoSize = 30 // Target height in mm
  let logoWidth = logoSize
  let textStartX = margin + 38

  try {
    const logo = await loadLogoAsBase64()
    // Calculate width to maintain aspect ratio
    const aspectRatio = logo.width / logo.height
    logoWidth = logoSize * aspectRatio
    doc.addImage(logo.data, 'PNG', margin, y, logoWidth, logoSize)
    textStartX = margin + logoWidth + 8
  } catch {
    // Continue without logo
  }

  // Company name
  doc.setTextColor(...black)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('MOVILIDAD DIVERSA', textStartX, y + 12)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)
  doc.text('Transporte Especializado en Movilidad Reducida', textStartX, y + 19)

  y += 38

  // Line separator
  doc.setDrawColor(...black)
  doc.setLineWidth(0.8)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  // ============ ORDER TITLE ============
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...black)
  doc.text('ORDEN DE SERVICIO', pageWidth / 2, y, { align: 'center' })
  y += 10

  // Order number and date
  const orderNumber = data.id.substring(0, 8).toUpperCase()
  const emissionDate = new Date().toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)
  doc.text(`No. ${orderNumber}`, margin, y)
  doc.text(`Fecha: ${emissionDate}`, pageWidth - margin, y, { align: 'right' })
  y += 12

  // ============ CLIENT SECTION ============
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...black)
  doc.text('CLIENTE', margin, y)
  y += 6

  doc.setDrawColor(...lightGray)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)

  doc.text(`Nombre:`, margin, y)
  doc.setFont('helvetica', 'bold')
  doc.text(data.customer.name, margin + 25, y)

  if (data.customer.phone) {
    doc.setFont('helvetica', 'normal')
    doc.text(`Telefono:`, pageWidth / 2, y)
    doc.text(data.customer.phone, pageWidth / 2 + 25, y)
  }
  y += 6

  if (data.customer.email) {
    doc.setFont('helvetica', 'normal')
    doc.text(`Email:`, margin, y)
    doc.text(data.customer.email, margin + 25, y)
  }
  y += 12

  // ============ SERVICE SECTION ============
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...black)
  doc.text('SERVICIO', margin, y)
  y += 6

  doc.setDrawColor(...lightGray)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  const scheduledDate = formatDate(data.scheduledAt)
  const scheduledTime = formatTime(data.scheduledAt)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)

  // Row 1 - Pickup time
  doc.text(`Fecha:`, margin, y)
  doc.text(scheduledDate, margin + 25, y)
  const pickupLabel = data.returnAt ? 'Hora Recogida:' : 'Hora:'
  doc.text(pickupLabel, pageWidth / 2, y)
  doc.text(scheduledTime, pageWidth / 2 + 30, y)
  y += 6

  // Row 2 - Return time (only for round trips)
  if (data.returnAt) {
    const returnDate = formatDate(data.returnAt)
    const returnTime = formatTime(data.returnAt)
    const isSameDay = new Date(data.scheduledAt).toDateString() === new Date(data.returnAt).toDateString()

    doc.text(`Hora Regreso:`, margin, y)
    if (isSameDay) {
      doc.text(returnTime, margin + 30, y)
    } else {
      doc.text(`${returnDate} - ${returnTime}`, margin + 30, y)
    }
    y += 6
  }

  // Row 3
  doc.text(`Tipo de Viaje:`, margin, y)
  doc.text(getTripTypeLabel(data.pricingSnapshot?.tripType), margin + 35, y)
  y += 6

  // Row 3
  doc.text(`Equipo:`, margin, y)
  doc.text(getEquipmentLabel(data.equipmentType), margin + 25, y)

  if (data.distanceKm) {
    doc.text(`Distancia:`, pageWidth / 2, y)
    doc.text(`${data.distanceKm} km`, pageWidth / 2 + 25, y)
  }
  y += 12

  // ============ ROUTE SECTION ============
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...black)
  doc.text('RUTA', margin, y)
  y += 6

  doc.setDrawColor(...lightGray)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)

  // Origin
  const addressMaxWidth = contentWidth - 25
  doc.setFont('helvetica', 'bold')
  doc.text('Origen:', margin, y)
  doc.setFont('helvetica', 'normal')
  const originLines = doc.splitTextToSize(data.originAddress, addressMaxWidth)
  doc.text(originLines, margin + 25, y)
  y += originLines.length * 5 + 4

  // Destination
  doc.setFont('helvetica', 'bold')
  doc.text('Destino:', margin, y)
  doc.setFont('helvetica', 'normal')
  const destLines = doc.splitTextToSize(data.destinationAddress, addressMaxWidth)
  doc.text(destLines, margin + 25, y)
  y += destLines.length * 5 + 10

  // ============ PRICING SECTION ============
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...black)
  doc.text('DETALLE', margin, y)
  y += 6

  doc.setDrawColor(...lightGray)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)

  const breakdown = data.pricingSnapshot?.breakdown || []

  if (breakdown.length > 0) {
    breakdown.forEach((item) => {
      const itemText = item.quantity ? `${item.item} (x${item.quantity})` : item.item
      doc.text(itemText, margin, y)
      doc.text(formatCurrency(item.subtotal), pageWidth - margin, y, { align: 'right' })
      y += 6
    })
  } else {
    doc.text('Servicio de transporte especializado', margin, y)
    doc.text(formatCurrency(data.totalAmount), pageWidth - margin, y, { align: 'right' })
    y += 6
  }

  y += 4
  doc.setDrawColor(...black)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  // Total
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...black)
  doc.text('TOTAL:', margin, y)
  doc.text(formatCurrency(data.totalAmount), pageWidth - margin, y, { align: 'right' })

  // ============ FOOTER ============
  const footerStartY = pageHeight - 40

  // Footer separator
  doc.setDrawColor(...black)
  doc.setLineWidth(0.8)
  doc.line(margin, footerStartY, pageWidth - margin, footerStartY)

  // Footer content - 3 columns
  const colWidth = contentWidth / 3
  const col1X = margin
  const col2X = margin + colWidth
  const col3X = margin + colWidth * 2

  let footerY = footerStartY + 6

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...black)

  // Column 1 - Address
  doc.text('Direccion', col1X, footerY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)
  doc.text('Calle 8a #56-21', col1X, footerY + 4)
  doc.text('Guayabal - Medellin', col1X, footerY + 8)

  // Column 2 - Hours
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...black)
  doc.text('Horarios', col2X, footerY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)
  doc.text('Lunes - Domingo', col2X, footerY + 4)
  doc.text('6:00 am - 10:00 pm', col2X, footerY + 8)

  // Column 3 - Contact
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...black)
  doc.text('Contacto', col3X, footerY)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)
  doc.text('WhatsApp: 314 829 8976', col3X, footerY + 4)
  doc.text('movilidadiversa@gmail.com', col3X, footerY + 8)

  // Thank you message
  footerY += 16
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...mediumGray)
  doc.text('Gracias por confiar en nosotros', pageWidth / 2, footerY, { align: 'center' })

  // Generate filename
  const dateStr = new Date(data.scheduledAt).toISOString().split('T')[0]
  const filename = `orden-servicio-${orderNumber}-${dateStr}.pdf`

  // Download the PDF
  doc.save(filename)
}
