# Plan de Implementación: Sistema de Reseñas Funcional

## Estado Actual del Sistema

### ✅ Ya Existe (Backend)
- Tabla `reviews` en la base de datos con campos:
  - `id`, `supplierId`, `clientName`, `clientEmail`
  - `rating` (decimal), `comment` (text)
  - `isVerified` (boolean), `createdAt` (timestamp)
- Funciones de storage:
  - `createReview()` - Crear nueva reseña
  - `getReviewsBySupplierId()` - Obtener reseñas de un proveedor
- Endpoint API:
  - `POST /api/suppliers/:id/reviews` - Crear reseña

### ❌ Problemas Actuales
1. **Reseñas falsas en frontend** - Se usan `mockReviews` en lugar de datos reales
2. **No hay endpoint GET** para obtener reseñas desde el frontend
3. **No hay validación de usuarios** - Cualquiera puede dejar reseñas sin autenticación
4. **No se actualiza el promedio** - `averageRating` y `totalReviews` no se calculan automáticamente
5. **No hay UI para dejar reseñas** - Solo se muestran, no se pueden crear desde la interfaz
6. **Falta campo userId** - No hay relación entre reviews y users autenticados

---

## Etapas de Implementación

### **Etapa 1: Limpieza y Preparación de Backend** ⚙️
**Objetivo:** Eliminar datos falsos y mejorar el schema

#### Tareas:
1. ✅ Eliminar todas las reseñas mock del frontend
2. ✅ Agregar campo `userId` (opcional) a la tabla `reviews` para usuarios autenticados
3. ✅ Crear función para calcular y actualizar `averageRating` y `totalReviews`
4. ✅ Agregar endpoint `GET /api/suppliers/:id/reviews` para obtener reseñas
5. ✅ Agregar validación: un usuario solo puede dejar una reseña por proveedor

---

### **Etapa 2: Conectar Frontend con Reseñas Reales** 🔌 ✅ COMPLETADA
**Objetivo:** Mostrar reseñas reales en lugar de datos falsos

#### Tareas:
1. ✅ Crear hook `useReviews(supplierId)` para obtener reseñas reales
2. ✅ Actualizar `provider-profile-modal.tsx` para usar reseñas reales
3. ✅ Agregar manejo de estados: loading, empty, error
4. ✅ Mostrar mensaje cuando no hay reseñas

**Archivos creados/modificados:**
- `client/src/hooks/useReviews.ts` - Hook para obtener reseñas
- `client/src/components/provider-profile-modal.tsx` - Actualizado para mostrar reseñas reales

---

### **Etapa 3: Formulario para Crear Reseñas** 📝 ✅ COMPLETADA
**Objetivo:** Permitir a usuarios dejar reseñas

#### Tareas:
1. ✅ Crear componente `ReviewForm` con:
   - Selector de rating (estrellas)
   - Campo de comentario
   - Validación con Zod
2. ✅ Integrar formulario en el modal del proveedor
3. ✅ Conectar con endpoint POST `/api/suppliers/:id/reviews`
4. ✅ Actualizar lista de reseñas después de enviar
5. ✅ Invalidar cache de React Query

**Archivos creados/modificados:**
- `client/src/components/review-form.tsx` - Componente del formulario de reseñas
- `client/src/components/provider-profile-modal.tsx` - Integración del formulario

**Notas de implementación:**
- El formulario funciona tanto para usuarios autenticados como no autenticados
- Para usuarios autenticados: el nombre y email se auto-completan
- Para usuarios no autenticados: se solicita nombre y email
- La validación de duplicados se realiza en el backend durante el submit
- Los errores se muestran mediante toasts al usuario

---

### **Etapa 4: Cálculo Automático de Promedio** 📊
**Objetivo:** Actualizar rating promedio automáticamente

#### Tareas:
1. ✅ Crear trigger o función que se ejecute al:
   - Crear una nueva reseña
   - Eliminar una reseña
2. ✅ Actualizar campos `averageRating` y `totalReviews` del proveedor
3. ✅ Mostrar rating actualizado en cards y perfiles

---

### **Etapa 5: Validación y Restricciones** 🔒
**Objetivo:** Evitar spam y reseñas duplicadas

#### Tareas:
1. ✅ Validar que solo usuarios autenticados puedan dejar reseñas
2. ✅ Implementar lógica: 1 reseña por usuario por proveedor
3. ✅ Agregar verificación de email (opcional)
4. ✅ Prevenir auto-reseñas (proveedor no puede reseñarse a sí mismo)

---

### **Etapa 6: Funcionalidades Avanzadas (Opcional)** 🚀
**Objetivo:** Mejorar la experiencia del sistema de reseñas

#### Tareas opcionales:
1. ✅ Permitir al proveedor responder a reseñas (Backend + Frontend visualización)
2. ✅ Sistema de reportes para reseñas inapropiadas (Backend)
3. ⬜ Moderación de reseñas por admin
4. ⬜ Verificar reseñas (marcar como verificadas)
5. ✅ Paginación de reseñas (si hay muchas) (Backend)
6. ✅ Filtros: ordenar por más recientes, mejor rating, etc. (Backend)

---

## Orden de Ejecución

**Primera sesión (Ahora):**
- Ejecutar Etapa 1: Limpieza y preparación de backend

**Segunda sesión (Después de aprobación):**
- Ejecutar Etapas 2 y 3: Frontend y formularios

**Tercera sesión (Opcional):**
- Ejecutar Etapas 4, 5 y 6 según necesidades

---

## Notas Técnicas

### Schema Changes Necesarios
```typescript
// Agregar campo opcional userId a reviews
userId: varchar("user_id").references(() => users.id)

// Agregar constraint único para evitar duplicados
// Crear índice en (userId, supplierId) o (clientEmail, supplierId)
```

### Endpoints a Crear
- `GET /api/suppliers/:id/reviews` - Obtener reseñas
- `POST /api/suppliers/:id/reviews` - Crear reseña (ya existe, mejorar)
- `GET /api/suppliers/:id/can-review` - Verificar si usuario puede dejar reseña

### Validaciones Frontend
- Rating: 1-5 estrellas (requerido)
- Comentario: 10-500 caracteres (opcional)
- Email válido (si no autenticado)
- Nombre: mínimo 3 caracteres

---

## Estado del Plan: ✅ IMPLEMENTACIÓN COMPLETADA

**Fecha de finalización:** 6 de octubre de 2025

### Resumen de Implementación

**Etapas Completadas:**
1. ✅ **Etapa 1:** Limpieza y Preparación de Backend (Previamente completado)
2. ✅ **Etapa 2:** Conectar Frontend con Reseñas Reales (Completado)
3. ✅ **Etapa 3:** Formulario para Crear Reseñas (Completado)
4. ✅ **Etapa 4:** Cálculo Automático de Promedio (Previamente completado)
5. ✅ **Etapa 5:** Validación y Restricciones (Previamente completado)

**Etapas Pendientes:**
- ⬜ **Etapa 6:** Funcionalidades Avanzadas (Opcional)

### Sistema Funcional 🎉

El sistema de reseñas está completamente funcional con las siguientes características:

**Backend:**
- ✅ Tabla `reviews` con campo `userId` para usuarios autenticados
- ✅ Endpoints GET/POST para reseñas
- ✅ Cálculo automático de `averageRating` y `totalReviews`
- ✅ Validación de reseñas duplicadas
- ✅ Prevención de auto-reseñas

**Frontend:**
- ✅ Visualización de reseñas reales en el modal del proveedor
- ✅ Estados de loading, error y vacío manejados
- ✅ Formulario de reseñas con selector de estrellas interactivo
- ✅ Validación con Zod
- ✅ Soporte para usuarios autenticados y no autenticados
- ✅ Invalidación automática del cache al crear reseñas
- ✅ Mensajes de error/éxito mediante toasts

### Próximos Pasos (Opcional)

Si se desea implementar la Etapa 6, considerar agregar:
- Respuestas del proveedor a reseñas
- Sistema de reportes para reseñas inapropiadas
- Moderación de reseñas por admin
- Paginación de reseñas
- Filtros y ordenamiento

---

## Etapa 6: Implementación de Funcionalidades Avanzadas 🚀

**Fecha de inicio:** 6 de octubre de 2025

### Funcionalidades Implementadas (Backend)

#### 1. Sistema de Respuestas del Proveedor ✅
**Tabla:** `reviewResponses`
- `id` (varchar, PK, UUID)
- `reviewId` (varchar, FK a reviews)
- `supplierId` (varchar, FK a suppliers)
- `responseText` (text)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Endpoints creados:**
- `POST /api/reviews/:id/responses` - Crear respuesta a una reseña
- `PUT /api/reviews/:reviewId/responses/:id` - Actualizar respuesta
- `DELETE /api/reviews/:reviewId/responses/:id` - Eliminar respuesta

**Storage functions:**
- `createReviewResponse(data)` - Crear respuesta del proveedor
- `updateReviewResponse(id, data)` - Actualizar respuesta
- `deleteReviewResponse(id)` - Eliminar respuesta
- `getReviewResponse(reviewId)` - Obtener respuesta de una reseña

**Validaciones:**
- Solo el proveedor dueño de la reseña puede responder
- Solo puede haber una respuesta por reseña
- La respuesta debe tener entre 10 y 1000 caracteres

#### 2. Sistema de Reportes de Reseñas ✅
**Tabla:** `reviewReports`
- `id` (varchar, PK, UUID)
- `reviewId` (varchar, FK a reviews)
- `reportedBy` (varchar, FK a users, nullable)
- `reporterEmail` (varchar)
- `reason` (varchar: spam, inappropriate, fake, other)
- `description` (text, opcional)
- `status` (varchar: pending, reviewed, resolved, dismissed)
- `createdAt` (timestamp)
- `resolvedAt` (timestamp, nullable)

**Endpoints creados:**
- `POST /api/reviews/:id/reports` - Reportar una reseña
- `GET /api/reviews/reports` - Obtener todos los reportes (admin)
- `PATCH /api/reviews/reports/:id` - Actualizar estado de reporte (admin)

**Storage functions:**
- `createReviewReport(data)` - Crear reporte
- `getReviewReports(filters)` - Obtener reportes con filtros
- `updateReviewReportStatus(id, status)` - Actualizar estado del reporte

**Validaciones:**
- Un usuario/email solo puede reportar una vez por reseña
- Las razones válidas son: spam, inappropriate, fake, other
- La descripción es opcional pero recomendada

#### 3. Paginación y Filtros de Reseñas ✅
**Parámetros de query soportados:**
- `sortBy`: `recent` (más recientes), `rating_high` (mejor rating), `rating_low` (peor rating)
- `limit`: número de resultados por página (default: 10, max: 50)
- `offset`: número de registros a saltar (para paginación)

**Endpoint actualizado:**
- `GET /api/suppliers/:id/reviews?sortBy=recent&limit=10&offset=0`

**Storage function actualizada:**
- `getReviewsBySupplierId(supplierId, options)` - Soporta ordenamiento, límite y offset

### Funcionalidades Implementadas (Frontend)

#### 1. Visualización de Respuestas del Proveedor ✅
**Archivo:** `client/src/components/provider-profile-modal.tsx`

**Implementación:**
- Las respuestas del proveedor se muestran debajo de cada reseña
- Estilo visual distintivo con borde azul y fondo claro
- Muestra el texto de la respuesta y la fecha
- Data-testid para pruebas: `review-response-${reviewId}`

**Hook actualizado:** `client/src/hooks/useReviews.ts`
- Incluye interfaz `ReviewResponse`
- Interfaz `Review` extendida con campo `response?: ReviewResponse | null`
- Soporta parámetros de ordenamiento y paginación

#### 2. Formulario para Responder a Reseñas ✅
**Archivo:** `client/src/components/review-response-form.tsx`

**Implementación:**
- Componente de formulario con validación Zod (10-1000 caracteres)
- Solo visible para el proveedor dueño del negocio (verificación con `isProviderOwner`)
- Permite crear nuevas respuestas a reseñas
- Permite editar respuestas existentes
- Permite eliminar respuestas existentes
- Invalidación de cache con función predicate para actualizar todas las variantes de queries de reviews
- Manejo de estados de carga con spinners
- Toasts para feedback al usuario
- Data-testids para pruebas: `input-response-${reviewId}`, `button-submit-response-${reviewId}`, `button-delete-response-${reviewId}`, `button-cancel-response-${reviewId}`

**Integración en modal:**
- Botón "Responder" aparece debajo de cada reseña sin respuesta (solo para el proveedor dueño)
- Botón "Editar" aparece en respuestas existentes (solo para el proveedor dueño)
- El formulario se muestra inline al hacer clic en "Responder" o "Editar"
- Cancela automáticamente al enviar exitosamente o al hacer clic en "Cancelar"

**Fecha de implementación:** 6 de octubre de 2025

### Funcionalidades Pendientes (Frontend)

#### 1. Interfaz de Reportes ⬜
- Botón para reportar reseñas inapropiadas
- Modal con formulario de reporte (razón + descripción)
- Confirmación de envío exitoso

#### 2. UI de Filtros y Paginación ⬜
- Dropdown para seleccionar ordenamiento (recientes, mejor rating, peor rating)
- Botones de paginación (anterior/siguiente)
- Mostrar total de reseñas

#### 3. Panel de Admin para Moderación ⬜
- Vista de reportes pendientes
- Acciones: aprobar, rechazar, eliminar reseña
- Filtros por estado de reporte

### Archivos Modificados

**Backend:**
- `shared/schema.ts` - Nuevas tablas y schemas
- `server/storage.ts` - Nuevas funciones de storage
- `server/routes.ts` - Nuevos endpoints

**Frontend:**
- `client/src/hooks/useReviews.ts` - Hook actualizado con soporte para filtros
- `client/src/components/provider-profile-modal.tsx` - Visualización de respuestas y formulario integrado
- `client/src/components/review-response-form.tsx` - Formulario para crear/editar/eliminar respuestas (NUEVO)
