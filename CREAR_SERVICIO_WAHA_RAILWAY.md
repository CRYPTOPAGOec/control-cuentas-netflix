# 🚀 GUÍA RÁPIDA: Crear Servicio WAHA en Railway (3 minutos)

## 🔑 Tu Clave API (Ya Generada)
```
6a661c8117aea199e7541d8be45c9153c8aeb45865d08f919b4a6da3e3ea516e
```

---

## 📍 PASO 1: Acceder a Railway (30 segundos)

1. Abre tu navegador
2. Ve a: **https://railway.app**
3. Inicia sesión con tu cuenta

---

## 📍 PASO 2: Crear Servicio WAHA (1 minuto)

### Opción A: En tu Proyecto Existente (Recomendado)

1. Abre tu proyecto **"Control Cuentas Netflix"** en Railway
2. Click en el botón **"+ New"** (esquina superior derecha)
3. Selecciona **"Service"**
4. Click en **"Docker Image"**
5. En el campo "Image", escribe exactamente:
   ```
   devlikeapro/waha-plus
   ```
6. Click en **"Add Service"** o **"Deploy"**

### Opción B: Proyecto Nuevo (Alternativa)

1. En Railway, click en **"New Project"**
2. Selecciona **"Deploy from Image"**
3. Escribe:
   ```
   devlikeapro/waha-plus
   ```
4. Click en **"Deploy"**

---

## 📍 PASO 3: Configurar Variables (1 minuto)

Después de crear el servicio:

1. Click en el servicio **"waha-plus"** que acabas de crear
2. Ve a la pestaña **"Variables"**
3. Click en **"+ New Variable"** tres veces y añade:

### Variable 1:
```
Name:  WHATSAPP_DEFAULT_ENGINE
Value: WEBJS
```

### Variable 2:
```
Name:  WHATSAPP_RESTART_ON_FAIL
Value: true
```

### Variable 3:
```
Name:  WHATSAPP_API_KEY
Value: 6a661c8117aea199e7541d8be45c9153c8aeb45865d08f919b4a6da3e3ea516e
```

4. Railway reiniciará automáticamente el servicio

---

## 📍 PASO 4: Obtener URL Pública (30 segundos)

1. En el servicio WAHA, ve a la pestaña **"Settings"**
2. Scroll hacia abajo hasta la sección **"Networking"**
3. Si no hay un dominio, click en **"Generate Domain"**
4. **COPIA LA URL** que aparece (ejemplo: `waha-production-abc123.up.railway.app`)

---

## 📍 PASO 5: Actualizar tu App Principal (30 segundos)

1. Ve a tu proyecto principal **"Control Cuentas Netflix"** en Railway
2. Click en el servicio de tu app (admin-server)
3. Ve a la pestaña **"Variables"**
4. Añade estas 3 variables (o actualízalas si ya existen):

### Variable 1:
```
Name:  WAHA_URL
Value: https://<LA-URL-QUE-COPIASTE-EN-PASO-4>
```

### Variable 2:
```
Name:  WAHA_API_KEY
Value: 6a661c8117aea199e7541d8be45c9153c8aeb45865d08f919b4a6da3e3ea516e
```

### Variable 3:
```
Name:  WAHA_SESSION
Value: default
```

5. Railway reiniciará tu app automáticamente

---

## 📍 PASO 6: Escanear Código QR (1 minuto)

1. Abre en tu navegador la URL de WAHA (la del Paso 4)
   ```
   https://waha-production-abc123.up.railway.app
   ```

2. Verás el dashboard de WAHA con un **código QR grande**

3. En tu celular robot:
   - Abre WhatsApp
   - Toca el menú **⋮** (tres puntos arriba a la derecha)
   - Selecciona **"Dispositivos vinculados"**
   - Toca **"Vincular un dispositivo"**
   - Escanea el código QR de la pantalla

4. El status en la página cambiará a:
   ```
   ✅ Status: WORKING
   ```

---

## ✅ VERIFICACIÓN: ¿Funcionó?

### Test 1: Verificar WAHA
Abre en tu navegador:
```
https://<tu-waha>.up.railway.app/api/sessions
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

### Test 2: Verificar tu App
Abre en tu navegador:
```
https://<tu-app>.up.railway.app/_health
```

Deberías ver:
```json
{
  "ok": true,
  "timestamp": "..."
}
```

### Test 3: Verificar Integración (Desde tu Dashboard o Postman)
```bash
GET https://<tu-app>.up.railway.app/admin/whatsapp/status
Authorization: Bearer <tu-jwt-token>
```

Debería responder:
```json
{
  "enabled": true,
  "connected": true,
  "wahaUrl": "✓ Configured"
}
```

---

## 🎉 ¡LISTO!

Si todos los tests pasaron, tu sistema ya puede enviar WhatsApp automáticamente.

### Recuerda actualizar `env.admin.js`:

```javascript
WAHA_URL: 'https://tu-waha-real.up.railway.app', // ← Cambiar aquí
```

---

## 🆘 ¿Problemas?

### WAHA no muestra QR
- Espera 2-3 minutos después del deploy
- Verifica que las variables estén correctas
- Revisa los logs en Railway (pestaña "Deployments")

### "Session already exists"
- Ve a: `https://tu-waha.up.railway.app/api/sessions/default`
- Copia el QR que aparece ahí
- O reinicia el servicio WAHA

### App no conecta con WAHA
- Verifica que `WAHA_URL` NO tenga `/` al final
- Verifica que `WAHA_API_KEY` sea exactamente la misma en ambos
- Espera 1 minuto después de añadir variables

---

## 📊 Resumen de Variables

### Tu Servicio WAHA en Railway:
```
WHATSAPP_DEFAULT_ENGINE=WEBJS
WHATSAPP_RESTART_ON_FAIL=true
WHATSAPP_API_KEY=6a661c8117aea199e7541d8be45c9153c8aeb45865d08f919b4a6da3e3ea516e
```

### Tu App Principal en Railway:
```
WAHA_URL=https://tu-waha.up.railway.app
WAHA_API_KEY=6a661c8117aea199e7541d8be45c9153c8aeb45865d08f919b4a6da3e3ea516e
WAHA_SESSION=default
```

---

**⏱️ Tiempo total: ~3 minutos**
**🎯 Próximo paso: Enviar tu primer WhatsApp automático** 🚀
