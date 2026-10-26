import { PrismaClient } from '@prisma/client'
import { readSheet } from 'read-excel-file/node'

const prisma = new PrismaClient()

// Parse age from strings like "96 años" or numbers
function parseAge(value: unknown): number | null {
  if (!value) return null
  if (typeof value === 'number') return value
  const match = String(value).match(/(\d+)/)
  return match ? parseInt(match[1]) : null
}

// Parse weight from strings like "56 kg" or numbers
function parseWeight(value: unknown): number | null {
  if (!value) return null
  if (typeof value === 'number') return value
  const match = String(value).match(/(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : null
}

async function main() {
  console.log('Leyendo archivo Excel...')

  const rows = await readSheet('data/Base de datos (1).xlsx')

  console.log(`Total filas en Excel: ${rows.length}`)

  let created = 0
  let updated = 0
  let errors = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    // Skip empty rows
    if (!row || !row[2]) continue

    const document = row[0] ? String(row[0]).trim() : null
    const name = row[2] ? String(row[2]).trim() : null
    const age = parseAge(row[3])
    const weight = parseWeight(row[4])
    const address = row[5] ? String(row[5]).trim() : null

    if (!name) {
      console.log(`Fila ${i + 1}: Sin nombre, saltando...`)
      continue
    }

    try {
      // Check if customer exists by document
      let existingCustomer = null
      if (document) {
        existingCustomer = await prisma.customer.findFirst({
          where: { document }
        })
      }

      // If not found by document, try by name (exact match)
      if (!existingCustomer) {
        existingCustomer = await prisma.customer.findFirst({
          where: {
            name: {
              equals: name,
              mode: 'insensitive'
            }
          }
        })
      }

      if (existingCustomer) {
        // Update existing customer
        await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            document: document || existingCustomer.document,
            age: age ?? existingCustomer.age,
            weight: weight ?? existingCustomer.weight,
            defaultAddress: address || existingCustomer.defaultAddress
          }
        })
        updated++
        console.log(`Actualizado: ${name}`)
      } else {
        // Create new customer
        await prisma.customer.create({
          data: {
            name,
            document,
            phone: 'Sin telefono',
            age,
            weight,
            defaultAddress: address,
            isActive: true
          }
        })
        created++
        console.log(`Creado: ${name}`)
      }
    } catch (error) {
      errors++
      console.error(`Error fila ${i + 1} (${name}):`, error)
    }
  }

  console.log('\n--- Resumen ---')
  console.log(`Creados: ${created}`)
  console.log(`Actualizados: ${updated}`)
  console.log(`Errores: ${errors}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
