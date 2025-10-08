# Plan de Implementación: Sistema de Publicaciones Rotativas

## Objetivo
Implementar un sistema que muestre publicaciones de proveedores de forma equitativa y rotativa en la página principal.

## Requisitos
- ✅ Mostrar mínimo 10 publicaciones por día
- ✅ Máximo 1 publicación por proveedor visible al mismo tiempo
- ✅ Rotación diaria automática basada en la fecha
- ✅ Los proveedores del plan básico pueden crear hasta 5 publicaciones
- ✅ Distribución equitativa de visibilidad

## Fases de Implementación

### Fase 1: Actualizar Schema y Validaciones ✅ COMPLETADA
- [x] Añadir validación de límite de publicaciones por plan en el schema
- [x] Verificar que el campo de plan existe en suppliers
- [x] Actualizar tipos TypeScript

**Notas de implementación:**
- Los límites están definidos en `shared/plan-limits.ts` con funciones `getPublicationLimit()` y `canCreatePublication()`
- El campo `plan` existe en la tabla `subscriptions` con valores: basic, professional, enterprise
- Los tipos TypeScript `SupplierPublication` e `InsertSupplierPublication` ya están definidos en `shared/schema.ts`

### Fase 2: Lógica de Selección en Backend ✅ COMPLETADA
- [x] Crear función para obtener publicaciones rotativas
- [x] Implementar algoritmo de selección:
  - Obtener todas las publicaciones activas
  - Agrupar por proveedor
  - Seleccionar 1 por proveedor usando seed basado en fecha
  - Retornar mínimo 10 (o todas si hay menos proveedores)
- [x] Crear endpoint `/api/publications/daily-rotation`

**Notas de implementación:**
- La función `getDailyRotationPublications()` ya estaba implementada en `server/storage.ts`
- Implementa el algoritmo de rotación usando seed de fecha: `new Date().toISOString().split('T')[0]`
- El índice se calcula con: `(dateSeed + supplierSeed) % pubs.length`
- Creado endpoint GET `/api/publications/daily-rotation` en `server/routes.ts`

### Fase 3: Validación de Límites ✅ COMPLETADA
- [x] Implementar validación al crear publicación:
  - Verificar plan del proveedor
  - Plan Básico: máximo 5 publicaciones
  - Plan Premium/Enterprise: sin límite o límite mayor
- [x] Retornar error apropiado si se excede el límite

**Notas de implementación:**
- Validación implementada en endpoint POST `/api/suppliers/publications`
- Se obtiene el plan a través de la suscripción del proveedor
- Se usa `canCreatePublication()` de `shared/plan-limits.ts` para validar
- Error 403 con mensaje claro al exceder límite: "Has alcanzado el límite de X publicaciones para tu plan"

### Fase 4: Actualizar Frontend ✅ COMPLETADA
- [x] Cambiar endpoint en landing.tsx a `/api/publications/daily-rotation`
- [x] Ajustar UI para mostrar las 10+ publicaciones
- [x] Mantener diseño responsive

**Notas de implementación:**
- Cambiado queryKey de `/api/publications` a `/api/publications/daily-rotation` en `client/src/pages/landing.tsx`
- Eliminado límite de `.slice(0, 6)` para mostrar todas las publicaciones rotativas
- El diseño responsive (grid 2 columnas en tablet, 3 en desktop) ya soporta 10+ publicaciones

### Fase 5: Testing y Ajustes ⏳ PENDIENTE
- [ ] Probar rotación diaria
- [ ] Verificar límites por plan
- [ ] Validar que se muestran mínimo 10 publicaciones
- [ ] Ajustar cantidad visible si es necesario

## Notas Técnicas
- **Seed para rotación**: `new Date().toISOString().split('T')[0]` - Cambia diariamente
- **Algoritmo de selección**: Usar índice calculado con hash de fecha + proveedor ID
- **Límites por plan**:
  - Básico: 5 publicaciones
  - Premium: 20 publicaciones (sugerido)
  - Enterprise: Ilimitado

## Estado Actual
**Fase activa**: Fase 5 - Testing y Ajustes
**Última actualización**: 2025-10-08
