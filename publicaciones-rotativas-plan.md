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

### Fase 2: Lógica de Selección en Backend ⏳ PENDIENTE
- [ ] Crear función para obtener publicaciones rotativas
- [ ] Implementar algoritmo de selección:
  - Obtener todas las publicaciones activas
  - Agrupar por proveedor
  - Seleccionar 1 por proveedor usando seed basado en fecha
  - Retornar mínimo 10 (o todas si hay menos proveedores)
- [ ] Crear endpoint `/api/publications/daily-rotation`

### Fase 3: Validación de Límites ⏳ PENDIENTE
- [ ] Implementar validación al crear publicación:
  - Verificar plan del proveedor
  - Plan Básico: máximo 5 publicaciones
  - Plan Premium/Enterprise: sin límite o límite mayor
- [ ] Retornar error apropiado si se excede el límite

### Fase 4: Actualizar Frontend ⏳ PENDIENTE
- [ ] Cambiar endpoint en landing.tsx a `/api/publications/daily-rotation`
- [ ] Ajustar UI para mostrar las 10+ publicaciones
- [ ] Mantener diseño responsive

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
**Fase activa**: Fase 2 - Lógica de Selección en Backend
**Última actualización**: 2025-10-08
