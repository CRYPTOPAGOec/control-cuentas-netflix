# 🚀 Guía Rápida: Añadir Variables WAHA a Railway

## Paso 1: Generar Clave API Segura

Ejecuta en tu terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copia el resultado**, por ejemplo:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

---

## Paso 2: Crear Servicio WAHA en Railway

### Opción A: Mismo Proyecto (Recomendado para simplicidad)

1. Ve a tu proyecto existente en Railway
2. Click en **"+ New"** (esquina superior derecha)
3. Selecciona **"Service"**
4. Click en **"Docker Image"**
5. En "Image name", escribe: `devlikeapro/waha-plus`
6. Click en **"Deploy"**

### Opción B: Proyecto Separado (Recomendado para organización)

1. En Railway, click en **"New Project"**
2. Selecciona **"Deploy from Image"**
3. Escribe: `devlikeapro/waha-plus`
4. Click en **"Deploy"**

---

## Paso 3: Configurar Variables en Servicio WAHA

En el servicio WAHA que acabas de crear:

1. Ve a la pestaña **"Variables"**
2. Click en **"+ New Variable"**
3. Añade estas 3 variables:

```
WHATSAPP_DEFAULT_ENGINE=WEBJS
```

```
WHATSAPP_RESTART_ON_FAIL=true
```

```
WHATSAPP_API_KEY=<pega-aqui-la-clave-que-generaste-en-paso-1>
```

4. Railway reiniciará automáticamente

---

## Paso 4: Obtener URL de WAHA

1. En el servicio WAHA, ve a la pestaña **"Settings"**
2. Scroll hasta **"Networking"**
3. Click en **"Generate Domain"** si no hay uno
4. **Copia la URL** (ejemplo: `https://waha-production-abc123.up.railway.app`)

---

## Paso 5: Añadir Variables a tu App Principal

Ve a tu proyecto principal (admin-server) en Railway:

1. Ve a la pestaña **"Variables"**
2. Añade estas 3 nuevas variables:

```
WAHA_URL=<pega-aqui-la-url-de-waha-del-paso-4>
```

```
WAHA_API_KEY=<pega-la-misma-clave-del-paso-1>
```

```
WAHA_SESSION=default
```

3. Railway reiniciará automáticamente tu app

---

## Paso 6: Escanear Código QR

1. Abre la URL de WAHA en tu navegador (la del Paso 4)
2. Verás el dashboard de WAHA con un código QR
3. En tu celular robot:
   - Abre WhatsApp
   - Ve a **⋮ (Menú)** → **Dispositivos vinculados**
   - Click en **"Vincular un dispositivo"**
   - Escanea el código QR

4. El status cambiará a **"WORKING"** ✅

---

## Paso 7: Verificar que Todo Funciona

### Verificar desde tu App

Haz una petición GET a tu app:

```bash
curl -H "Authorization: Bearer TU_TOKEN_JWT" \
  https://tu-app.up.railway.app/admin/whatsapp/status
```

Deberías ver:

```json
{
  "enabled": true,
  "connected": true,
  "wahaUrl": "✓ Configured"
}
```

### Verificar WAHA Directamente

Abre en tu navegador:

```
https://tu-waha.up.railway.app/api/sessions
```

Deberías ver:

```json
[
  {
    "name": "default",
    "status": "WORKING"
  }
]
```

---

## ✅ Checklist Final

- [ ] Generé clave API segura
- [ ] Creé servicio WAHA en Railway
- [ ] Configuré 3 variables en WAHA:
  - [ ] WHATSAPP_DEFAULT_ENGINE
  - [ ] WHATSAPP_RESTART_ON_FAIL
  - [ ] WHATSAPP_API_KEY
- [ ] Obtuve URL pública de WAHA
- [ ] Añadí 3 variables a mi app principal:
  - [ ] WAHA_URL
  - [ ] WAHA_API_KEY
  - [ ] WAHA_SESSION
- [ ] Escaneé código QR con celular robot
- [ ] Verifiqué status "WORKING" en WAHA
- [ ] Probé endpoint `/admin/whatsapp/status`

---

## 🎉 ¡Listo!

Tu sistema ahora puede enviar WhatsApp automáticamente.

### Variables Finales en Railway

**Servicio WAHA:**
```
WHATSAPP_DEFAULT_ENGINE=WEBJS
WHATSAPP_RESTART_ON_FAIL=true
WHATSAPP_API_KEY=a1b2c3d4e5f6...
```

**Tu App Principal (admin-server):**
```
# Existentes
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PORT=3000

# Nuevas (WAHA)
WAHA_URL=https://waha-production-abc123.up.railway.app
WAHA_API_KEY=a1b2c3d4e5f6...
WAHA_SESSION=default
```

---

## 🔧 Si Algo Falla

### WAHA no aparece en el navegador
- Espera 2-3 minutos después del deploy
- Verifica los logs en Railway (pestaña "Deployments")
- Asegúrate de que el deploy fue exitoso (checkmark verde)

### "Error: connect ECONNREFUSED"
- Verifica que `WAHA_URL` NO tenga `/` al final
- Verifica que WAHA esté activo en Railway
- Prueba abrir la URL de WAHA manualmente en el navegador

### "401 Unauthorized" en WAHA
- Verifica que `WAHA_API_KEY` sea EXACTAMENTE la misma en:
  - Variable `WHATSAPP_API_KEY` de WAHA
  - Variable `WAHA_API_KEY` de tu app

### QR no aparece o dice "Session already exists"
- Ve a `https://tu-waha.up.railway.app/api/sessions/default`
- Si ya existe sesión, escanea el QR de nuevo
- O reinicia el servicio WAHA en Railway

---

## 📱 Próximo Paso: Probar Envío

Ejecuta localmente (o desde tu app):

```bash
node test_whatsapp.js
```

O desde tu dashboard, usa el botón **"📱 Enviar WhatsApp"** en cualquier cuenta.

**¡Disfruta de las notificaciones automáticas! 🎉**
