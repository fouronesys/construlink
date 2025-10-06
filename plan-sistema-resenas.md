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

### **Etapa 2: Conectar Frontend con Reseñas Reales** 🔌
**Objetivo:** Mostrar reseñas reales en lugar de datos falsos

#### Tareas:
1. ✅ Crear hook `useReviews(supplierId)` para obtener reseñas reales
2. ✅ Actualizar `provider-profile-modal.tsx` para usar reseñas reales
3. ✅ Agregar manejo de estados: loading, empty, error
4. ✅ Mostrar mensaje cuando no hay reseñas

---

### **Etapa 3: Formulario para Crear Reseñas** 📝
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
1. ⬜ Permitir al proveedor responder a reseñas
2. ⬜ Sistema de reportes para reseñas inapropiadas
3. ⬜ Moderación de reseñas por admin
4. ⬜ Verificar reseñas (marcar como verificadas)
5. ⬜ Paginación de reseñas (si hay muchas)
6. ⬜ Filtros: ordenar por más recientes, mejor rating, etc.

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

## Estado del Plan: LISTO PARA EJECUTAR ✅
**Próximo paso:** Ejecutar Etapa 1
