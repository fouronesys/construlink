# Guía de Despliegue - ConstruLink

## 📦 Despliegue con CapRover

Este proyecto está configurado para desplegarse fácilmente con CapRover.

### Requisitos Previos

1. **Servidor CapRover** configurado y en ejecución
2. **CapRover CLI** instalado en tu máquina local:
   ```bash
   npm install -g caprover
   ```

### Configuración de Variables de Entorno

Antes de desplegar, asegúrate de configurar las siguientes variables de entorno en tu aplicación de CapRover:

#### Variables Requeridas

```bash
# Base de Datos PostgreSQL
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/nombre_bd

# Sesión
SESSION_SECRET=tu_secret_key_muy_seguro_aqui

# SMTP para Emails
SMTP_HOST=mail.fourone.com.do
SMTP_PORT=2587
SMTP_SECURE=false
SMTP_USER=tu_usuario@dominio.com
SMTP_PASS=tu_contraseña_smtp
EMAIL_FROM=noreply@construlink.com

# URL de la Aplicación (para emails)
APP_URL=https://tu-dominio.com

# Stripe (si usas pagos)
STRIPE_SECRET_KEY=tu_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=tu_stripe_public_key

# Node Environment
NODE_ENV=production
```

### Pasos para Desplegar

#### 1. Iniciar sesión en CapRover

```bash
caprover login
```

Sigue las instrucciones para conectarte a tu servidor CapRover.

#### 2. Crear la aplicación (primera vez)

```bash
caprover apps create construlink
```

#### 3. Configurar variables de entorno

En el panel de CapRover:
1. Ve a tu aplicación `construlink`
2. Click en "App Configs"
3. Scroll hasta "Environmental Variables"
4. Agrega todas las variables mencionadas arriba

#### 4. Desplegar la aplicación

Desde la raíz del proyecto:

```bash
# Opción 1: Despliegue directo
caprover deploy

# Opción 2: Especificar la aplicación
caprover deploy -a construlink
```

#### 5. Configurar dominio (opcional)

1. En CapRover, ve a tu aplicación
2. Click en "Enable HTTPS"
3. Agrega tu dominio personalizado
4. Actualiza la variable `APP_URL` con tu dominio

### Estructura del Proyecto para CapRover

```
.
├── captain-definition          # Configuración de CapRover
├── Dockerfile                  # Imagen Docker multistage
├── package.json               # Dependencias
├── public/                    # Archivos estáticos
│   ├── assets/               # Logo y recursos
│   └── uploads/              # Uploads de usuarios
├── server/                    # Código del servidor
├── client/                    # Código del frontend
└── shared/                    # Código compartido
```

### Verificación Post-Despliegue

Después del despliegue, verifica:

1. ✅ La aplicación está ejecutándose en tu dominio
2. ✅ La base de datos está conectada
3. ✅ Los emails se envían correctamente
4. ✅ Las imágenes y assets cargan
5. ✅ Los pagos funcionan (si aplica)

### Comandos Útiles

```bash
# Ver logs de la aplicación
caprover logs -a construlink

# Reiniciar la aplicación
caprover restart -a construlink

# Ver estado de la aplicación
caprover status -a construlink
```

### Troubleshooting

#### El logo no carga en los emails
- Verifica que la variable `APP_URL` esté configurada correctamente
- Asegúrate que apunte al dominio público de tu aplicación

#### Errores de base de datos
- Verifica que `DATABASE_URL` esté correctamente formateado
- Asegúrate que la base de datos esté accesible desde el servidor CapRover

#### Errores de SMTP
- Verifica las credenciales SMTP
- Revisa los logs con `caprover logs -a construlink`

### Actualizaciones

Para actualizar la aplicación:

```bash
git pull origin main
caprover deploy -a construlink
```

CapRover automáticamente:
1. Construirá una nueva imagen Docker
2. Ejecutará las migraciones (si las hay)
3. Reiniciará la aplicación con cero downtime

---

## 🚀 Despliegue Alternativo con Docker

Si prefieres usar Docker directamente:

```bash
# Construir imagen
docker build -t construlink .

# Ejecutar contenedor
docker run -p 80:80 \
  -e DATABASE_URL="..." \
  -e SESSION_SECRET="..." \
  -e SMTP_HOST="..." \
  construlink
```

---

## 📝 Notas Importantes

1. **Migraciones**: El proyecto usa Drizzle ORM. Ejecuta `npm run db:push` antes del primer despliegue
2. **Uploads**: Los archivos subidos se guardan en `/app/public/uploads` - considera usar un volumen persistente
3. **Seguridad**: Nunca commitees las variables de entorno en el repositorio
4. **Backups**: Configura backups automáticos de la base de datos

---

Para más información sobre CapRover: https://caprover.com/docs/
