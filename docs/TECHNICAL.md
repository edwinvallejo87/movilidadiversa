# Documentación Técnica - Movilidad Diversa

## Descripción General

Sistema de gestión de transporte especializado para personas con movilidad reducida. Permite la administración de citas, clientes, conductores, tarifas y generación de cotizaciones.

## Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 16.0.10 | Framework React con App Router |
| TypeScript | 5.x | Tipado estático |
| Prisma | 5.20.0 | ORM para base de datos |
| PostgreSQL | - | Base de datos (Neon) |
| Tailwind CSS | 3.x | Estilos |
| shadcn/ui | - | Componentes UI |
| Google Maps API | - | Mapas y geocodificación |
| jsPDF | - | Generación de PDFs |

## Estructura del Proyecto

```
movilidadreducida/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   └── migrations/            # Migraciones
├── src/
│   ├── app/
│   │   ├── admin/             # Panel de administración
│   │   │   ├── calendar/      # Calendario de citas
│   │   │   ├── customers/     # Gestión de clientes
│   │   │   ├── staff/         # Gestión de conductores
│   │   │   ├── tariffs/       # Configuración de tarifas
│   │   │   ├── extras/        # Servicios adicionales y recargos
│   │   │   ├── zones/         # Zonas geográficas
│   │   │   ├── reports/       # Reportes y estadísticas
│   │   │   └── settings/      # Configuración general
│   │   ├── api/               # API Routes
│   │   │   ├── admin/         # APIs protegidas
│   │   │   ├── appointments/  # CRUD de citas
│   │   │   ├── auth/          # Autenticación
│   │   │   └── quotes/        # Cálculo de cotizaciones
│   │   └── login/             # Página de login
│   ├── components/
│   │   ├── admin/             # Componentes del admin
│   │   ├── ui/                # Componentes shadcn/ui
│   │   ├── AddressAutocomplete.tsx
│   │   ├── RouteMap.tsx
│   │   └── GoogleMapsProvider.tsx
│   └── lib/
│       ├── prisma.ts          # Cliente Prisma
│       ├── db.ts              # Alias de Prisma
│       ├── auth.ts            # Utilidades de autenticación
│       ├── api-auth.ts        # Middleware de autenticación API
│       └── generate-receipt-pdf.ts  # Generador de PDFs
├── public/
│   └── logo.jpeg              # Logo de la empresa
└── data/                      # Archivos de datos (Excel, etc.)
```

## Modelos de Base de Datos

### Principales

#### Customer (Clientes)
```prisma
model Customer {
  id                 String   @id @default(cuid())
  name               String
  email              String?  @unique
  phone              String
  document           String?
  age                Int?
  weight             Float?
  wheelchairType     String?
  emergencyContact   String?
  medicalNotes       String?
  defaultAddress     String?
  defaultLat         Float?
  defaultLng         Float?
  isActive           Boolean  @default(true)
}
```

#### Staff (Conductores + Vehículos)
```prisma
model Staff {
  id                     String   @id @default(cuid())
  name                   String
  phone                  String?
  email                  String?
  color                  String   @default("#3B82F6")
  licensePlate           String?
  vehicleModel           String?
  capacity               Int?
  isWheelchairAccessible Boolean  @default(false)
  equipmentType          String   @default("RAMPA") // RAMPA | ROBOTICA_PLEGABLE
  workDays               String   @default("1,2,3,4,5")
  workStartTime          String   @default("07:00")
  workEndTime            String   @default("19:00")
  isActive               Boolean  @default(true)
}
```

#### Appointment (Citas)
```prisma
model Appointment {
  id                    String    @id @default(cuid())
  customerId            String
  staffId               String?
  equipmentType         String    @default("RAMPA")
  originAddress         String
  originLat             Float
  originLng             Float
  destinationAddress    String
  destinationLat        Float
  destinationLng        Float
  scheduledAt           DateTime
  returnAt              DateTime? // Para viajes dobles
  estimatedDuration     Int
  distanceKm            Float
  pricingSnapshot       String    // JSON con desglose de precios
  totalAmount           Float
  status                String    @default("CONFIRMED")
  notes                 String?
}
```

### Sistema de Tarifas

#### Zone (Zonas)
```prisma
model Zone {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique  // medellin, bello-itagui-envigado, etc.
  isMetro   Boolean  @default(true)
}
```

#### Rate (Tarifas)
```prisma
model Rate {
  id              String  @id @default(cuid())
  zoneId          String
  tripType        String  // SENCILLO | DOBLE
  equipmentType   String  // RAMPA | ROBOTICA_PLEGABLE
  originType      String? // DESDE_MEDELLIN | MISMO_MUNICIPIO
  distanceRange   String? // HASTA_3KM | DE_3_A_10KM | MAS_10KM
  destinationName String? // Para fuera de ciudad
  price           Int
}
```

#### AdditionalService (Servicios Adicionales)
```prisma
model AdditionalService {
  id          String  @id @default(cuid())
  code        String  @unique
  name        String
  price       Int
  priceType   String  // FIJO | POR_HORA | POR_UNIDAD
  description String?
}
```

#### Surcharge (Recargos)
```prisma
model Surcharge {
  id          String  @id @default(cuid())
  code        String  @unique  // NOCTURNO | DOMINICAL_FESTIVO
  name        String
  price       Int
  startHour   Int?    // Para recargo nocturno (ej: 18)
  endHour     Int?    // Para recargo nocturno (ej: 6)
}
```

## APIs Principales

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Usuario actual |

### Citas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/appointments` | Listar citas |
| GET | `/api/appointments/:id` | Obtener cita |
| POST | `/api/admin/appointments` | Crear cita |
| PUT | `/api/appointments/:id` | Actualizar cita |
| DELETE | `/api/appointments/:id` | Eliminar cita |

### Cotizaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/quotes/calculate?type=zones` | Obtener zonas |
| GET | `/api/quotes/calculate?type=additional-services` | Obtener servicios |
| GET | `/api/quotes/calculate?type=surcharges` | Obtener recargos |
| POST | `/api/quotes/calculate` | Calcular cotización |

### Clientes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/clients` | Listar clientes (paginado) |
| POST | `/api/admin/clients` | Crear cliente |
| PUT | `/api/admin/clients/:id` | Actualizar cliente |
| DELETE | `/api/admin/clients/:id` | Eliminar cliente |

### Conductores

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/staff` | Listar conductores |
| POST | `/api/admin/staff` | Crear conductor |
| PUT | `/api/admin/staff/:id` | Actualizar conductor |
| DELETE | `/api/admin/staff/:id` | Eliminar conductor |

## Sistema de Cotizaciones

El cálculo de cotizaciones sigue esta lógica:

1. **Detectar zona** desde las direcciones (origen/destino)
2. **Buscar tarifa base** según:
   - Zona
   - Tipo de viaje (SENCILLO/DOBLE)
   - Tipo de equipo (RAMPA/ROBOTICA_PLEGABLE)
   - Tipo de origen (DESDE_MEDELLIN/MISMO_MUNICIPIO)
   - Rango de distancia (solo Medellín)
3. **Agregar servicios adicionales** seleccionados
4. **Aplicar recargos** automáticos:
   - Nocturno (si está entre horas configuradas)
   - Dominical/Festivo (si es domingo)

## Estados de Citas

| Estado | Descripción |
|--------|-------------|
| CONFIRMED | Cita programada y confirmada |
| COMPLETED | Cita completada |
| CANCELLED | Cita cancelada |

## Variables de Entorno

```env
# Base de datos
DATABASE_URL="postgresql://..."

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIza..."

# Autenticación (opcional)
AUTH_SECRET="..."
```

## Google Maps Platform

### APIs Utilizadas

| API | Uso en la Aplicación |
|-----|---------------------|
| **Maps JavaScript API** | Mostrar el mapa interactivo en el formulario de citas |
| **Places API** | Autocompletado de direcciones y obtención de coordenadas |
| **Directions API** | Calcular rutas y distancias entre origen y destino |
| **Geocoding API** | Respaldo para conversión de direcciones a coordenadas |

### Crédito Gratuito Mensual

Google ofrece **$200 USD gratis cada mes** para Google Maps Platform. Este crédito se renueva automáticamente y es suficiente para la mayoría de aplicaciones pequeñas/medianas.

**No hay fecha de expiración** del tier gratuito - es permanente mientras Google mantenga esta política (vigente desde 2018).

### Costos por API (después del crédito de $200)

| API | Costo por 1,000 solicitudes | Solicitudes gratis/mes (~$200) |
|-----|----------------------------|-------------------------------|
| Maps JavaScript API | $7.00 | ~28,500 cargas de mapa |
| Places Autocomplete | $2.83 | ~70,600 solicitudes |
| Places Details | $17.00 | ~11,700 solicitudes |
| Directions API | $5.00 | ~40,000 rutas |
| Geocoding API | $5.00 | ~40,000 geocodificaciones |

### Uso Estimado por Cita

Cada cita creada consume aproximadamente:
- 1 carga de mapa (~$0.00025)
- 2-4 solicitudes de Autocomplete (~$0.01)
- 2 solicitudes de Places Details (~$0.03)
- 1 solicitud de Directions (~$0.005)

**Costo estimado por cita: ~$0.05 USD**

Con el crédito de $200/mes, puedes crear aproximadamente **4,000 citas mensuales gratis**.

### Configuración Requerida

1. **Crear proyecto en Google Cloud Console**:
   https://console.cloud.google.com/

2. **Habilitar las APIs**:
   - https://console.cloud.google.com/apis/library/maps-backend.googleapis.com
   - https://console.cloud.google.com/apis/library/places-backend.googleapis.com
   - https://console.cloud.google.com/apis/library/directions-backend.googleapis.com
   - https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com

3. **Crear API Key**:
   https://console.cloud.google.com/apis/credentials

4. **Configurar restricciones de dominio**:
   ```
   http://localhost:3000/*
   http://localhost:3001/*
   https://movilidadiversa.vercel.app/*
   ```

5. **Habilitar facturación** (requerido aunque uses solo el tier gratis):
   https://console.cloud.google.com/billing

### Monitoreo de Uso

Puedes monitorear el uso y costos en:
- **Dashboard de APIs**: https://console.cloud.google.com/apis/dashboard
- **Reportes de facturación**: https://console.cloud.google.com/billing

### Alertas de Presupuesto

Recomendamos configurar alertas para evitar cargos inesperados:

1. Ve a: https://console.cloud.google.com/billing/budgets
2. Crea un presupuesto de $200 USD
3. Configura alertas al 50%, 80% y 100%

### Límites de Quota

Si necesitas limitar el uso para no exceder el tier gratuito:

1. Ve a: https://console.cloud.google.com/apis/api/maps-backend.googleapis.com/quotas
2. Configura límites diarios por API

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build
npm run build

# Migraciones de base de datos
npx prisma db push
npx prisma generate

# Ver base de datos
npx prisma studio
```

## Despliegue

El proyecto está configurado para desplegar en **Vercel**:

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático en cada push a main

## Seguridad

- Autenticación basada en sesiones con cookies HttpOnly
- Middleware protege rutas `/admin/*` y `/api/admin/*`
- Passwords hasheados con bcrypt
- Validación de datos con Zod en todas las APIs
