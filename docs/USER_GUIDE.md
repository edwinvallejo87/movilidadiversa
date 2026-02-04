# Guía de Usuario - Movilidad Diversa

## Introducción

Movilidad Diversa es un sistema de gestión para servicios de transporte especializado en personas con movilidad reducida. Esta guía le ayudará a utilizar todas las funcionalidades del sistema.

---

## Acceso al Sistema

### Iniciar Sesión

1. Ingrese a la URL del sistema
2. Escriba su correo electrónico
3. Escriba su contraseña
4. Haga clic en "Iniciar Sesión"

### Cerrar Sesión

1. Haga clic en su nombre en la esquina superior derecha
2. Seleccione "Cerrar Sesión"

---

## Panel Principal (Dashboard)

El panel principal muestra:

- **Citas Programadas Hoy**: Número de citas del día
- **Vehículos Disponibles**: Conductores activos
- **Clientes Registrados**: Total de clientes en el sistema
- **Ingresos del Mes**: Suma de servicios completados

### Accesos Rápidos

- **Calendario**: Ver todas las citas
- **Nueva Cita**: Crear una cita rápidamente
- **Reportes**: Ver estadísticas del negocio

---

## Calendario de Citas

### Navegación

- Use las flechas **← →** para moverse entre fechas
- Haga clic en **Hoy** para volver a la fecha actual
- Cambie la vista: **Día**, **Semana** o **Mes**

### Crear una Cita

1. Haga clic en cualquier espacio vacío del calendario
2. Complete el formulario:

#### Datos del Cliente
- Busque el cliente por nombre, cédula o teléfono
- Si no existe, haga clic en **+ Nuevo** para crearlo

#### Conductor
- Seleccione el conductor disponible
- El tipo de equipo (Rampa/Robótica) se asigna automáticamente

#### Direcciones
- Escriba la dirección de origen (donde recoger)
- Escriba la dirección de destino (donde llevar)
- El mapa muestra la ruta automáticamente
- La distancia se calcula automáticamente

#### Tipo de Viaje
- **Sencillo**: Solo ida
- **Doble**: Ida y vuelta (aparece campo para hora de regreso)

#### Servicios Adicionales
- Seleccione extras como: Espera, Silla robótica, Acompañante, etc.
- Cada servicio tiene su precio

#### Precio
- El sistema calcula automáticamente según:
  - Zona geográfica
  - Tipo de viaje
  - Tipo de equipo
  - Distancia
  - Servicios adicionales
  - Recargos (nocturno, dominical)

3. Haga clic en **Crear Cita**

### Ver Detalles de una Cita

1. Haga clic en la cita en el calendario
2. Verá:
   - Datos del cliente
   - Ruta (origen → destino)
   - Conductor asignado
   - Precio total

### Acciones sobre una Cita

- **Marcar Completada**: Cuando el servicio terminó
- **Cancelar**: Si el cliente cancela (mantiene registro)
- **Eliminar**: Borra permanentemente la cita
- **Editar**: Modificar cualquier dato
- **Recibo PDF**: Descargar orden de servicio
- **WhatsApp**: Enviar detalles al conductor

### Enviar Orden por WhatsApp

1. Abra los detalles de la cita
2. Haga clic en **WhatsApp**
3. Se abrirá WhatsApp con el mensaje listo
4. El mensaje incluye:
   - Fecha y hora
   - Datos del cliente
   - Direcciones
   - Tipo de vehículo
   - Servicios adicionales
   - Datos del pasajero

---

## Gestión de Clientes

### Ver Clientes

1. Vaya a **Clientes** en el menú lateral
2. Verá la lista paginada (20 por página)
3. Use el buscador para encontrar clientes

### Crear Cliente

1. Haga clic en **Nuevo Cliente**
2. Complete los datos:
   - **Nombre** (obligatorio)
   - **Teléfono** (obligatorio)
   - **Cédula**
   - **Email**
   - **Edad**
   - **Peso** (en kg)
   - **Tipo de silla de ruedas**
   - **Contacto de emergencia**
   - **Dirección por defecto**
3. Haga clic en **Guardar**

### Editar Cliente

1. Haga clic en el ícono de editar (lápiz)
2. Modifique los datos
3. Haga clic en **Guardar**

### Eliminar Cliente

1. Haga clic en el ícono de eliminar (papelera)
2. Confirme la eliminación

---

## Gestión de Conductores

### Ver Conductores

1. Vaya a **Conductores** en el menú lateral
2. Verá la lista con:
   - Nombre
   - Placa del vehículo
   - Tipo de equipo
   - Estado

### Crear Conductor

1. Haga clic en **Nuevo Conductor**
2. Complete los datos:
   - **Nombre** (obligatorio)
   - **Teléfono**
   - **Email**
   - **Número de licencia**
   - **Placa del vehículo**
   - **Modelo del vehículo**
   - **Tipo de equipo**: Rampa o Robótica/Plegable
   - **Color**: Para identificar en el calendario
   - **Horario de trabajo**
3. Haga clic en **Guardar**

---

## Configuración de Tarifas

### Zonas

Las zonas disponibles son:
- **Medellín**: Tarifas por distancia (hasta 3km, 3-10km, más de 10km)
- **Bello/Itagüí/Envigado**: Por origen (desde Medellín o mismo municipio)
- **Sabaneta**: Por origen
- **La Estrella/Caldas**: Por origen
- **Fuera de Ciudad**: Destinos específicos (Aeropuerto, Rionegro, etc.)

### Editar Tarifas

1. Vaya a **Tarifas** en el menú lateral
2. Seleccione la zona
3. Edite los precios según:
   - Tipo de viaje (Sencillo/Doble)
   - Tipo de equipo (Rampa/Robótica)
4. Haga clic en **Guardar**

---

## Servicios Adicionales (Extras)

### Ver Servicios

1. Vaya a **Extras** en el menú lateral
2. Pestaña **Servicios Adicionales**

### Crear Servicio

1. Haga clic en **Nuevo Servicio**
2. Complete:
   - **Código**: Identificador único (ej: ESPERA)
   - **Nombre**: Nombre visible
   - **Precio**
   - **Tipo de precio**: Fijo, Por hora, Por unidad
3. Haga clic en **Guardar**

---

## Recargos

### Tipos de Recargos

- **Nocturno**: Aplica en horario nocturno (configurable)
- **Dominical/Festivo**: Aplica los domingos

### Configurar Horario Nocturno

1. Vaya a **Extras** → pestaña **Recargos**
2. Edite el recargo **Nocturno**
3. Configure:
   - **Hora inicio**: Ej: 18 (6 PM)
   - **Hora fin**: Ej: 6 (6 AM)
   - **Precio del recargo**
4. Haga clic en **Guardar**

---

## Reportes

### Ver Estadísticas

1. Vaya a **Reportes** en el menú lateral
2. Seleccione el período:
   - Últimos 7 días
   - Últimos 30 días
   - Últimos 3 meses
   - Últimos 6 meses
   - Último año

### Métricas Disponibles

- **Total de citas**
- **Ingresos totales**
- **Promedio de rating**
- **Tasa de completadas**
- **Distribución por estado** (Programadas, Completadas, Canceladas)
- **Servicios más solicitados**
- **Rendimiento por conductor**
- **Tendencias mensuales**

---

## Descargar Recibo PDF

El recibo PDF incluye:
- Logo de la empresa
- Número de orden
- Datos del cliente
- Fecha y hora del servicio
- Hora de regreso (si aplica)
- Ruta (origen → destino)
- Desglose de precios
- Total
- Información de contacto

### Descargar

1. Abra los detalles de la cita
2. Haga clic en **Recibo PDF**
3. El archivo se descargará automáticamente

---

## Preguntas Frecuentes

### ¿Cómo cambio mi contraseña?
Contacte al administrador del sistema.

### ¿Por qué no aparece el precio?
Verifique que:
- Existe una tarifa configurada para esa zona
- El conductor tiene un tipo de equipo asignado
- Las direcciones están correctas

### ¿Puedo editar una cita completada?
Sí, puede editar cualquier cita desde el botón Editar.

### ¿Las citas canceladas se eliminan?
No, las citas canceladas se mantienen para estadísticas. Use "Eliminar" para borrar permanentemente.

### ¿El recargo nocturno se aplica automáticamente?
Sí, el sistema detecta automáticamente si la hora de la cita está dentro del horario nocturno configurado.

---

## Soporte

Para soporte técnico:
- **WhatsApp**: 314 829 8976
- **Email**: movilidadiversa@gmail.com
