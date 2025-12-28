# 📱 Integración WAHA (WhatsApp HTTP API) - Guía Completa

## 🎯 ¿Qué es WAHA?

**WAHA** (WhatsApp HTTP API) convierte un número de WhatsApp normal en una API REST que puedes usar para enviar mensajes automáticamente **sin pagar por mensaje** como con las APIs oficiales (Twilio, Meta Business API).

### 💰 Comparativa de Costos

| Solución | Costo Mensual | Costo por Mensaje | Límite |
|----------|---------------|-------------------|---------|
| **Twilio** | $0 + variable | ~$0.05/mensaje | Ilimitado |
| **Meta Business API** | Variable | ~$0.04-0.06/mensaje | Variable |
| **WAHA (Nuestra solución)** | $5 (Railway) + $10 (chip) | $0.00 | ~1000 msgs/mes |

**Para 100 mensajes/mes:**
- Twilio: ~$5/mes
- **WAHA: $15/mes (ILIMITADOS)**

---

## 🚀 Paso 1: Desplegar WAHA en Railway

### 1.1 Crear Nuevo Proyecto

1. Ve a tu dashboard de Railway: https://railway.app
2. Click en **"New Project"**
3. Selecciona **"Deploy from Image"**

### 1.2 Configurar la Imagen Docker

Usa una de estas imágenes (recomendado: `waha-plus` para más funciones):

```
devlikeapro/waha-plus
```

O la versión Core (más ligera):

```
devlikeapro/waha
```

### 1.3 Variables de Entorno en Railway

En tu proyecto de Railway, ve a **"Variables"** y añade:

```bash
# Motor de WhatsApp (WEBJS es el más estable)
WHATSAPP_DEFAULT_ENGINE=WEBJS

# Reiniciar automáticamente si falla
WHATSAPP_RESTART_ON_FAIL=true

# API Key para proteger tu instancia (genera una clave segura)
WHATSAPP_API_KEY=tu_clave_secreta_aqui_123456

# Habilitar logs detallados (opcional)
DEBUG=true
```

### 1.4 Generar Clave API Segura

```bash
# En tu terminal local, genera una clave aleatoria:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ejemplo de output:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

Usa este valor para `WHATSAPP_API_KEY`.

### 1.5 Desplegar

1. Click en **"Deploy"**
2. Espera 2-3 minutos
3. Railway te dará una URL pública: `https://waha-production-xyz.up.railway.app`

---

## 📲 Paso 2: Conectar tu Número de WhatsApp

### 2.1 Requisitos del Celular "Robot"

- ✅ **Celular Android** viejo (puede ser un celular usado de $30-50)
- ✅ **Chip prepago** (Claro/Movistar/CNT) con plan de datos ($5-10/mes)
- ✅ **WhatsApp instalado** y configurado
- ✅ **Conectado a WiFi estable** (recomendado para ahorrar datos)

### 2.2 Escanear Código QR

1. Abre tu navegador y ve a la URL de Railway:
   ```
   https://tu-waha-instance.up.railway.app
   ```

2. Verás el dashboard de WAHA con un **código QR**

3. En el celular robot:
   - Abre WhatsApp
   - Ve a **⋮ (Menú)** → **Dispositivos vinculados**
   - Click en **"Vincular un dispositivo"**
   - Escanea el código QR de tu navegador

4. ✅ **¡Listo!** El status cambiará a **"WORKING"** o **"READY"**

### 2.3 Verificar Conexión

Abre tu navegador y ve a:

```
https://tu-waha-instance.up.railway.app/api/sessions
```

Deberías ver algo como:

```json
[
  {
    "name": "default",
    "status": "WORKING",
    "config": {...}
  }
]
```

---

## ⚙️ Paso 3: Configurar el Proyecto

### 3.1 Actualizar `env.admin.js`

Copia `env.admin.example.js` a `env.admin.js` y configura:

```javascript
module.exports = {
  // ... tus configuraciones existentes de Supabase ...

  // ===== CONFIGURACIÓN WAHA =====
  WAHA_URL: 'https://tu-waha-instance.up.railway.app',
  WAHA_API_KEY: 'tu_clave_secreta_que_generaste',
  WAHA_SESSION: 'default'
};
```

### 3.2 Configurar Variables de Entorno en Railway (para tu app principal)

En el proyecto de tu **admin-server** en Railway, añade:

```bash
WAHA_URL=https://tu-waha-instance.up.railway.app
WAHA_API_KEY=tu_clave_secreta_que_generaste
WAHA_SESSION=default
```

---

## 🧪 Paso 4: Probar la Integración

### 4.1 Ejecutar Script de Prueba

```bash
node test_whatsapp.js
```

Deberías ver:

```
============================================================
🧪 Iniciando pruebas de WhatsApp Service
============================================================

📝 Test 1: Verificar conexión con WAHA
✅ WAHA está conectado y listo

📝 Test 2: Formatear números de teléfono
   ✅ +593987654321 → 593987654321@c.us
   ✅ 0987654321 → 593987654321@c.us
   ✅ 987654321 → 593987654321@c.us

============================================================
✅ Pruebas completadas
============================================================
```

### 4.2 Enviar Mensaje de Prueba (Opcional)

Edita `test_whatsapp.js` y descomenta la sección del Test 3:

```javascript
const TEST_PHONE = '+593987654321'; // TU NÚMERO AQUÍ
```

Ejecuta de nuevo:

```bash
node test_whatsapp.js
```

Deberías recibir un mensaje de WhatsApp en tu teléfono.

---

## 🎨 Paso 5: Integrar con el Dashboard (Frontend)

### 5.1 Crear Botón de Envío Automático

Edita tu archivo HTML del dashboard (probablemente `admin.html` o `dashboard.html`):

```html
<!-- Botón para enviar notificación automática -->
<button onclick="sendWhatsAppNotification(accountId)" class="btn-primary">
  📱 Enviar por WhatsApp
</button>
```

### 5.2 JavaScript para Enviar Mensajes

```javascript
// Función para enviar notificación de pago
async function sendWhatsAppNotification(accountId) {
  try {
    const token = await getAuthToken(); // Tu función para obtener el JWT
    
    const response = await fetch('/admin/whatsapp/send-payment-reminder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accountId })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('✅ Mensaje enviado exitosamente');
    } else {
      alert('❌ Error: ' + result.error);
    }
  } catch (error) {
    console.error(error);
    alert('❌ Error al enviar mensaje');
  }
}

// Función para enviar confirmación de pago
async function sendPaymentConfirmation(accountId) {
  try {
    const token = await getAuthToken();
    
    const response = await fetch('/admin/whatsapp/send-payment-confirmation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accountId })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('✅ Confirmación enviada');
    } else {
      alert('❌ Error: ' + result.error);
    }
  } catch (error) {
    console.error(error);
    alert('❌ Error al enviar confirmación');
  }
}

// Función para envío masivo (reemplaza el sistema semi-automático)
async function sendBulkNotifications(notifications) {
  try {
    const token = await getAuthToken();
    
    // Mostrar barra de progreso
    const progressDiv = document.getElementById('progress');
    progressDiv.style.display = 'block';
    
    const response = await fetch('/admin/whatsapp/send-bulk', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notifications: notifications,
        delayMs: 2000 // 2 segundos entre mensajes
      })
    });
    
    const result = await response.json();
    
    alert(`✅ Enviados: ${result.sent}/${result.total}\n❌ Fallidos: ${result.failed}`);
    
    progressDiv.style.display = 'none';
  } catch (error) {
    console.error(error);
    alert('❌ Error al enviar mensajes masivos');
  }
}
```

---

## 🔧 Paso 6: Endpoints Disponibles

Tu servidor ahora expone estos endpoints (requieren autenticación JWT):

### Verificar Estado
```bash
GET /admin/whatsapp/status
Authorization: Bearer <tu_jwt_token>
```

### Enviar Recordatorio de Pago
```bash
POST /admin/whatsapp/send-payment-reminder
Authorization: Bearer <tu_jwt_token>
Content-Type: application/json

{
  "accountId": "123"
}
```

### Enviar Confirmación de Pago
```bash
POST /admin/whatsapp/send-payment-confirmation
Authorization: Bearer <tu_jwt_token>
Content-Type: application/json

{
  "accountId": "123"
}
```

### Enviar Mensaje Personalizado
```bash
POST /admin/whatsapp/send-custom
Authorization: Bearer <tu_jwt_token>
Content-Type: application/json

{
  "phone": "+593987654321",
  "template": "Hola {propietario}, tu servicio {servicio} vence el {fecha_pago}",
  "variables": {
    "propietario": "Juan",
    "servicio": "Netflix",
    "fecha_pago": "2025-01-15"
  }
}
```

### Envío Masivo
```bash
POST /admin/whatsapp/send-bulk
Authorization: Bearer <tu_jwt_token>
Content-Type: application/json

{
  "notifications": [
    { "accountId": "123", "type": "payment_reminder" },
    { "accountId": "456", "type": "payment_reminder" }
  ],
  "delayMs": 2000
}
```

---

## 🛡️ Mejores Prácticas de Seguridad

### 1. Proteger WAHA con API Key

Siempre usa `WHATSAPP_API_KEY` en Railway para que solo tu servidor pueda acceder.

### 2. No Exponer URL de WAHA

Nunca compartas la URL de WAHA públicamente. Solo tu servidor backend debe conocerla.

### 3. Rate Limiting

WhatsApp detecta patrones automáticos. Recomendaciones:

- ✅ **2-3 segundos** entre mensajes (óptimo)
- ⚠️  **1 segundo** (riesgoso si envías muchos)
- ❌ **<1 segundo** (ban casi garantizado)

### 4. Límites Diarios

No envíes más de:
- **50 mensajes/hora** (seguro)
- **200 mensajes/día** (límite recomendado)
- **1000 mensajes/mes** (límite absoluto)

---

## 🚨 Troubleshooting

### Problema: WAHA muestra "SCAN_QR_CODE"

**Solución:**
1. El celular robot perdió la conexión
2. Ve a la URL de WAHA en tu navegador
3. Vuelve a escanear el código QR con el celular

### Problema: "Error: connect ECONNREFUSED"

**Solución:**
1. Verifica que WAHA esté desplegado en Railway
2. Verifica que `WAHA_URL` tenga la URL correcta
3. Asegúrate de que no tenga `/` al final

### Problema: "401 Unauthorized"

**Solución:**
1. Verifica que `WHATSAPP_API_KEY` esté configurado en Railway (WAHA)
2. Verifica que `WAHA_API_KEY` en tu app coincida con el de WAHA

### Problema: Mensajes no llegan

**Solución:**
1. Verifica que el número tenga WhatsApp activo
2. Verifica que el formato sea correcto (+593987654321)
3. Revisa los logs de WAHA en Railway

### Problema: WhatsApp banea el número

**Solución:**
1. Usa otro chip/número
2. Reduce la frecuencia de envíos (aumenta `delayMs`)
3. Evita enviar mensajes idénticos consecutivos

---

## 📊 Monitoreo

### Ver Logs en Railway

1. Ve a tu proyecto WAHA en Railway
2. Click en la pestaña **"Logs"**
3. Verás todos los mensajes enviados y errores

### Verificar Estado en Tiempo Real

```javascript
// En tu dashboard
async function checkWhatsAppStatus() {
  const token = await getAuthToken();
  const response = await fetch('/admin/whatsapp/status', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const status = await response.json();
  
  console.log('WhatsApp Status:', status);
  // { enabled: true, connected: true, wahaUrl: '✓ Configured' }
}
```

---

## 🎉 Migración del Sistema Semi-Automático

### Antes (Manual - WhatsApp Web)
```javascript
// Abre WhatsApp Web con mensaje pre-llenado
window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
```

### Después (Automático - WAHA)
```javascript
// Envía directamente sin intervención
await sendWhatsAppNotification(accountId);
```

### Beneficios de la Migración

| Aspecto | Semi-Automático | WAHA Automático |
|---------|-----------------|-----------------|
| **Tiempo por mensaje** | 15 segundos | 2 segundos |
| **Intervención humana** | Sí (click en cada uno) | No |
| **Errores** | ~5% | <1% |
| **Escalabilidad** | Máximo 50/día | Hasta 200/día |
| **Tracking** | Manual | Automático |

---

## 📝 Próximos Pasos

### Fase 1: Implementación Básica ✅
- [x] Instalar WAHA
- [x] Crear servicio de WhatsApp
- [x] Integrar con admin-server
- [x] Probar envío básico

### Fase 2: Integración Completa
- [ ] Añadir botones en dashboard
- [ ] Reemplazar sistema semi-automático
- [ ] Implementar envío masivo
- [ ] Añadir tracking de mensajes enviados

### Fase 3: Mejoras Avanzadas
- [ ] Sistema de plantillas editables desde UI
- [ ] Historial de mensajes enviados
- [ ] Métricas y analytics
- [ ] Auto-retry en caso de fallo
- [ ] Fallback a email si WhatsApp falla

---

## 💡 Tips Pro

### 1. Usa un Número Dedicado

No uses tu número personal. Compra un chip prepago exclusivo para esto.

### 2. Mantén el Celular Conectado

- WiFi estable es mejor que datos móviles
- Conéctalo a un cargador permanentemente
- Desactiva actualizaciones automáticas de WhatsApp

### 3. Backup de la Sesión

WAHA guarda la sesión en Railway. Si reinicias el contenedor, **NO pierdes la conexión**.

### 4. Monitoreo Proactivo

Configura un cron job para verificar el estado cada hora:

```javascript
// Verifica cada hora si WAHA sigue conectado
setInterval(async () => {
  const connected = await whatsappService.checkConnection();
  if (!connected) {
    // Envía alerta al admin por email
    console.error('⚠️ WAHA desconectado!');
  }
}, 60 * 60 * 1000); // 1 hora
```

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs** en Railway (tanto de WAHA como de tu app)
2. **Verifica las variables de entorno** (WAHA_URL, WAHA_API_KEY)
3. **Prueba manualmente** con Postman o curl
4. **Consulta la documentación oficial** de WAHA: https://waha.devlike.pro/

---

**¡Listo para automatizar tus notificaciones! 🚀**
