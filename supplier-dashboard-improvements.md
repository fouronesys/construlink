# Plan de Mejoras - Panel de Proveedores

**Fecha**: 13 de Octubre, 2025
**Objetivo**: Implementar funcionalidades faltantes en el panel de proveedores para gestión de publicaciones, anuncios, banners y logo de empresa.

## Estado Actual

### Esquemas Existentes (shared/schema.ts)
- ✅ `supplierPublications` - Publicaciones de proveedores
- ✅ `paidAdvertisements` - Anuncios de paga
- ✅ `advertisementRequests` - Solicitudes de anuncios
- ✅ `supplierBanners` - Banners de paga  
- ✅ `suppliers.profileImageUrl` - Logo de empresa

### Funcionalidades Faltantes en el Dashboard
1. ❌ Modal para crear/editar publicaciones
2. ❌ Modal para solicitar anuncios de paga
3. ❌ Modal para solicitar banners de paga
4. ❌ Modal para actualizar logo de empresa
5. ❌ Listado y gestión de publicaciones existentes
6. ❌ Listado de solicitudes de anuncios
7. ❌ Listado de banners activos

## Fases de Implementación

### Fase 1: Backend - Endpoints para Publicaciones
**Archivos**: `server/routes.ts`, `server/storage.ts`

**Endpoints a crear**:
- `GET /api/supplier/publications` - Listar publicaciones del proveedor
- `POST /api/supplier/publications` - Crear nueva publicación
- `PATCH /api/supplier/publications/:id` - Editar publicación
- `DELETE /api/supplier/publications/:id` - Eliminar publicación
- `POST /api/supplier/publications/:id/upload-image` - Subir imagen para publicación

**Storage Interface**:
```typescript
// Agregar a IStorage
getSupplierPublications(supplierId: string): Promise<Publication[]>
createPublication(data: InsertPublication): Promise<Publication>
updatePublication(id: string, data: Partial<InsertPublication>): Promise<Publication>
deletePublication(id: string): Promise<void>
```

### Fase 2: Backend - Endpoints para Anuncios y Banners
**Archivos**: `server/routes.ts`, `server/storage.ts`

**Endpoints a crear**:
- `GET /api/supplier/advertisement-requests` - Listar solicitudes de anuncios
- `POST /api/supplier/advertisement-requests` - Crear solicitud de anuncio
- `GET /api/supplier/banners` - Listar banners del proveedor
- `POST /api/supplier/banners/request` - Solicitar nuevo banner de paga
- `POST /api/supplier/banners/:id/upload-image` - Subir imagen para banner

**Storage Interface**:
```typescript
// Agregar a IStorage
getSupplierAdvertisementRequests(supplierId: string): Promise<AdvertisementRequest[]>
createAdvertisementRequest(data: InsertAdvertisementRequest): Promise<AdvertisementRequest>
getSupplierBanners(supplierId: string): Promise<Banner[]>
createBannerRequest(data: any): Promise<any>
```

### Fase 3: Backend - Endpoint para Logo de Empresa
**Archivos**: `server/routes.ts`, `server/storage.ts`

**Endpoints a crear**:
- `POST /api/supplier/upload-logo` - Subir/actualizar logo de empresa
- `DELETE /api/supplier/logo` - Eliminar logo

**Storage Interface**:
```typescript
// Agregar a IStorage  
updateSupplierLogo(supplierId: string, logoUrl: string): Promise<Supplier>
deleteSupplierLogo(supplierId: string): Promise<Supplier>
```

### Fase 4: Frontend - Modales de Publicaciones
**Archivo**: `client/src/pages/supplier-dashboard.tsx`

**Componentes a crear**:
1. **Modal de Nueva Publicación**
   - Formulario con: título, contenido, categoría, imagen
   - Upload de imagen con preview
   - Validación con Zod
   - Botón en tab "Publicaciones"

2. **Modal de Editar Publicación**
   - Mismo formulario pre-poblado
   - Permite cambiar imagen

3. **Tabla de Publicaciones**
   - Lista con título, categoría, fecha, estado, vistas
   - Acciones: Ver, Editar, Eliminar
   - Paginación

### Fase 5: Frontend - Modales de Anuncios y Banners
**Archivo**: `client/src/pages/supplier-dashboard.tsx`

**Componentes a crear**:
1. **Modal de Solicitud de Anuncio**
   - Seleccionar publicación existente
   - Duración (días)
   - Presupuesto estimado
   - Estado de aprobación

2. **Modal de Solicitud de Banner**
   - Tipo de dispositivo (desktop/tablet/mobile)
   - Título y descripción
   - Link URL
   - Upload de imagen según especificaciones
   - Nota: "Sujeto a aprobación por administrador"

3. **Tabla de Solicitudes**
   - Estado (pendiente/aprobado/rechazado)
   - Fecha de solicitud
   - Notas del admin

### Fase 6: Frontend - Modal de Logo
**Archivo**: `client/src/pages/supplier-dashboard.tsx`

**Componente a crear**:
1. **Modal de Logo de Empresa**
   - Preview del logo actual (si existe)
   - Upload de nuevo logo
   - Validación: solo imágenes, tamaño máximo
   - Botón eliminar (si existe logo)
   - Recomendaciones: tamaño, formato

### Fase 7: Integración y Validaciones
**Archivos**: Varios

**Tareas**:
1. Agregar schemas Zod para validaciones
2. Conectar mutations con React Query
3. Invalidación de caché apropiada
4. Mensajes de éxito/error con toasts
5. Estados de carga (loading/pending)
6. Manejo de errores robusto

### Fase 8: Upload de Imágenes
**Consideraciones**:
- Usar sistema de upload existente (multer en backend)
- Validar tipos de archivo (jpg, png, webp)
- Validar tamaño máximo (configurar por tipo)
- Almacenar en directorio público
- Retornar URL pública

**Especificaciones de imágenes**:
- **Logo**: 500x500px max, formato cuadrado preferido
- **Publicaciones**: 1200x630px recomendado
- **Banners Desktop**: 1920x400px
- **Banners Tablet**: 1024x300px  
- **Banners Mobile**: 768x300px
- **Anuncios**: 600x400px

### Fase 9: Pruebas y Ajustes
**Tareas**:
1. Probar flujo completo de publicaciones
2. Probar flujo de solicitud de anuncios
3. Probar flujo de solicitud de banners
4. Probar cambio de logo
5. Verificar permisos y autorizaciones
6. Validar límites de plan (si aplican)
7. Testing de UI/UX
8. Ajustes de diseño responsive

## Esquemas TypeScript Necesarios

### Publicación
```typescript
interface Publication {
  id: string;
  supplierId: string;
  title: string;
  content: string;
  imageUrl?: string;
  category?: string;
  isActive: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

const publicationSchema = z.object({
  title: z.string().min(3, "Título mínimo 3 caracteres").max(255),
  content: z.string().min(10, "Contenido mínimo 10 caracteres"),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
});
```

### Solicitud de Anuncio
```typescript
interface AdvertisementRequest {
  id: string;
  supplierId: string;
  publicationId: string;
  requestedDuration: number; // días
  budget: number;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
}

const adRequestSchema = z.object({
  publicationId: z.string().uuid(),
  requestedDuration: z.number().min(1).max(90),
  budget: z.number().min(100),
});
```

### Banner Request
```typescript
interface BannerRequest {
  deviceType: 'desktop' | 'tablet' | 'mobile';
  title?: string;
  description?: string;
  linkUrl?: string;
  imageUrl: string;
  displayOrder?: number;
}

const bannerRequestSchema = z.object({
  deviceType: z.enum(['desktop', 'tablet', 'mobile']),
  title: z.string().max(100).optional(),
  description: z.string().max(255).optional(),
  linkUrl: z.string().url().optional(),
});
```

## Notas Técnicas

### Autenticación
- Verificar que user.role === 'supplier'
- Validar que el supplierId pertenece al usuario autenticado

### Permisos
- Solo el proveedor puede gestionar sus propias publicaciones
- Admin puede ver/aprobar todas las solicitudes
- Banners y anuncios requieren aprobación de admin

### Límites de Plan (Futuro)
- Basic: X publicaciones, sin anuncios de paga
- Professional: Y publicaciones, Z anuncios
- Enterprise: Ilimitado

### UI/UX
- Usar componentes shadcn existentes
- Mantener consistencia con diseño actual
- Preview antes de publicar
- Confirmaciones para eliminar
- Estados de carga claros

## Orden de Ejecución

1. ✅ **Fase 1**: Endpoints publicaciones (Backend) - **COMPLETADO**
   - GET /api/supplier/publications
   - POST /api/supplier/publications (con validación de plan)
   - PATCH /api/supplier/publications/:id (con verificación de propiedad)
   - DELETE /api/supplier/publications/:id (con verificación de propiedad)
   
2. ✅ **Fase 2**: Endpoints anuncios/banners (Backend) - **COMPLETADO**
   - GET /api/supplier/advertisement-requests (listar solicitudes del proveedor)
   - POST /api/supplier/advertisement-requests (crear solicitud de anuncio con validación)
   - GET /api/supplier/banners (listar banners del proveedor)
   - POST /api/supplier/banners/request (solicitar banner - requiere aprobación de admin)
   
3. ✅ **Fase 3**: Endpoint logo (Backend) - **COMPLETADO**
   - POST /api/supplier/upload-logo (subir/actualizar logo con multer)
   - DELETE /api/supplier/logo (eliminar logo del proveedor)
   - Métodos storage: updateSupplierLogo, deleteSupplierLogo
   
4. ⏳ **Fase 4**: Modales publicaciones (Frontend)
5. ⏳ **Fase 5**: Modales anuncios/banners (Frontend)
6. ⏳ **Fase 6**: Modal logo (Frontend)
7. ⏳ **Fase 7**: Integración completa
8. ⏳ **Fase 8**: Sistema upload imágenes
9. ⏳ **Fase 9**: Pruebas finales

---

**Status**: Fases 1-3 Backend completadas - Iniciando Fase 4 Frontend
**Última actualización**: 2025-10-13 19:12
