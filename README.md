# Movilidad Diversa - Sistema de Agendamiento

Sistema de agendamiento de servicios de movilidad para personas con discapacidad con pricing dinámico completamente configurable desde el panel administrativo.

## 🚀 Características Principales

- **Pricing Dinámico Configurable**: Tarifas que se pueden modificar sin tocar código
- **Múltiples Modos de Pricing**: 
  - Precio fijo por ruta
  - Precio por kilómetro con mínimo
  - Precio por tramos de distancia
- **Recargos Configurables**: 
  - Nocturno, festivos/domingos
  - Silla robótica, pisos adicionales
  - Tiempo de espera, silla de ruedas
- **Gestión de Zonas**: Medellín, municipios, destinos especiales
- **Portal de Reservas**: Cotización en tiempo real y reserva inmediata
- **Panel Administrativo**: CRUD completo para todas las entidades de pricing
- **Importación Excel**: Carga masiva de tarifas desde archivos Excel
- **Integración Google Maps**: Cálculo automático de distancias y rutas

## 🏗️ Stack Tecnológico

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Base de Datos**: SQLite (dev) / PostgreSQL (prod)
- **Maps API**: Google Maps (opcional)
- **UI Components**: Radix UI + shadcn/ui
- **Deployment**: Vercel

## 🛠️ Instalación

### Requisitos

- Node.js 24.22.1 LTS (consulta `.nvmrc`)
- npm 11.19.1 o compatible

1. **Activar la versión de Node e instalar dependencias**
   ```bash
   nvm use
   npm install
   ```

2. **Configurar variables de entorno**
   
   Copiar y configurar variables:
   ```bash
   cp .env.example .env
   ```
   
   Editar `.env` con tus valores:
   ```env
   DATABASE_URL="file:./dev.db"
   GOOGLE_MAPS_API_KEY="" # Opcional para desarrollo
   NEXTAUTH_SECRET="tu-secreto-seguro-aqui"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Configurar base de datos**
   ```bash
   # Generar cliente Prisma y configurar DB
   npx prisma generate
   npx prisma db push
   
   # Opcional: Sembrar datos de ejemplo
   npx tsx scripts/seed_brisk_data.ts
   ```

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

   La aplicación estará disponible en `http://localhost:3000`

## 🎯 Uso del Sistema

### Portal Público
- Visitar `http://localhost:3000`
- Reservar servicios con cotización en tiempo real

### Panel Administrativo
- Visitar `http://localhost:3000/admin`
- Gestionar servicios, zonas, tarifas y recargos

## 🚀 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Desarrollo local |
| `npm run build` | Build producción |
| `npm run test` | Ejecutar tests |
| `npm run db:seed` | Sembrar datos ejemplo |
| `npm run db:import` | Importar desde Excel |

## 📥 Importación Excel

```bash
npm run db:import data/tarifas.xlsx
```

## 🚀 Deploy en Vercel

1. **Fork o Clone el repositorio**
2. **Ir a [vercel.com](https://vercel.com) e importar el proyecto**
3. **Configurar Variables de Entorno en Vercel:**
   ```
   DATABASE_URL=file:./dev.db
   NEXTAUTH_SECRET=tu-secreto-muy-seguro
   NEXTAUTH_URL=https://tu-app.vercel.app
   ```
4. **Deploy automático** ✅

### Variables de Entorno para Vercel:
- `DATABASE_URL`: Usar SQLite para simplicidad
- `NEXTAUTH_SECRET`: Genera un secreto seguro
- `NEXTAUTH_URL`: URL de tu app en Vercel
- `GOOGLE_MAPS_API_KEY`: (Opcional) Para funciones de mapas

---

**Desarrollado para mejorar la movilidad inclusiva en Colombia** 🇨🇴
