# Configuración de Servidor SMTP para Envío de Emails

## Resumen

Este proyecto utiliza tu propio servidor de correos mediante el protocolo SMTP para el envío de emails transaccionales (notificaciones de suscripción, recordatorios de trial, confirmaciones de pago, etc.).

## Variables de Entorno Requeridas

```bash
SMTP_HOST=smtp.tuservidor.com          # Servidor SMTP
SMTP_PORT=587                          # Puerto SMTP (587 para TLS, 465 para SSL)
SMTP_SECURE=false                      # true para SSL (puerto 465), false para TLS/STARTTLS (puerto 587)
SMTP_USER=tu_usuario@tudominio.com     # Usuario/email de autenticación
SMTP_PASS=tu_contraseña                # Contraseña del servidor SMTP
EMAIL_FROM=noreply@tudominio.com       # Email de origen (opcional, usa SMTP_USER por defecto)
```

## Configuración Paso a Paso

### 1. Obtener Credenciales SMTP de tu Servidor

Dependiendo de tu proveedor de correo, necesitarás obtener las credenciales SMTP:

#### Gmail
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_de_aplicación  # Usa contraseña de aplicación, no la contraseña normal
```

**Nota**: Para Gmail necesitas generar una "Contraseña de Aplicación":
1. Ve a tu cuenta de Google → Seguridad
2. Activa "Verificación en 2 pasos"
3. En "Contraseñas de aplicaciones", genera una nueva
4. Usa esa contraseña en `SMTP_PASS`

#### Outlook/Office 365
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_email@outlook.com
SMTP_PASS=tu_contraseña
```

#### Yahoo Mail
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_email@yahoo.com
SMTP_PASS=tu_contraseña_de_aplicación
```

#### Servidor Propio / cPanel / Hosting
```bash
SMTP_HOST=mail.tudominio.com           # O smtp.tudominio.com
SMTP_PORT=587                          # Puede ser 465 o 587
SMTP_SECURE=false                      # true si usas puerto 465
SMTP_USER=noreply@tudominio.com
SMTP_PASS=contraseña_del_email
```

Consulta la documentación de tu proveedor de hosting para obtener estos datos.

### 2. Configurar Variables de Entorno

Agrega las variables de entorno en tu archivo `.env` o en la configuración de Replit:

```bash
SMTP_HOST=smtp.tuservidor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@tudominio.com
SMTP_PASS=tu_contraseña_segura
EMAIL_FROM=noreply@tudominio.com
```

### 3. Verificar la Configuración

Una vez configuradas las variables:

1. Reinicia el servidor
2. Los logs mostrarán si la configuración SMTP está disponible
3. Al realizar una acción que envíe email (ej: nueva suscripción), verifica:
   - Los logs del servidor para confirmación de envío
   - La bandeja de entrada del destinatario

### 4. Comportamiento sin Configuración

Si las variables SMTP no están configuradas o están incompletas:

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

## Puertos SMTP Comunes

- **Puerto 25**: SMTP estándar (generalmente bloqueado por ISPs)
- **Puerto 587**: SMTP con STARTTLS (recomendado) - usar `SMTP_SECURE=false`
- **Puerto 465**: SMTP con SSL (legacy) - usar `SMTP_SECURE=true`
- **Puerto 2525**: Alternativo cuando 587 está bloqueado - usar `SMTP_SECURE=false`

## Solución de Problemas

### Error: "Invalid login"
- Verifica que el usuario y contraseña sean correctos
- Si usas Gmail/Yahoo, asegúrate de usar contraseña de aplicación
- Verifica que la autenticación SMTP esté habilitada en tu servidor

### Error: "Connection timeout"
- Verifica que el `SMTP_HOST` sea correcto
- Verifica que el puerto no esté bloqueado por firewall
- Prueba con puerto alternativo (2525 si 587 falla)

### Error: "Self-signed certificate"
- Si usas un servidor con certificado auto-firmado, puede requerir configuración adicional
- Considera usar un servicio con certificados válidos en producción

### Emails van a spam
1. Configura registros SPF en tu dominio:
   ```
   v=spf1 mx a ~all
   ```
2. Configura DKIM (consulta con tu proveedor)
3. Configura DMARC:
   ```
   v=DMARC1; p=none; rua=mailto:dmarc@tudominio.com
   ```
4. Usa un dominio verificado y reputado

### Verificar configuración manualmente

Puedes probar la conexión SMTP con telnet:

```bash
telnet smtp.tuservidor.com 587
```

O usar herramientas online como:
- [MXToolbox SMTP Test](https://mxtoolbox.com/diagnostic.aspx)
- [SMTP Diag Tool](https://www.smtpdiag.com/)

## Proveedores SMTP Recomendados

Si no tienes servidor propio, considera estos servicios:

1. **Gmail** (Gratis: 500 emails/día)
   - Requiere contraseña de aplicación
   - Buena entregabilidad

2. **Mailgun** (Gratis: 5,000 emails/mes)
   - SMTP robusto
   - Buenas herramientas de tracking

3. **SendGrid** (Gratis: 100 emails/día)
   - Infraestructura confiable
   - APIs adicionales disponibles

4. **Amazon SES** (Muy económico)
   - $0.10 por 1,000 emails
   - Requiere verificación de dominio

5. **Tu servidor de hosting**
   - Generalmente incluido en planes de hosting
   - Consulta con tu proveedor

## Seguridad

⚠️ **Importante**: 

- **NUNCA** compartas tus credenciales SMTP
- Usa contraseñas fuertes y únicas
- Usa contraseñas de aplicación cuando estén disponibles
- Considera rotar contraseñas periódicamente
- En producción, usa TLS/SSL siempre que sea posible
- Monitorea el uso para detectar actividad sospechosa

## Recursos Adicionales

- [Nodemailer Documentation](https://nodemailer.com/)
- [SMTP Protocol Basics](https://www.cloudflare.com/learning/email-security/what-is-smtp/)
- [Email Authentication Guide](https://www.dmarcanalyzer.com/how-to-create-an-spf-record-for-your-domain/)
