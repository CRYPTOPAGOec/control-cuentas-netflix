# 📊 Resumen Visual: Variables de Railway

## 🏗️ Arquitectura de Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    RAILWAY PROJECT                          │
│                                                             │
│  ┌──────────────────────┐      ┌──────────────────────┐   │
│  │   Admin Server       │◄────►│   WAHA Service       │   │
│  │   (Tu App)           │      │   (WhatsApp API)     │   │
│  │                      │      │                      │   │
│  │  Variables:          │      │  Variables:          │   │
│  │  • SUPABASE_URL      │      │  • WHATSAPP_DEFAULT_ │   │
│  │  • SUPABASE_ANON_KEY │      │    ENGINE            │   │
│  │  • SUPABASE_SERVICE_ │      │  • WHATSAPP_RESTART_ │   │
│  │    ROLE_KEY          │      │    ON_FAIL           │   │
│  │  • PORT              │      │  • WHATSAPP_API_KEY  │   │
│  │  • WAHA_URL ─────────┼──┐   │                      │   │
│  │  • WAHA_API_KEY ─────┼──┼───┼─ (Same key)         │   │
│  │  • WAHA_SESSION      │  │   │                      │   │
│  └──────────────────────┘  │   └──────────────────────┘   │
│                            │                               │
│                            └─► https://waha-xxx.up         │
│                                .railway.app                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Tabla de Variables

### Servicio: Admin Server (Tu App Principal)

| Variable | Valor de Ejemplo | Dónde Obtenerla | Obligatoria |
|----------|------------------|-----------------|-------------|
| `SUPABASE_URL` | `https://abc123.supabase.co` | Supabase Dashboard → Settings → API | ✅ Sí |
| `SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase Dashboard → Settings → API | ✅ Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Supabase Dashboard → Settings → API | ✅ Sí |
| `PORT` | `3000` | Railway lo asigna automáticamente | ⚠️ Auto |
| `WAHA_URL` | `https://waha-production-abc.up.railway.app` | De tu servicio WAHA en Railway | 📱 Opcional |
| `WAHA_API_KEY` | `6a661c8117ae...` | Genera con `node generate_waha_key.js` | 📱 Opcional |
| `WAHA_SESSION` | `default` | Valor fijo | 📱 Opcional |

### Servicio: WAHA (WhatsApp Service)

| Variable | Valor | Descripción | Obligatoria |
|----------|-------|-------------|-------------|
| `WHATSAPP_DEFAULT_ENGINE` | `WEBJS` | Motor de WhatsApp Web | ✅ Sí |
| `WHATSAPP_RESTART_ON_FAIL` | `true` | Reiniciar si falla | ✅ Sí |
| `WHATSAPP_API_KEY` | `6a661c8117ae...` | Misma clave que `WAHA_API_KEY` | ✅ Sí |

---

## 🔢 Orden de Configuración Recomendado

### Fase 1: App Principal (Ya tienes esto ✅)
```bash
1. SUPABASE_URL
2. SUPABASE_ANON_KEY
3. SUPABASE_SERVICE_ROLE_KEY
4. PORT (opcional)
```

### Fase 2: Servicio WAHA (Nuevo 🆕)
```bash
1. Crear servicio en Railway
2. WHATSAPP_DEFAULT_ENGINE=WEBJS
3. WHATSAPP_RESTART_ON_FAIL=true
4. WHATSAPP_API_KEY=<generar-con-script>
5. Obtener URL pública
6. Escanear código QR
```

### Fase 3: Conectar Ambos (Integración 🔗)
```bash
1. Copiar URL de WAHA → WAHA_URL en app
2. Copiar misma API Key → WAHA_API_KEY en app
3. WAHA_SESSION=default
4. Verificar conexión
```

---

## 🎯 Copy-Paste Ready (Template)

### Para Railway: Admin Server

```env
# ===== SUPABASE (OBLIGATORIO) =====
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_de_64_caracteres
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_de_64_caracteres

# ===== SERVIDOR (AUTO) =====
PORT=3000

# ===== WHATSAPP - WAHA (OPCIONAL) =====
WAHA_URL=https://tu-waha-instance.up.railway.app
WAHA_API_KEY=tu_clave_api_de_64_caracteres_hex
WAHA_SESSION=default
```

### Para Railway: WAHA Service

```env
# ===== WAHA CONFIGURATION =====
WHATSAPP_DEFAULT_ENGINE=WEBJS
WHATSAPP_RESTART_ON_FAIL=true
WHATSAPP_API_KEY=tu_clave_api_de_64_caracteres_hex
```

---

## ⚡ Comandos Rápidos

### Generar Clave API
```bash
node generate_waha_key.js
```

### Probar Conexión Local
```bash
node test_whatsapp.js
```

### Iniciar Servidor Local
```bash
npm run admin-server
```

### Ver Logs en Railway
```bash
# En el dashboard de Railway:
# Servicio → Deployments → Click en el deploy activo → Logs
```

---

## 🔍 Verificación Post-Deployment

### 1. Verificar App Principal
```bash
curl https://tu-app.up.railway.app/_health
```
Respuesta esperada:
```json
{"ok": true, "timestamp": "2025-12-28T..."}
```

### 2. Verificar WAHA
```bash
curl https://tu-waha.up.railway.app/api/sessions
```
Respuesta esperada:
```json
[{"name": "default", "status": "WORKING"}]
```

### 3. Verificar Integración
```bash
curl -H "Authorization: Bearer TU_JWT_TOKEN" \
  https://tu-app.up.railway.app/admin/whatsapp/status
```
Respuesta esperada:
```json
{
  "enabled": true,
  "connected": true,
  "wahaUrl": "✓ Configured"
}
```

---

## 🎨 Estados del Sistema

### Sin WAHA Configurado
```
App Principal: ✅ WORKING
WAHA Service:  ⚪ Not configured
WhatsApp:      ⚪ Disabled
Status:        Sistema funciona sin WhatsApp automático
```

### WAHA Configurado pero no Conectado
```
App Principal: ✅ WORKING
WAHA Service:  ⚠️  SCAN_QR_CODE
WhatsApp:      ⏳ Waiting for QR scan
Status:        Escanear código QR con celular
```

### Totalmente Operativo
```
App Principal: ✅ WORKING
WAHA Service:  ✅ WORKING
WhatsApp:      ✅ Connected
Status:        ¡Todo funcionando! 🎉
```

---

## 💡 Tips Pro

### Seguridad
- ✅ Usa claves diferentes para dev/staging/production
- ✅ Nunca commites variables en Git
- ✅ Rota `WAHA_API_KEY` cada 3-6 meses

### Organización
- 📁 Un proyecto para WAHA (compartido)
- 📁 Proyectos separados para dev/staging/prod de tu app
- 📝 Documenta qué proyecto usa qué WAHA

### Costos
- 💰 WAHA: $5/mes (un solo servicio)
- 💰 Tu App: $5/mes por entorno
- 💡 Total para 1 app: $10/mes con WhatsApp ilimitado

---

## 📞 Necesitas Ayuda?

### Documentación Completa
- [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) - Guía principal
- [RAILWAY_VARIABLES_WAHA.md](./RAILWAY_VARIABLES_WAHA.md) - Paso a paso
- [GUIA_INTEGRACION_WAHA.md](./GUIA_INTEGRACION_WAHA.md) - Todo sobre WAHA

### Scripts Útiles
- `generate_waha_key.js` - Generar clave API
- `test_whatsapp.js` - Probar integración
- `make_admin.js` - Crear usuario admin

---

**¡Variables listas para copiar y pegar! 📋✨**
