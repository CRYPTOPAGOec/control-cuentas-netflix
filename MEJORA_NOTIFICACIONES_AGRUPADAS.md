# 📦 Mejora: Sistema de Notificaciones Agrupadas

## 🎯 Descripción de la Mejora

Se ha implementado un sistema inteligente de **notificaciones agrupadas** que detecta automáticamente cuando un usuario tiene múltiples cuentas que caducan el mismo día y permite enviar una sola notificación consolidada en lugar de múltiples mensajes individuales.

---

## ✨ Características Implementadas

### 1. **Detección Automática de Cuentas Agrupables**
- El sistema detecta automáticamente cuando un usuario tiene varias cuentas con:
  - Mismo propietario
  - Mismo número de teléfono
  - Misma fecha de caducidad

### 2. **Indicadores Visuales en la Tabla**
- **Badge morado** al lado del nombre del propietario mostrando cuántas cuentas adicionales tiene
- **Contador en el botón de WhatsApp** (ej: 📱 (3)) indicando el número total de cuentas
- **Tooltip informativo** al pasar el mouse sobre el botón

### 3. **Modal de Selección Inteligente**
Cuando hay cuentas agrupadas, aparece un modal que permite elegir:
- **📄 Notificación Individual**: Enviar mensaje solo para la cuenta seleccionada
- **📦 Notificación Agrupada**: Enviar un solo mensaje con todas las cuentas (recomendado)

El modal muestra:
- Nombre del cliente y teléfono
- Lista detallada de todas las cuentas agrupadas con:
  - Servicio (Netflix, etc.)
  - Correo de la cuenta
  - Precio
  - Fecha de caducidad

### 4. **Plantillas de Mensajes Agrupados**
Se han creado 3 nuevas plantillas especializadas:

#### a) **Pago Agrupado**
```
Hola {propietario},

Te recordamos que tienes *{cantidad_cuentas} cuentas* que vencen próximamente el *{fechaCaducidad}*.

📋 *Detalle de tus cuentas:*
1. *Netflix* (correo@ejemplo.com)
   💵 Precio: $5.00
   📅 Vence: 2025-12-15

2. *Netflix* (correo2@ejemplo.com)
   💵 Precio: $5.00
   📅 Vence: 2025-12-15

💰 *Total a pagar: $10.00*

Por favor realiza tu pago a tiempo para evitar interrupciones en tus servicios.

¡Gracias por tu preferencia! 😊
```

#### b) **Renovación Próxima Agrupada**
Igual que la anterior pero con mensaje enfocado en renovación

#### c) **Confirmación de Pago Agrupada**
Para confirmar el pago de múltiples cuentas a la vez

### 5. **Variables Disponibles en Plantillas Agrupadas**
- `{propietario}` - Nombre del cliente
- `{telefono}` - Número de teléfono
- `{cantidad_cuentas}` - Número total de cuentas
- `{fechaCaducidad}` - Fecha de caducidad (común a todas)
- `{cuentas_lista}` - Lista formateada de todas las cuentas
- `{total_precio}` - Suma total de todas las cuentas

---

## 🚀 Cómo Usar

### Flujo Básico:

1. **Visualizar las cuentas próximas a vencer**
   - En el dashboard, verás badges morados (📦 +2) al lado de usuarios con múltiples cuentas
   - El botón de WhatsApp mostrará el contador: 📱 (3)

2. **Hacer clic en el botón de notificación**
   - Si hay cuentas agrupadas, aparecerá el modal de selección
   - Revisa la lista de cuentas que se agruparían

3. **Elegir el tipo de notificación**
   - **Individual**: Solo se notifica la cuenta seleccionada
   - **Agrupada**: Se crea un mensaje con todas las cuentas del mismo día

4. **Seleccionar plantilla de mensaje**
   - Las plantillas se adaptan automáticamente:
     - Si es individual: usa plantillas estándar
     - Si es agrupada: usa plantillas especiales con lista de cuentas

5. **Enviar por WhatsApp**
   - El mensaje se abre en WhatsApp Web listo para enviar
   - Verifica y envía manualmente

---

## 💡 Beneficios

### ✅ Para el Administrador:
- **Ahorro de tiempo**: Envía un solo mensaje en lugar de 3, 4 o más
- **Menos repetitivo**: No hay que abrir WhatsApp múltiples veces
- **Más eficiente**: Procesa más clientes en menos tiempo
- **Menos propenso a errores**: Reduces la posibilidad de olvidar alguna cuenta

### ✅ Para el Cliente:
- **Menos spam**: Recibe un solo mensaje consolidado
- **Más claridad**: Ve todas sus cuentas en un solo lugar
- **Mejor experiencia**: No recibe múltiples notificaciones seguidas
- **Total transparencia**: Puede ver el desglose completo

### ✅ Para el Negocio:
- **Más profesional**: Comunicación organizada y clara
- **Mejor imagen**: No molestas al cliente con múltiples mensajes
- **Mayor satisfacción**: Clientes aprecian la claridad

---

## 🎨 Elementos Visuales

### Badge de Agrupamiento
```
Juan Pérez 📦 +2
```
Indica que Juan tiene 2 cuentas adicionales con la misma fecha

### Botón de Notificación con Contador
```
📱 (3)
```
Indica que se notificarán 3 cuentas en total

### Modal de Selección
- Fondo con efecto glass
- Iconos grandes para cada opción
- Información clara del cliente
- Lista expandible de cuentas

---

## 🔧 Detalles Técnicos

### Archivos Modificados:
- `dashboard.html`

### Nuevas Funciones Agregadas:
1. `findGroupedAccounts(accountId)` - Busca cuentas del mismo usuario y fecha
2. `openNotificationChoiceModal(accountId)` - Abre modal de selección
3. `closeNotificationChoiceModal()` - Cierra modal de selección
4. `proceedWithSingleNotification()` - Procede con notificación individual
5. `proceedWithGroupedNotification()` - Procede con notificación agrupada
6. `openNotificationModalDirect(accountId, isGrouped)` - Abre modal de notificación
7. `processGroupedTemplate(template, accounts)` - Procesa plantillas agrupadas

### Nuevas Variables Globales:
- `groupedAccountsForNotification` - Array de cuentas agrupadas
- `pendingAccountId` - ID de cuenta que activó el modal
- `isGroupedNotification` - Flag para saber si es agrupada

### Nuevos Estilos CSS:
- `.grouped-badge` - Badge morado para indicador de agrupamiento
- `.account-list-item` - Estilo para items en lista de cuentas

---

## 📊 Ejemplo de Uso Real

### Escenario:
María González tiene 3 cuentas de Netflix que caducan el 15 de diciembre de 2025:
- Cuenta 1: maria@gmail.com - $5.00
- Cuenta 2: maria.trabajo@gmail.com - $5.00
- Cuenta 3: gonzalez.maria@hotmail.com - $4.50

### Antes (3 mensajes):
```
Mensaje 1:
"Hola María, tu cuenta maria@gmail.com vence el 15/12/2025. Precio: $5.00..."

Mensaje 2:
"Hola María, tu cuenta maria.trabajo@gmail.com vence el 15/12/2025. Precio: $5.00..."

Mensaje 3:
"Hola María, tu cuenta gonzalez.maria@hotmail.com vence el 15/12/2025. Precio: $4.50..."
```

### Ahora (1 mensaje):
```
Hola María,

Te recordamos que tienes *3 cuentas* que vencen próximamente el *15/12/2025*.

📋 *Detalle de tus cuentas:*

1. *Netflix* (maria@gmail.com)
   💵 Precio: $5.00
   📅 Vence: 15/12/2025

2. *Netflix* (maria.trabajo@gmail.com)
   💵 Precio: $5.00
   📅 Vence: 15/12/2025

3. *Netflix* (gonzalez.maria@hotmail.com)
   💵 Precio: $4.50
   📅 Vence: 15/12/2025

💰 *Total a pagar: $14.50*

Por favor realiza tu pago a tiempo para evitar interrupciones en tus servicios.

¡Gracias por tu preferencia! 😊
```

---

## ⚙️ Configuración

No requiere configuración adicional. El sistema funciona automáticamente detectando las cuentas agrupables.

### Criterios de Agrupamiento:
- ✅ Mismo propietario (nombre)
- ✅ Mismo teléfono
- ✅ Misma fecha de caducidad exacta

Si alguno de estos criterios no se cumple, las cuentas NO se agruparán.

---

## 🐛 Solución de Problemas

### Las cuentas no se agrupan
**Verificar:**
- Que el nombre del propietario sea exactamente igual
- Que el número de teléfono sea idéntico
- Que la fecha de caducidad sea la misma

### No aparece el modal de selección
**Causa:** Solo hay una cuenta para ese usuario en esa fecha
**Solución:** Normal, el sistema va directo a notificación individual

### El badge no aparece
**Verificar:** Que existan cuentas en la vista actual (filtro de 7 o 30 días)

---

## 🎯 Próximas Mejoras Sugeridas

1. **Agrupar por rango de fechas**: Agrupar cuentas que caducan en la misma semana
2. **Configuración de agrupamiento**: Permitir al admin elegir criterios
3. **Historial de notificaciones**: Ver qué notificaciones se enviaron
4. **Plantillas personalizables**: Editor de plantillas en el admin
5. **Envío programado**: Programar envíos automáticos

---

## 📝 Notas Importantes

- ⚠️ El sistema NO envía mensajes automáticamente, siempre abre WhatsApp Web para confirmación manual
- 🔒 Los datos se procesan localmente, no se envían a ningún servidor externo
- 📱 Requiere WhatsApp Web funcional en el navegador
- ✅ Compatible con todos los navegadores modernos

---

## 🏆 Resultado Final

Una experiencia mucho más eficiente tanto para el administrador como para los clientes, con menos mensajes, más claridad y mejor organización.

**Ahorro estimado de tiempo**: 60-70% al notificar usuarios con múltiples cuentas.

---

*Documentación actualizada: 13 de noviembre de 2025*
