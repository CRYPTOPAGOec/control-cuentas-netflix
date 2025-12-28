# 🚂 Guía de Deployment en Railway

## Variables de Entorno Requeridas

Debes configurar estas variables en el dashboard de Railway:

### 🔑 Variables Obligatorias (Supabase):
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
PORT=3000
```

### 📱 Variables WAHA (WhatsApp) - NUEVAS:
```
WAHA_URL=https://tu-waha-instance.up.railway.app
WAHA_API_KEY=tu_clave_api_segura_aqui
WAHA_SESSION=default
```

> ⚠️ **Nota**: Las variables WAHA son opcionales. Si no las configuras, el sistema funcionará normalmente pero sin envío automático de WhatsApp.

---

## 📋 Dónde obtener las credenciales:

### Supabase

1. **SUPABASE_URL**: 
   - Ve a tu proyecto en Supabase
   - Settings > API > Project URL

2. **SUPABASE_ANON_KEY**:
   - Settings > API > Project API keys > anon public key
   - ℹ️ Esta key es pública y se usa en el frontend

3. **SUPABASE_SERVICE_ROLE_KEY**: 
   - Settings > API > Project API keys > service_role key
   - ⚠️ IMPORTANTE: Esta key es secreta, nunca la compartas

4. **PORT**: 
   - Railway lo asigna automáticamente
   - El valor por defecto 3000 funciona si no se especifica

### WAHA (WhatsApp) - Configuración Adicional

5. **WAHA_URL**:
   - Después de desplegar WAHA en Railway (ver sección abajo)
   - Copia la URL pública que Railway te asigna
   - Ejemplo: `https://waha-production-abc123.up.railway.app`

6. **WAHA_API_KEY**:
   - Genera una clave segura ejecutando:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Copia el resultado (64 caracteres hexadecimales)
   - Usa la **misma clave** en:
     - Variable `WHATSAPP_API_KEY` del proyecto WAHA
     - Variable `WAHA_API_KEY` de tu app principal

7. **WAHA_SESSION**:
   - Por defecto: `default`
   - Solo cambiar si necesitas múltiples sesiones de WhatsApp

---

## 🚀 Despliegue en Railway - Paso a Paso

### Opción 1: Proyecto Único (App Principal + WAHA juntos)

Si quieres todo en un solo proyecto de Railway:

1. **Crear proyecto para tu app**:
   - Conecta tu repositorio GitHub
   - Railway detectará automáticamente Node.js
   - Configura las variables de Supabase

2. **Añadir servicio WAHA** (en el mismo proyecto):
   - Click en **"+ New"** → **"Service"**
   - Selecciona **"Docker Image"**
   - Imagen: `devlikeapro/waha-plus`
   - Variables:
     ```
     WHATSAPP_DEFAULT_ENGINE=WEBJS
     WHATSAPP_RESTART_ON_FAIL=true
     WHATSAPP_API_KEY=<la-clave-que-generaste>
     ```
   - Railway te dará una URL: `https://waha-xxx.railway.app`

3. **Conectar ambos servicios**:
   - En tu app principal, añade:
     ```
     WAHA_URL=https://waha-xxx.railway.app
     WAHA_API_KEY=<la-misma-clave>
     WAHA_SESSION=default
     ```

4. **Escanear QR**:
   - Abre `https://waha-xxx.railway.app` en tu navegador
   - Escanea el código QR con tu celular robot
   - Status cambiará a "WORKING"

### Opción 2: Proyectos Separados (Recomendado)

Si prefieres mantener WAHA en un proyecto aparte:

1. **Crear proyecto WAHA**:
   - New Project → Deploy from Image
   - Imagen: `devlikeapro/waha-plus`
   - Variables (ver arriba)
   - Escanear QR

2. **En tu proyecto principal**:
   - Añadir solo las 3 variables WAHA
   - La app se conectará al servicio WAHA externo

---

## 🔐 Autenticación de Administradores

A partir de la versión 2.0, el sistema utiliza **autenticación JWT basada en sesión**:

- Los administradores inician sesión con su **email y contraseña** (no se requiere ADMIN_SECRET)
- La sesión se mantiene entre dispositivos usando Supabase Auth
- El backend valida el token JWT y verifica permisos de admin
- Ya no es necesario introducir manualmente el ADMIN_SECRET desde el frontend

---

## 🎯 Archivos de Configuración Creados:
- ✅ railway.json - Configuración de build y deploy
- ✅ .railwayignore - Archivos a ignorar en el deploy
- ✅ package.json - Ya tiene el script "start" configurado
- ✅ whatsapp_service.js - Servicio de WhatsApp integrado

---

## 📦 Endpoints del Servidor

### Administración de Usuarios
- `GET /_health` - Verificar estado del servidor
- `GET /admin/users` - Listar usuarios
- `POST /admin/users` - Crear usuario
- `PUT /admin/users/:id` - Actualizar usuario
- `DELETE /admin/users/:id` - Eliminar usuario
- `POST /admin/users/:id/toggle` - Habilitar/deshabilitar usuario

### Códigos de Acceso
- `GET /admin/access-codes` - Listar códigos
- `POST /admin/access-codes` - Crear código
- `PUT /admin/access-codes/:id` - Actualizar código
- `DELETE /admin/access-codes/:id` - Eliminar código

### WhatsApp (NUEVOS) 🆕
- `GET /admin/whatsapp/status` - Verificar conexión WAHA
- `POST /admin/whatsapp/send-payment-reminder` - Enviar recordatorio
- `POST /admin/whatsapp/send-payment-confirmation` - Confirmar pago
- `POST /admin/whatsapp/send-custom` - Mensaje personalizado
- `POST /admin/whatsapp/send-bulk` - Envío masivo

> ℹ️ Todos los endpoints requieren: `Authorization: Bearer <token>`

---

## ✅ Checklist de Deployment

### Antes de Desplegar
- [ ] Tienes cuenta en Railway
- [ ] Tienes proyecto en Supabase configurado
- [ ] Has probado localmente con `npm run admin-server`

### Deployment App Principal
- [ ] Conectar repositorio GitHub a Railway
- [ ] Configurar variables de Supabase
- [ ] Verificar que el servidor inicia correctamente
- [ ] Probar endpoint `/_health`

### Deployment WAHA (Opcional)
- [ ] Crear servicio WAHA en Railway
- [ ] Configurar variables WAHA
- [ ] Obtener URL pública
- [ ] Escanear código QR con celular
- [ ] Verificar status "WORKING"
- [ ] Configurar variables WAHA en app principal
- [ ] Probar endpoint `/admin/whatsapp/status`

### Post-Deployment
- [ ] Crear primer usuario admin (ver `make_admin.js`)
- [ ] Login desde el frontend
- [ ] Verificar acceso al dashboard
- [ ] (Opcional) Enviar mensaje de prueba por WhatsApp

---

## 🔧 Troubleshooting

### Error: "SUPABASE_URL not configured"
- Verifica que todas las variables estén configuradas en Railway
- Reinicia el servicio después de añadir variables

### Error: "WhatsApp Service: WAHA no está configurado"
- Esto es normal si no configuraste WAHA
- El sistema funcionará sin WhatsApp automático
- Para habilitar: configura variables WAHA

### WAHA no conecta
- Verifica que la URL sea correcta (sin `/` al final)
- Verifica que `WAHA_API_KEY` coincida en ambos servicios
- Revisa los logs de WAHA en Railway
- Escanea nuevamente el código QR

### Mensajes WhatsApp no llegan
- Verifica status: `GET /admin/whatsapp/status`
- Confirma que el número tenga WhatsApp activo
- Revisa formato del teléfono (+593987654321)
- Verifica logs del servidor

---

## 📚 Documentación Adicional

- [GUIA_INTEGRACION_WAHA.md](./GUIA_INTEGRACION_WAHA.md) - Guía completa de WAHA
- [RESUMEN_INTEGRACION_WAHA.md](./RESUMEN_INTEGRACION_WAHA.md) - Resumen rápido
- [README_SUPABASE.md](./README_SUPABASE.md) - Configuración de Supabase

---

**¡Listo para desplegar! 🚀**
