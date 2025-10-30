# Sistema de Códigos de Acceso - Instrucciones

## 📋 Pasos para implementar el sistema

### 1. Ejecutar el Script SQL en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. En el menú lateral, haz clic en **SQL Editor**
3. Crea una nueva query
4. Copia y pega todo el contenido del archivo `access_codes_schema.sql`
5. Haz clic en **Run** para ejecutar el script

El script creará:
- ✅ Tabla `access_codes` con todos los campos necesarios
- ✅ Índices para optimizar las búsquedas
- ✅ Políticas RLS (Row Level Security) para seguridad
- ✅ Funciones para generar y verificar códigos

### 2. Verificar la instalación

Después de ejecutar el script, verifica que la tabla se creó correctamente:

```sql
SELECT * FROM access_codes LIMIT 5;
```

### 3. Probar las funciones

Puedes probar la función de generación de códigos:

```sql
SELECT generate_access_code();
```

### 4. Usar el sistema

#### Como Administrador:

1. Accede a `admin.html`
2. Haz clic en **"Crear Usuario"**
3. Ingresa el correo del nuevo usuario
4. Selecciona la duración del acceso (7, 15, 30, 60, 90, 180 o 365 días)
5. El sistema generará automáticamente un código de 8 caracteres
6. **Copia y envía** el código al usuario

#### Gestión de códigos existentes:

- 🔑 **Botón "Código"**: Genera un nuevo código para un usuario (desactiva el anterior)
- 👤 **Tabla de usuarios**: Muestra el código activo y días restantes
- ⚠️ **Alertas visuales**: Los códigos que expiran en menos de 7 días aparecen en amarillo

#### Como Usuario:

1. Accede a `login.html`
2. Ingresa tu correo electrónico
3. Ingresa el código de 8 caracteres proporcionado por el administrador
4. Haz clic en **"Iniciar sesión con código"**

El sistema verificará:
- ✅ Que el código exista
- ✅ Que corresponda a tu correo
- ✅ Que no haya expirado
- ✅ Que esté activo

## 🔒 Seguridad

### Ventajas del sistema de códigos:

1. **Control total del administrador**: Solo el admin puede crear usuarios y códigos
2. **No hay contraseñas**: No hay riesgo de contraseñas débiles o filtradas
3. **Acceso temporal**: Los usuarios solo tienen acceso por el período definido
4. **Renovación fácil**: El admin puede generar nuevos códigos cuando expiren
5. **Sin registro público**: No hay forma de auto-registrarse

### Formato del código:

- 8 caracteres alfanuméricos
- Solo mayúsculas: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- Excluye caracteres confusos: `I, O, 0, 1`
- Ejemplo: `A7K9M2X5`

## 📊 Tabla de códigos

La tabla `access_codes` incluye:

| Campo | Descripción |
|-------|-------------|
| `id` | UUID único del código |
| `user_id` | UUID del usuario (FK a auth.users) |
| `code` | Código alfanumérico de 8 caracteres (único) |
| `duration_days` | Duración en días del acceso |
| `expires_at` | Fecha y hora de expiración |
| `created_at` | Fecha de creación |
| `created_by` | UUID del admin que creó el código |
| `is_active` | Indica si el código está activo |
| `last_used_at` | Última vez que se usó para login |

## 🔧 Funciones SQL disponibles

### `generate_access_code()`
Genera un código aleatorio de 8 caracteres.

### `verify_access_code(p_email TEXT, p_code TEXT)`
Verifica si un código es válido para un correo específico.

**Retorna:**
- `is_valid`: BOOLEAN - Si el código es válido y activo
- `user_id`: UUID - ID del usuario
- `expires_at`: TIMESTAMPTZ - Fecha de expiración

### `get_user_active_code(p_user_id UUID)`
Obtiene el código activo de un usuario.

**Retorna:**
- `code`: TEXT - El código activo
- `expires_at`: TIMESTAMPTZ - Fecha de expiración
- `days_remaining`: INTEGER - Días restantes

## 🚀 Flujo completo

```
Admin crea usuario
      ↓
Sistema genera código único
      ↓
Admin envía código al usuario
      ↓
Usuario ingresa email + código
      ↓
Sistema verifica código
      ↓
Acceso concedido (o denegado si expiró)
```

## ⚠️ Notas importantes

1. **Desarrollo local**: El archivo `env.js` incluye `SUPABASE_SERVICE_ROLE_KEY` para desarrollo local. **NUNCA** uses esto en producción en el navegador.

2. **Producción**: Para producción, usa el `admin-server.js` en un servidor backend seguro con variables de entorno.

3. **Expiración**: Los códigos se verifican automáticamente al iniciar sesión. Los códigos expirados no permiten el acceso.

4. **Renovación**: Para renovar el acceso, el admin debe generar un nuevo código usando el botón "🔑 Código".

## 📝 Próximos pasos sugeridos

- [ ] Implementar notificaciones por correo cuando un código está por expirar
- [ ] Agregar histórico de códigos generados
- [ ] Dashboard con estadísticas de accesos
- [ ] Sistema de roles adicionales (además de admin)
- [ ] Logs de auditoría de accesos

---

**Versión**: 2.0  
**Última actualización**: Octubre 2025
