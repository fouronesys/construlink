# ✅ Checklist de Despliegue - ConstruLink

Usa este checklist antes de desplegar a producción con CapRover.

## Pre-Despliegue

### 🔧 Configuración Local
- [ ] El proyecto compila sin errores (`npm run build`)
- [ ] Todas las pruebas pasan (si aplica)
- [ ] El archivo `.env` local tiene todas las variables necesarias
- [ ] La base de datos local funciona correctamente

### 📦 Archivos de Deployment
- [x] `captain-definition` existe en la raíz
- [x] `Dockerfile` está configurado correctamente
- [x] `.env.example` documenta todas las variables necesarias
- [x] `DEPLOYMENT.md` tiene instrucciones completas

### 🖼️ Assets y Recursos
- [x] Logo de ConstruLink está en `public/assets/construlink-logo.png`
- [x] El servidor sirve archivos estáticos desde `/assets`
- [x] Las plantillas de email usan la URL correcta para el logo

## Durante el Despliegue

### 🚀 CapRover Setup
- [ ] Servidor CapRover está configurado y accesible
- [ ] CapRover CLI está instalado (`npm install -g caprover`)
- [ ] Has iniciado sesión en CapRover (`caprover login`)
- [ ] La aplicación existe en CapRover o la has creado

### 🔐 Variables de Entorno
- [ ] `DATABASE_URL` - URL de PostgreSQL
- [ ] `SESSION_SECRET` - String aleatorio y seguro
- [ ] `SMTP_HOST` - Servidor SMTP
- [ ] `SMTP_PORT` - Puerto SMTP (587 o 465)
- [ ] `SMTP_USER` - Usuario SMTP
- [ ] `SMTP_PASS` - Contraseña SMTP
- [ ] `EMAIL_FROM` - Email de origen
- [ ] `APP_URL` - URL pública de la aplicación
- [ ] `NODE_ENV=production`
- [ ] `PORT=80`

### 🗄️ Base de Datos
- [ ] Base de datos PostgreSQL está creada
- [ ] Usuario y contraseña de DB configurados
- [ ] La BD es accesible desde el servidor CapRover
- [ ] Ejecutar migraciones: `npm run db:push` (primera vez)

### 📧 SMTP
- [ ] Credenciales SMTP verificadas y funcionando
- [ ] Email de prueba enviado exitosamente
- [ ] El logo carga correctamente en los emails

## Post-Despliegue

### ✨ Verificación Funcional
- [ ] La aplicación carga en el navegador
- [ ] El login funciona correctamente
- [ ] Las páginas principales cargan sin errores
- [ ] Los assets (imágenes, CSS, JS) cargan correctamente
- [ ] El logo aparece en los emails

### 🔍 Pruebas Críticas
- [ ] Registro de nuevo usuario funciona
- [ ] Login/Logout funciona
- [ ] Envío de emails funciona
- [ ] Subida de archivos funciona
- [ ] Los formularios se envían correctamente

### 🌐 SSL y Dominio
- [ ] HTTPS está habilitado en CapRover
- [ ] Certificado SSL está activo
- [ ] Dominio personalizado configurado (si aplica)
- [ ] Redirección HTTP → HTTPS funciona

### 📊 Monitoreo
- [ ] Los logs se pueden ver: `caprover logs -a construlink`
- [ ] No hay errores en los logs
- [ ] La aplicación responde rápidamente
- [ ] El uso de memoria/CPU es normal

## Troubleshooting Rápido

### ❌ La aplicación no inicia
```bash
# Ver logs
caprover logs -a construlink

# Verificar variables de entorno
# En CapRover → App → App Configs → Environmental Variables
```

### ❌ El logo no carga en emails
```bash
# Verificar que APP_URL esté configurado
# Debería ser: https://tu-dominio.com (sin / al final)
```

### ❌ Error de base de datos
```bash
# Verificar DATABASE_URL
# Formato: postgresql://usuario:pass@host:puerto/dbname

# Probar conexión desde el contenedor
caprover exec -a construlink
psql $DATABASE_URL
```

### ❌ SMTP no funciona
```bash
# Verificar credenciales SMTP
# Probar manualmente: npm run test-email
```

## Comandos Útiles

```bash
# Desplegar
caprover deploy -a construlink

# Ver logs en tiempo real
caprover logs -a construlink -f

# Reiniciar app
caprover restart -a construlink

# Ejecutar comando en contenedor
caprover exec -a construlink

# Ver estado
caprover status -a construlink
```

## Notas Finales

- **Backups**: Configura backups automáticos de PostgreSQL
- **Monitoreo**: Considera usar herramientas como UptimeRobot
- **Escalamiento**: CapRover soporta múltiples instancias si es necesario
- **Updates**: Usa `git pull && caprover deploy` para actualizar

---

**¿Listo para desplegar?** 🚀

Ejecuta: `caprover deploy -a construlink`
