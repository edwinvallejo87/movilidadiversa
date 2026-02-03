import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@movilidaddiversa.com'
  const password = process.env.ADMIN_PASSWORD || 'Admin@2024!'
  const name = process.env.ADMIN_NAME || 'Administrador'

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
      name,
      role: 'SUPER_ADMIN'
    }
  })

  console.log('Usuario admin creado/actualizado:')
  console.log(`  Email: ${user.email}`)
  console.log(`  Nombre: ${user.name}`)
  console.log(`  Rol: ${user.role}`)
  console.log('')
  console.log('Credenciales de acceso:')
  console.log(`  Email: ${email}`)
  console.log(`  Password: ${password}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
