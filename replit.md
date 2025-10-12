# Verified Construction Suppliers Platform

## Overview
This is a B2B directory platform for verified construction material and service suppliers in the Dominican Republic. It features RNC validation, monthly subscription management, and administrative approval workflows. The platform aims to connect construction professionals with reliable suppliers, streamline procurement, and enhance transparency in the construction sector. It includes a product-focused main page, a pricing section, category-based directory filtering, and a business claim functionality.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Framework**: React 18 with TypeScript
- **UI Components**: Shadcn/UI with Radix UI primitives
- **Styling**: TailwindCSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation
- **Responsiveness**: Fully responsive for mobile phones and tablets.

### Technical Implementations
- **Backend**: Node.js with Express.js
- **Database ORM**: Drizzle ORM for type-safe PostgreSQL operations
- **Authentication**: Replit OpenID Connect with session-based authentication (PostgreSQL-backed)
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Deployment**: Optimized for Replit deployment with multi-stage Docker builds for CapRover.

### Feature Specifications
- **Authentication & Authorization**: Replit Auth, session management, and role-based access (client, supplier, admin, superadmin).
- **Supplier Management**: Unified registration, tiered subscription plans (Basic, Professional, Enterprise) with real-time usage validation, administrative verification workflow, and status management (pending, approved, suspended, rejected).
- **Payment System**: Multi-gateway support with Azul (primary) and Verifone for monthly recurring payments, flexible trial periods by plan, and Dominican Peso (DOP) currency. Schema supports multiple payment gateways with explicit gateway identification. Includes automatic invoice generation with NCF (Número de Comprobante Fiscal), ITBIS tax calculation (18%), fiscal reports for DGII, and PDF generation. Comprehensive admin panel for payment, refund, NCF management, and fiscal compliance. **Status**: Fases 1-4 completadas (integración Azul, suscripciones mejoradas, facturación automática con NCF).
- **Business Claim System**: Allows users to claim ownership of existing company listings through an admin-approved workflow, leading to ownership transfer and role upgrade.
- **Admin Panel**: Features include banner management, analytics dashboard (clicks, impressions, CTR with charts and CSV export), user management (role and status), and audit logging.
- **Quote Request Process**: Clients can browse and filter suppliers to submit quote requests, with notifications for suppliers.

### System Design Choices
- **Database**: PostgreSQL (via Neon serverless) with Drizzle ORM for schema management and connection pooling.
- **Shared Schema**: Centralized database schema definition.
- **Modular Architecture**: Clear separation between frontend and backend.
- **Robust Validation**: Zod used for all form and API validations.

## Recent Changes

### 2025-10-12: Corrección de Problemas de Seguridad Críticos - Fase 1 ✅
- **Configuración SSL/TLS segura** (`server/db.ts`):
  - Configuración condicional de SSL: `NODE_TLS_REJECT_UNAUTHORIZED='0'` solo en desarrollo
  - En producción: validación de certificados SSL estricta (configuración no se aplica)
  - Necesario para compatibilidad con certificados auto-firmados de Replit/Neon en desarrollo
- **Configuración de sesiones mejorada** (`server/index.ts`):
  - Validación obligatoria de `SESSION_SECRET` (sin fallback inseguro)
  - Cookies seguras según ambiente: `secure: true` en producción
  - Protección CSRF agregada con `sameSite: 'lax'`
  - Mantenido `httpOnly: true` para protección XSS
- **Documentación**:
  - Creado `plan-correccion-errores.md` con plan completo de correcciones en 5 fases
  - Fase 1 completada: 2 problemas críticos de seguridad resueltos
- **Nota técnica**: Identificado que la app usa autenticación personalizada (email/password), no Replit Auth. Código en `server/replitAuth.ts` es legacy sin usar.

### 2025-10-11: Sistema de Facturación Automática y NCF - Fase 4 Completada ✅
- **Tabla ncfSeries** (`shared/schema.ts`):
  - Gestión de series autorizadas de NCF por tipo (B01, B02, B14, B15, B16, E31)
  - Control de secuencias con alertas de agotamiento (threshold configurable)
  - Tracking de NCF actual y próximo a asignar
  - Estados: active, depleted, expired
- **Servicio de facturación** (`server/invoice-service.ts`):
  - Generación automática de facturas post-pago
  - Asignación secuencial de NCF desde tabla ncfSeries
  - Cálculo automático de ITBIS (18%) y totales
  - Validación de series disponibles antes de asignar
- **Generador de PDFs** (`server/pdf-generator.ts`):
  - PDFs profesionales usando PDFKit
  - Formato fiscal completo con NCF, RNC, ITBIS desglosado
  - Diseño profesional con totales y subtotales
- **Reportes fiscales** (`server/fiscal-reports.ts`):
  - Reporte mensual de facturas con totales e ITBIS
  - Exportación formato DGII (CSV) para declaraciones
  - Reporte de ITBIS recaudado por año/mes
- **Endpoints de API** (`server/routes.ts`):
  - GET `/api/invoices` - Listar facturas con paginación
  - GET `/api/invoices/:id` - Ver factura específica
  - GET `/api/invoices/:id/download` - Descargar PDF
  - GET `/api/admin/ncf-series` - Listar series NCF (admin)
  - POST `/api/admin/ncf-series` - Crear serie NCF (admin)
  - GET `/api/admin/ncf-availability/:seriesType` - Verificar disponibilidad
  - GET `/api/reports/monthly/:month` - Reporte mensual
  - GET `/api/reports/dgii` - Exportar DGII (CSV)
  - GET `/api/reports/itbis/:year` - Reporte ITBIS
- **Panel de facturas** (`client/src/pages/invoices.tsx`):
  - Listado de facturas con filtros y búsqueda
  - Estadísticas de ingresos totales e ITBIS
  - Descarga de PDFs individuales
  - Interfaz responsiva con tabla completa de datos fiscales
- **Métodos de storage** (`server/storage.ts`):
  - CRUD completo para series de NCF
  - Asignación de próximo NCF disponible
  - Verificación de disponibilidad por tipo de serie
- **Nota importante**: Migración de BD pendiente (endpoint de Neon deshabilitado - ejecutar `npm run db:push --force` cuando esté disponible)
- **Próximos pasos**: Fase 5 - Panel de administración de pagos

### 2025-10-09: Sistema de Suscripciones Mejorado - Fase 3 Completada ✅
- **Página de selección de planes mejorada** (`client/src/pages/subscription-selection.tsx`):
  - Toggle de facturación mensual/anual con 20% descuento anual
  - Comparación visual de planes con features destacados
  - Sección de FAQs con 8 preguntas frecuentes
  - Destacado visual de plan recomendado (Professional)
- **Sistema de trial flexible**:
  - Configuración de días de prueba por plan (Basic: 7 días, Professional: 14 días, Enterprise: 30 días)
  - Campo `trialDays` agregado al schema de subscriptions
  - Recordatorios automáticos 3 días antes y el día del fin de trial
- **Servicio de suscripciones** (`server/subscription-service.ts`) con:
  - Cálculo prorrateado automático para upgrades/downgrades
  - Aplicación de créditos por downgrade
  - Actualización de billing cycle (mensual/anual)
  - Validación de límites de uso por plan
- **Servicio de notificaciones** (`server/notification-service.ts`):
  - Templates de email para bienvenida, confirmación de pago, fallo de pago
  - Recordatorios de trial y cancelación de suscripción
  - Sistema preparado para integración con SMTP/SendGrid
- **Panel de gestión de suscripción** (`client/src/pages/subscription-management.tsx`):
  - Vista de plan actual, próximo pago y estado
  - Upgrade/downgrade de planes con preview de cálculo prorrateado
  - Cambio de billing cycle (mensual/anual)
  - Cancelación y reactivación de suscripción
  - Indicador de período de prueba con días restantes
- **Próximos pasos**: Fase 4 - Sistema de facturación automática con NCF

### 2025-10-09: Sistema de Pagos con Azul - Fase 2 Completada ✅
- **Servicio de integración** `server/azul-service.ts` implementado con:
  - Generación de hash SHA512 para autenticación
  - Creación de solicitudes de pago con Payment Page
  - Validación y procesamiento de callbacks
  - Sistema de reembolsos
- **Endpoints de API** creados en `server/routes.ts`:
  - POST `/api/payments/azul/create` - Iniciar pago
  - POST `/api/payments/azul/approved` - Callback de pago aprobado
  - POST `/api/payments/azul/declined` - Callback de pago declinado
  - POST `/api/payments/azul/cancelled` - Callback de pago cancelado
  - POST `/api/payments/azul/refund` - Procesar reembolsos (admin)
- **Integración automática**: Actualización de suscripciones y generación de facturas post-pago

### 2025-10-08: Sistema de Pagos con Azul - Fase 1 Completada ✅
- **Schema actualizado** para soportar múltiples gateways de pago (Azul, Verifone, Manual)
- **Nueva tabla** `paymentGatewayConfig` para almacenar credenciales de diferentes gateways
- **Campos genéricos** agregados: `paymentGateway`, `gatewayTransactionId`, `gatewayAuthCode`, etc.
- **Compatibilidad** mantenida con campos legacy de Verifone
- **Archivo de configuración** `shared/azul-config.ts` con tipos, constantes y helpers para Azul

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL connection
- **azul**: Payment gateway (República Dominicana - Banco Popular) - Integrado (Fases 1-4)
- **verifone**: Payment processing (legacy support)
- **pdfkit**: PDF generation for invoices with fiscal data
- **drizzle-orm**: Database ORM
- **express**: Web server framework
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **react-hook-form**: Form handling
- **zod**: Schema validation
- **DGII Validation**: fouronerncvalidator.onrender.com for RNC validation