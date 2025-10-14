# Configuración de Resend para Envío de Emails

## Resumen

Este proyecto utiliza [Resend](https://resend.com) para el envío de emails transaccionales (notificaciones de suscripción, recordatorios de trial, confirmaciones de pago, etc.).

## Variables de Entorno Requeridas

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx  # API key de Resend (requerido)
EMAIL_FROM=noreply@tudominio.com        # Email de origen (opcional, por defecto: onboarding@resend.dev)
```

## Configuración Paso a Paso

### 1. Crear una cuenta en Resend

1. Visita [https://resend.com](https://resend.com)
2. Crea una cuenta gratuita
3. Accede al dashboard

### 2. Obtener tu API Key

1. Ve a [API Keys](https://resend.com/api-keys) en el dashboard de Resend
2. Click en "Create API Key"
3. Asigna un nombre descriptivo (ej: "Production API Key")
4. Copia la API key generada (comienza con `re_`)
5. Guárdala en las variables de entorno del proyecto como `RESEND_API_KEY`

### 3. Verificar tu Dominio (Producción)

Para enviar emails desde tu propio dominio en producción:

1. Ve a "Domains" en el dashboard de Resend
2. Click en "Add Domain"
3. Ingresa tu dominio (ej: `tudominio.com`)
4. Agrega los registros DNS proporcionados a tu proveedor de dominio:
   - Registro SPF (TXT)
   - Registro DKIM (TXT)
   - Registro DMARC (TXT - opcional pero recomendado)
5. Espera la verificación (puede tomar hasta 48 horas)
6. Una vez verificado, configura `EMAIL_FROM=noreply@tudominio.com`

### 4. Modo de Desarrollo (Testing)

Para desarrollo y pruebas, puedes usar el email de prueba de Resend:

- **Email de origen por defecto**: `onboarding@resend.dev`
- No requiere verificación de dominio
- Los emails se enviarán correctamente a cualquier destinatario
- Útil para testing antes de configurar tu dominio

### 5. Comportamiento sin Configuración

Si `RESEND_API_KEY` no está configurada:

- El sistema mostrará un warning en consola
- Los emails NO se enviarán realmente
- Se registrará en consola la información del email (solo simulación)
- La aplicación seguirá funcionando normalmente

## Tipos de Emails Enviados

El sistema envía los siguientes tipos de emails automáticamente:

1. **Bienvenida**: Al suscribirse a un plan
2. **Recordatorio de Trial**: 3 días antes de que termine el período de prueba
3. **Trial Finalizado**: Cuando termina el período de prueba
4. **Confirmación de Pago**: Cuando se procesa un pago exitoso
5. **Fallo de Pago**: Cuando un pago falla
6. **Cancelación de Suscripción**: Cuando se cancela una suscripción

## Límites y Precios

- **Tier Gratuito**: 100 emails/día, 3,000 emails/mes
- **Plan Pro**: $20/mes por 50,000 emails/mes
- Ver precios actualizados en: [https://resend.com/pricing](https://resend.com/pricing)

## Recursos Adicionales

- [Documentación oficial de Resend](https://resend.com/docs)
- [API Reference](https://resend.com/docs/api-reference/emails/send-email)
- [Soporte de Resend](https://resend.com/support)
- [Status Page](https://status.resend.com)

## Solución de Problemas

### Error: "API key not found"
- Verifica que `RESEND_API_KEY` esté configurada correctamente
- La API key debe comenzar con `re_`
- Asegúrate de reiniciar el servidor después de agregar la variable

### Emails no llegan
1. Verifica que el dominio esté verificado (producción)
2. Revisa la bandeja de spam del destinatario
3. Consulta el dashboard de Resend para ver el estado del email
4. Verifica los logs del servidor para errores

### Dominio no verifica
- Espera hasta 48 horas para la propagación DNS
- Usa herramientas como [MXToolbox](https://mxtoolbox.com) para verificar registros DNS
- Asegúrate de haber agregado todos los registros (SPF, DKIM, DMARC)
