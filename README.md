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
- **Base de Datos**: PostgreSQL
- **Maps API**: Google Maps (Distance Matrix + Directions)
- **UI Components**: Radix UI + shadcn/ui
- **Testing**: Jest + Testing Library

## 🛠️ Instalación

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**
   
   Editar `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/movilidadreducida?schema=public"
   GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"
   NEXTAUTH_SECRET="your_nextauth_secret_here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Configurar base de datos**
   ```bash
   # Generar cliente Prisma
   npm run db:generate
   
   # Ejecutar migraciones
   npm run db:migrate
   
   # Sembrar datos de ejemplo
   npm run db:seed
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

---

**Desarrollado para mejorar la movilidad inclusiva en Colombia** 🇨🇴
