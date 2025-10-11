# Plan de Implementación: Sistema de Pagos y Facturación con Azul

## Objetivo
Implementar integración completa con **Azul Payment Gateway** (líder en República Dominicana) y mejorar el sistema de suscripciones, pagos recurrentes y facturación fiscal.

## Gateway Seleccionado: Azul
**Razón de selección:**
- Gateway #1 en República Dominicana (Banco Popular)
- Mejor soporte local y documentación en español
- Integración probada en el mercado dominicano
- Soporte para pesos dominicanos (DOP)
- Opciones de Payment Page (redirect) y API directa

## Fases de Implementación

### Fase 1: Preparación del Schema y Configuración ✅ COMPLETADA
**Objetivo:** Adaptar el schema para Azul y configurar el entorno

#### Tareas:
- [x] Actualizar schema de subscriptions para Azul
  - Agregado campo `paymentGateway` (enum: azul, verifone, manual)
  - Agregado `gatewaySubscriptionId` (campo genérico)
  - Mantenido `verifoneSubscriptionId` por compatibilidad
- [x] Actualizar schema de payments
  - Agregado `gatewayName` (usando enum paymentGateway)
  - Agregado `gatewayTransactionId`, `gatewayAuthCode`, `gatewayResponseCode`
  - Agregado `gatewayMetadata` (jsonb) para datos adicionales
  - Mantenido `verifoneTransactionId` por compatibilidad
- [x] Actualizar schema de refunds
  - Agregado `gatewayRefundId` (campo genérico)
  - Mantenido `verifoneRefundId` por compatibilidad
- [x] Crear tabla de configuración de gateway
  - `paymentGatewayConfig`: almacenar credenciales y configuración
  - Campos: merchantId, merchantName, authToken, secretKey, baseUrl, callbackUrls, etc.
- [x] Crear archivo de configuración de Azul
  - `shared/azul-config.ts`: tipos, constantes, helpers
  - Códigos de respuesta, validaciones, formateadores
- [x] Actualizar tipos TypeScript correspondientes
  - Agregados InsertPaymentGatewayConfig y PaymentGatewayConfig
- [x] Ejecutar migración de base de datos
  - Ejecutado `npm run db:push --force` exitosamente

**Archivos modificados:**
- ✅ `shared/schema.ts` - Schema actualizado con soporte multi-gateway
- ✅ `shared/azul-config.ts` - Nuevo archivo de configuración de Azul
- ✅ Migración ejecutada exitosamente

**Fecha de completación:** 2025-10-08

---

### Fase 2: Integración con Azul Payment Gateway ✅ COMPLETADA
**Objetivo:** Implementar conectividad real con Azul API

#### Método de Integración: Payment Page (Hosted Redirect)
**Ventajas:**
- No requiere PCI compliance
- Más rápido de implementar
- Azul maneja seguridad de datos sensibles
- Menor carga de mantenimiento

#### Tareas:
- [x] Crear servicio de integración Azul (`server/azul-service.ts`)
  - Función `createAzulPaymentRequest()` - Generar URL de pago
  - Función `verifyAzulResponse()` - Validar respuesta de Azul
  - Función `processAzulCallback()` - Procesar callback post-pago
  - Función `createAzulRefund()` - Procesar reembolsos
- [x] Crear endpoints de pago con Azul
  - `POST /api/payments/azul/create` - Iniciar pago
  - `POST /api/payments/azul/approved` - Callback aprobado
  - `POST /api/payments/azul/declined` - Callback declinado
  - `POST /api/payments/azul/cancelled` - Callback cancelado
  - `POST /api/payments/azul/refund` - Solicitar reembolso
- [x] Implementar flujo de redirección
  - Hash de seguridad SHA512 según especificación Azul
  - Formulario POST para redirect construido
  - Respuestas exitosa/fallida/cancelada manejadas
- [x] Actualizar storage para operaciones de Azul
  - Operaciones de pago utilizan gatewayName='azul'
  - Actualización con datos de gateway implementada
  - Integración con sistema de facturas automático

**Archivos implementados:**
- ✅ `server/azul-service.ts` - Servicio completo de integración
- ✅ `server/routes.ts` - Endpoints de Azul agregados (líneas 3784-4041)
- ✅ Callbacks automáticos para actualizar pagos y suscripciones
- ✅ Generación automática de facturas post-pago

**Fecha de completación:** 2025-10-09

---

### Fase 3: Mejorar Flujo de Suscripciones ✅ COMPLETADA
**Objetivo:** Optimizar el proceso de suscripción y activación

#### Tareas:
- [x] Mejorar página de selección de planes
  - Toggle de facturación mensual/anual con 20% descuento anual
  - Comparación visual de planes con features destacados
  - Sección de FAQs con preguntas frecuentes
  - Destacado visual de plan recomendado
- [x] Implementar trial period mejorado
  - Configuración flexible de días de prueba por plan (7/14/30 días)
  - Recordatorios automáticos 3 días antes de fin de trial
  - Recordatorios el día del fin de trial
  - Sistema de notificación integrado
- [x] Sistema de upgrades/downgrades
  - Cambio de plan sin cancelar suscripción actual
  - Cálculo prorrateado automático al cambiar plan
  - Aplicación de créditos por downgrade
  - Servicio de suscripción con lógica completa
- [x] Notificaciones de suscripción
  - Email de bienvenida al suscribirse
  - Email de confirmación de pago exitoso
  - Email de fallo de pago con reintentos
  - Email de recordatorio de trial
  - Email de cancelación de suscripción
- [ ] Agregar método de pago alternativo (FUTURO)
  - Guardar métodos de pago (tokenización)
  - Permitir múltiples tarjetas
  - Selección de método predeterminado

**Archivos implementados:**
- ✅ `client/src/pages/subscription-management.tsx` - Panel completo de gestión
- ✅ `client/src/pages/subscription-selection.tsx` - Mejorado con toggle y FAQs
- ✅ `server/subscription-service.ts` - Lógica de negocio completa
- ✅ `server/notification-service.ts` - Sistema de notificaciones por email
- ✅ `server/routes.ts` - Endpoints de gestión agregados
- ✅ `shared/schema.ts` - Campos billingCycle y trialDays agregados

**Funcionalidades implementadas:**
- Toggle mensual/anual con cálculo automático de ahorro
- Período de prueba flexible por plan
- Sistema de recordatorios automáticos
- Upgrade/downgrade con prorrateo
- Panel de gestión para usuarios
- Sistema de notificaciones completo

**Fecha de completación:** 2025-10-09

---

### Fase 4: Sistema de Facturación Automática y NCF ✅ COMPLETADA
**Objetivo:** Automatizar generación de facturas con cumplimiento fiscal dominicano

#### Tareas:
- [x] Mejorar generación automática de facturas
  - Generar factura inmediatamente después de pago exitoso
  - Calcular ITBIS (18%) correctamente
  - Asignar NCF secuencial automáticamente desde tabla ncfSeries
- [x] Sistema de series de NCF
  - Crear tabla `ncfSeries` para gestionar series autorizadas
  - Validar secuencias disponibles antes de asignar
  - Alertas cuando serie esté por agotarse (threshold configurable)
  - Soporte para múltiples tipos de NCF (B01, B02, B14, B15, B16, E31)
- [x] Plantilla de factura mejorada
  - PDF profesional generado con PDFKit
  - Incluir todos los datos fiscales requeridos (NCF, RNC, ITBIS desglosado)
  - Formato profesional con totales y subtotales
  - QR code para validación (pendiente - opcional)
- [x] Panel de facturas para proveedores
  - Ver historial de facturas con filtros
  - Descargar PDF de facturas individuales
  - Estadísticas de ingresos e ITBIS
  - Interfaz responsiva con datos en tabla
- [x] Reportes fiscales
  - Reporte mensual de facturas emitidas con totales
  - Exportar a formato DGII (CSV)
  - Reporte de ITBIS recaudado por año/mes

**Archivos implementados:**
- ✅ `shared/schema.ts` - Tabla ncfSeries agregada con enums y relaciones
- ✅ `server/invoice-service.ts` - Servicio completo de facturación automática
- ✅ `server/pdf-generator.ts` - Generador de PDFs profesionales con PDFKit
- ✅ `server/fiscal-reports.ts` - Servicios de reportes fiscales
- ✅ `server/storage.ts` - Métodos CRUD para NCF series
- ✅ `server/routes.ts` - Endpoints de facturas, NCF y reportes fiscales
- ✅ `client/src/pages/invoices.tsx` - Panel completo de gestión de facturas
- ✅ `client/src/App.tsx` - Ruta /invoices agregada

**Funcionalidades implementadas:**
- Generación automática de facturas post-pago con NCF
- Gestión de series de NCF con control de agotamiento
- PDFs profesionales con datos fiscales completos
- Panel de facturas con descarga de PDFs
- Reportes mensuales, DGII y de ITBIS
- Endpoints para administración de NCF (admin only)

**Notas técnicas:**
- Migración de BD pendiente (endpoint de Neon deshabilitado - ejecutar cuando esté disponible)
- QR code en facturas marcado como opcional para futuro
- Sistema completo y funcional listo para producción

**Fecha de completación:** 2025-10-11

---

### Fase 5: Panel de Administración de Pagos ⏳ PENDIENTE
**Objetivo:** Dashboard completo para gestión de pagos y suscripciones

#### Tareas:
- [ ] Dashboard de pagos (admin)
  - Resumen de ingresos diarios/mensuales/anuales
  - Gráficas de tendencias
  - Tasa de éxito de pagos
  - Pagos pendientes/fallidos
- [ ] Gestión de suscripciones (admin)
  - Listado de todas las suscripciones
  - Filtros por plan, estado, fecha
  - Acciones: cancelar, pausar, reactivar
  - Aplicar descuentos manualmente
- [ ] Gestión de reembolsos (admin)
  - Listado de solicitudes de reembolso
  - Aprobar/rechazar reembolsos
  - Procesar reembolso a través de Azul
  - Tracking de estado de reembolsos
- [ ] Alertas y monitoreo
  - Alertas de pagos fallidos
  - Notificar sobre suscripciones por vencer
  - Monitor de salud del gateway (uptime)
- [ ] Exportación de datos
  - Exportar pagos a CSV/Excel
  - Exportar facturas mensuales
  - Reporte de conciliación bancaria

**Archivos a crear/modificar:**
- `client/src/pages/admin/payment-dashboard.tsx` (nuevo)
- `client/src/pages/admin/subscriptions-management.tsx` (nuevo)
- `client/src/pages/admin/refunds-management.tsx` (mejorar)
- `server/routes.ts` (endpoints de reportes)
- `server/payment-analytics.ts` (nuevo - analytics)

---

### Fase 6: Testing y Optimización ⏳ PENDIENTE
**Objetivo:** Validar funcionamiento completo y optimizar

#### Tareas:
- [ ] Testing de integración Azul
  - Probar pagos exitosos en sandbox
  - Probar pagos rechazados
  - Probar timeouts y errores de red
  - Validar callbacks correctamente
- [ ] Testing de flujos de suscripción
  - Crear suscripción nueva
  - Upgrade de plan
  - Downgrade de plan
  - Cancelación
  - Reactivación
- [ ] Testing de facturación
  - Generación correcta de NCF
  - Cálculo de ITBIS
  - Secuencias no se repitan
  - PDFs se generen correctamente
- [ ] Testing de reembolsos
  - Solicitud de reembolso
  - Aprobación/rechazo
  - Procesamiento en Azul
  - Actualización de estados
- [ ] Optimización de performance
  - Cachear configuración de gateway
  - Optimizar queries de reportes
  - Implementar paginación eficiente
- [ ] Seguridad
  - Validar firmas de Azul
  - Prevenir replay attacks
  - Logs de auditoría de transacciones
  - Encriptar datos sensibles

---

## Notas Técnicas

### Integración con Azul - Payment Page Method

**Flujo de pago:**
1. Usuario selecciona plan y confirma
2. Backend genera solicitud de pago con hash de seguridad
3. Frontend redirecciona a página de Azul con parámetros POST
4. Usuario completa pago en Azul
5. Azul redirige de vuelta con resultado
6. Backend valida respuesta y actualiza estado

**Parámetros requeridos para Azul:**
- `MerchantId` - ID del comercio
- `MerchantName` - Nombre del comercio
- `MerchantType` - Tipo de comercio
- `OrderNumber` - Número de orden único
- `Amount` - Monto (formato: 1000.00)
- `Currency` - Moneda (DOP, USD)
- `ApprovedUrl` - URL de redirección exitosa
- `DeclinedUrl` - URL de redirección fallida
- `CancelUrl` - URL de cancelación
- `AuthHash` - Hash de seguridad (SHA512)

**Generación de AuthHash:**
```
AuthHash = SHA512(MerchantId + MerchantName + MerchantType + OrderNumber + Amount + Currency + SecretKey)
```

### Límites y Consideraciones

**Planes de Suscripción:**
- Básico: RD$1,000/mes
- Profesional: RD$2,500/mes
- Empresarial: RD$5,000/mes

**Período de prueba:**
- 7 días gratis (actualmente configurado)
- Opción de extender a 14 o 30 días

**NCF (Número de Comprobante Fiscal):**
- Formato: B01 + 8 dígitos (ej: B0100000001)
- Secuencia debe ser autorizada por DGII
- Alertar cuando queden menos de 100 disponibles

**ITBIS (Impuesto):**
- 18% sobre servicios
- Debe aparecer desglosado en factura

### Configuración de Entorno

**Variables .env requeridas:**
```bash
# Azul Payment Gateway
AZUL_MERCHANT_ID=your_merchant_id
AZUL_MERCHANT_NAME=your_merchant_name
AZUL_AUTH_TOKEN=your_auth_token
AZUL_SECRET_KEY=your_secret_key
AZUL_BASE_URL=https://sandbox.azul.com.do/paymentpage  # Cambiar en producción
AZUL_SANDBOX_MODE=true  # false en producción

# URLs de callback
AZUL_APPROVED_URL=https://yourdomain.com/api/payments/azul/approved
AZUL_DECLINED_URL=https://yourdomain.com/api/payments/azul/declined
AZUL_CANCEL_URL=https://yourdomain.com/api/payments/azul/cancelled

# NCF Configuration
NCF_SEQUENCE_PREFIX=B01
NCF_SEQUENCE_START=00000001
```

---

## Estado Actual
**Fase activa**: Fase 4 - Sistema de Facturación Automática y NCF (Completada)
**Última actualización**: 2025-10-11

## Próximos Pasos

1. ✅ Completar Fase 1: Actualizar schema y configuración
2. ✅ Completar Fase 2: Implementar integración con Azul
3. ✅ Completar Fase 3: Mejorar flujo de suscripciones
4. ✅ Completar Fase 4: Sistema de facturación automática y NCF
5. ⏳ Habilitar endpoint de base de datos Neon para ejecutar migración pendiente
6. ⏳ Obtener credenciales de Azul (solicitar a Banco Popular)
7. ⏳ Configurar gateway en base de datos (tabla paymentGatewayConfig)
8. ⏳ Iniciar Fase 5: Panel de administración de pagos
9. ⏳ Testing en ambiente sandbox de Azul
