# 📬 Sistema Semi-Automatizado de Notificaciones WhatsApp

## 🎯 ¿Qué es esto?

Un sistema que facilita el envío masivo de notificaciones por WhatsApp **sin necesidad de API**. El admin puede ver todas las notificaciones pendientes y enviarlas rápidamente con un solo clic.

---

## ✨ Características

### 1. **Centro de Notificaciones Pendientes**
- Ve todas las cuentas que necesitan notificación hoy
- Filtrado por tipo de notificación (3 días antes, 2 días, vence hoy, atrasado, etc.)
- Filtrado por cuentas con teléfono registrado
- Orden automático por prioridad

### 2. **Envío Individual**
- Botón "📱 Enviar" en cada notificación
- Abre WhatsApp Web con el mensaje pre-llenado
- Usa las plantillas configuradas automáticamente
- Reemplaza variables con datos reales

### 3. **Envío Masivo Secuencial**
- Botón "📱 Enviar Todo" para enviar todas las seleccionadas
- Intervalo configurable entre envíos (2-10 segundos)
- Barra de progreso en tiempo real
- Evita bloqueos de WhatsApp

### 4. **Seguridad y Control**
- Solo abre WhatsApp Web, el admin verifica antes de enviar
- No envía automáticamente (evita errores)
- Checkbox para seleccionar/deseleccionar notificaciones
- Confirmación antes de envío masivo

---

## 🚀 Cómo Usar

### Paso 1: Configurar Plantillas

1. Ve a la sección **"Plantillas de Mensajes WhatsApp"**
2. Haz clic en "✏️ Editar" en cada tipo de notificación
3. Personaliza el mensaje con variables:
   - `{propietario}` - Nombre del cliente
   - `{servicio}` - Tipo de servicio (Netflix, etc.)
   - `{precio}` - Precio del servicio
   - `{fechaPago}` - Fecha del próximo pago
   - `{fechaCaducidad}` - Fecha de caducidad
4. Guarda las plantillas

### Paso 2: Ver Notificaciones Pendientes

1. Ve a la sección **"Centro de Notificaciones Pendientes"**
2. El sistema carga automáticamente todas las notificaciones del día
3. Usa los filtros para ver tipos específicos:
   - **Todos los tipos** - Muestra todas
   - **3 días antes** - Pagos que vencen en 3 días
   - **2 días antes** - Pagos que vencen en 2 días
   - **1 día antes** - Pagos que vencen mañana
   - **Vence HOY** - Pagos que vencen hoy
   - **ATRASADO** - Pagos vencidos
   - **Renovación próxima** - Cuentas próximas a vencer

### Paso 3: Enviar Notificaciones

#### Opción A: Envío Individual

1. Haz clic en "📱 Enviar" en la notificación deseada
2. Se abrirá WhatsApp Web en una nueva pestaña
3. El mensaje ya está escrito con los datos del cliente
4. Revisa el mensaje y presiona ENTER para enviar
5. Cierra la pestaña y continúa con la siguiente

#### Opción B: Envío Masivo

1. **Selecciona las notificaciones** que deseas enviar (por defecto todas están seleccionadas)
2. **Configura el intervalo** entre envíos:
   - **2 segundos (Recomendado)** - Balance entre velocidad y seguridad
   - **3-5 segundos** - Más seguro para muchas notificaciones
   - **10 segundos** - Máxima seguridad
3. Haz clic en **"📱 Enviar Todo"**
4. Confirma la acción
5. El sistema abrirá WhatsApp Web secuencialmente para cada notificación
6. Verás una barra de progreso indicando el avance
7. En cada pestaña, revisa y envía el mensaje manualmente

### Paso 4: Actualizar la Lista

- Haz clic en **"🔄 Actualizar"** para refrescar las notificaciones pendientes
- Las notificaciones enviadas (desmarcadas) desaparecerán al actualizar

---

## 💡 Tips y Mejores Prácticas

### ✅ Para Envío Masivo Exitoso

1. **Usa intervalos de 2-3 segundos mínimo**
   - WhatsApp puede bloquear si abres muchas pestañas muy rápido
   - Un intervalo razonable evita bloqueos temporales

2. **Divide envíos grandes**
   - Si tienes más de 50 notificaciones, divídelas en grupos
   - Envía 20-30, espera unos minutos, luego envía el siguiente grupo

3. **Verifica siempre antes de enviar**
   - El sistema NO envía automáticamente
   - Siempre puedes revisar y editar el mensaje antes de enviarlo

4. **Mantén las plantillas actualizadas**
   - Revisa periódicamente que las plantillas tengan el contenido correcto
   - Usa formato de WhatsApp (*negrita*, _cursiva_, ~tachado~)

### ⚠️ Limitaciones y Consideraciones

1. **No es 100% automático**
   - Requiere que el admin presione ENTER en cada pestaña
   - Esto es intencional para evitar errores y dar control

2. **Depende de WhatsApp Web**
   - Necesitas tener WhatsApp Web activo
   - Tu teléfono debe estar conectado a internet

3. **Límites de WhatsApp**
   - WhatsApp puede limitar envíos masivos
   - Respeta los intervalos configurados

4. **Navegador necesario**
   - Funciona mejor en Chrome, Edge o Firefox
   - Permite pop-ups para que se abran las pestañas

---

## 🎨 Estados de las Notificaciones

### Colores por Prioridad

- 🔴 **Rojo** - Pago vence HOY (máxima prioridad)
- 🔴 **Rosa** - Pago ATRASADO (crítico)
- 🟠 **Naranja** - Pago vence en 1 día
- 🟡 **Amarillo** - Pago vence en 2 días
- 🔵 **Azul** - Pago vence en 3 días
- 🟣 **Morado** - Renovación próxima (7 días o menos)

---

## 🔧 Configuración del Intervalo

### ¿Qué intervalo elegir?

| Intervalo | Velocidad | Seguridad | Uso recomendado |
|-----------|-----------|-----------|------------------|
| **Inmediato (0s)** | Muy rápida | ⚠️ Baja | Solo para pruebas (2-3 mensajes) |
| **2 segundos** | Rápida | ✅ Buena | Uso normal (hasta 30 mensajes) |
| **3 segundos** | Media | ✅✅ Muy buena | Envíos medianos (30-50 mensajes) |
| **5 segundos** | Media-lenta | ✅✅✅ Excelente | Envíos grandes (50+ mensajes) |
| **10 segundos** | Lenta | ✅✅✅ Máxima | Cuando WhatsApp te bloqueó antes |

---

## 📊 Flujo de Trabajo Recomendado

### Rutina Diaria (10 minutos)

1. **Mañana (9:00 AM)**
   - Abre el panel de admin
   - Ve al "Centro de Notificaciones Pendientes"
   - Filtra por "Vence HOY" y "ATRASADO"
   - Envía estas primero (alta prioridad)

2. **Medio día (12:00 PM)**
   - Filtra por "1 día antes" y "2 días antes"
   - Envía recordatorios preventivos

3. **Tarde (5:00 PM)**
   - Verifica si hay nuevos pagos atrasados
   - Envía notificaciones de renovación próxima

### Cada Semana

- Revisa y actualiza las plantillas de mensajes
- Verifica que los números de teléfono estén actualizados
- Exporta reportes de cuentas atrasadas

---

## 🆘 Solución de Problemas

### Problema: "No hay notificaciones pendientes"

**Causas posibles:**
- ✅ No hay cuentas que requieran notificación hoy
- ❌ Las fechas de pago no están configuradas
- ❌ El filtro "Solo con teléfono" está activo y las cuentas no tienen teléfono

**Solución:**
- Verifica que las cuentas tengan fechas de pago configuradas
- Desactiva el filtro "Solo con teléfono" para ver todas
- Ve a la pestaña "Cuentas" y revisa los datos

### Problema: WhatsApp Web no se abre

**Solución:**
- Permite pop-ups en tu navegador
- Verifica que WhatsApp Web funcione: https://web.whatsapp.com
- Cierra y vuelve a abrir el navegador

### Problema: El mensaje tiene variables sin reemplazar (ejemplo: "{propietario}")

**Causa:**
- Los datos de la cuenta están incompletos

**Solución:**
- Ve a la cuenta específica y completa los datos faltantes
- Las variables se reemplazan automáticamente si los datos existen

### Problema: WhatsApp me bloqueó temporalmente

**Solución:**
- Espera 30-60 minutos antes de volver a enviar
- Usa intervalos más largos (5-10 segundos)
- Reduce la cantidad de envíos por sesión (máximo 30-40)

---

## 🚀 Ventajas de Este Sistema

### ✅ Comparado con Envío Manual Tradicional

| Característica | Manual | Semi-Automatizado |
|----------------|--------|-------------------|
| Tiempo por mensaje | 2-3 minutos | 10-15 segundos |
| Riesgo de error | Alto | Bajo |
| Copia/pega | Necesario | Automático |
| Organización | Difícil | Automática |
| Filtros | No | Sí |
| Plantillas | No | Sí |
| Priorización | Manual | Automática |

### ✅ Comparado con API de WhatsApp

| Característica | API | Semi-Automatizado |
|----------------|-----|-------------------|
| Costo | $$ | Gratis |
| Configuración | Compleja | Simple |
| Verificación | Necesaria | No necesaria |
| Límites | 1000+/día | Ilimitado |
| Control manual | No | Sí |
| Flexibilidad | Limitada | Total |

---

## 📈 Métricas y Estadísticas

### Tiempos Estimados

- **10 notificaciones:** ~2-3 minutos (con intervalo de 2s)
- **30 notificaciones:** ~5-7 minutos (con intervalo de 3s)
- **50 notificaciones:** ~8-12 minutos (con intervalo de 5s)

### Comparación de Eficiencia

- **Manual puro:** 10 mensajes = 20-30 minutos
- **Semi-automatizado:** 10 mensajes = 2-3 minutos
- **Ahorro de tiempo:** ~85-90%

---

## 🎓 Capacitación para Nuevo Personal

### Checklist de Onboarding

- [ ] Mostrar cómo configurar plantillas
- [ ] Explicar los filtros de notificaciones
- [ ] Hacer una prueba de envío individual
- [ ] Hacer una prueba de envío masivo (5 mensajes)
- [ ] Explicar los intervalos y su importancia
- [ ] Mostrar cómo manejar errores comunes
- [ ] Establecer rutina diaria recomendada

### Video Tutorial Sugerido (crear)

1. Introducción al sistema (1 min)
2. Configuración de plantillas (3 min)
3. Envío individual paso a paso (2 min)
4. Envío masivo paso a paso (3 min)
5. Tips y mejores prácticas (2 min)

---

## 📞 Soporte

Si encuentras algún problema o necesitas ayuda:

1. Revisa esta documentación primero
2. Verifica la sección de "Solución de Problemas"
3. Contacta al desarrollador con capturas de pantalla del error

---

## 🔄 Actualizaciones Futuras Posibles

- [ ] Historial de notificaciones enviadas
- [ ] Estadísticas de envío (cuántas por día, semana, mes)
- [ ] Recordatorios automáticos para el admin
- [ ] Exportación de lista de notificaciones pendientes
- [ ] Integración con calendario
- [ ] Modo oscuro/claro configurable
- [ ] Plantillas con imágenes o adjuntos

---

**Última actualización:** 30 de octubre de 2025
**Versión del sistema:** 2.0 - Semi-Automatizado
