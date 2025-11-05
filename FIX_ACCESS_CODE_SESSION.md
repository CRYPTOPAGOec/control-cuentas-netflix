# Fix: Sesión con Código de Acceso

## Problema
Después de que el usuario inicia sesión con código de acceso, ingresa por un momento pero luego es redirigido de vuelta a `login.html?next=%2Faccounts.html`.

## Causa Raíz
El sistema tenía dos tipos de autenticación:
1. **Admin**: Sesión de Supabase Auth (con contraseña)
2. **Usuario**: Código de acceso (sin sesión de Supabase)

Sin embargo, las páginas protegidas (`accounts.html`, `dashboard.html`) solo verificaban sesiones de Supabase, ignorando las sesiones con código de acceso almacenadas en `localStorage`.

## Solución Implementada

### 1. `assets/auth_guard.js`
Actualizado `getSessionUser()` para verificar primero si existe una sesión con código de acceso en `localStorage`:

```javascript
async function getSessionUser(){
  try{
    // Primero verificar si hay una sesión con código de acceso
    const accessCodeSession = localStorage.getItem('access_code_session');
    if(accessCodeSession){
      try{
        const sessionData = JSON.parse(accessCodeSession);
        // Verificar que el código no haya expirado
        if(sessionData.expires_at && new Date(sessionData.expires_at) > new Date()){
          // Retornar un objeto user-like para compatibilidad
          return {
            id: sessionData.user_id,
            email: sessionData.email,
            isAccessCodeUser: true,
            expires_at: sessionData.expires_at
          };
        } else {
          // Código expirado, limpiar localStorage
          localStorage.removeItem('access_code_session');
        }
      }catch(e){ 
        console.warn('Error parsing access_code_session', e);
        localStorage.removeItem('access_code_session');
      }
    }

    // Si no hay sesión con código, verificar sesión Supabase (admin)
    // ... resto del código
  }
}
```

### 2. `accounts.html`
Actualizado `initSession()` para manejar ambos tipos de sesión:

```javascript
async function initSession() {
  supabaseClient = await initSupabase();
  if (!supabaseClient) return;

  try {
    // Primero verificar si hay sesión con código de acceso
    const accessCodeSession = localStorage.getItem('access_code_session');
    if(accessCodeSession){
      // Validar y usar la sesión del código
      // ... lógica de validación
      return; // Sesión válida, continuar
    }

    // Si no hay sesión con código, validar sesión Supabase (admin)
    // ... resto del código
  }
}
```

## Flujo de Autenticación Actualizado

### Usuario con Código de Acceso
1. Login en `login.html` → Verifica código con `verify_access_code()`
2. Guarda sesión en `localStorage` con clave `access_code_session`
3. Redirige a `accounts.html`
4. `auth_guard.js` lee y valida la sesión del código
5. `accounts.html` lee la sesión y extrae `user_id` y `email`

### Admin con Contraseña
1. Login en `login.html` → Autentica con Supabase Auth
2. Supabase crea sesión JWT estándar
3. Verifica que sea admin con `is_admin()`
4. Redirige a `admin.html` o `accounts.html`
5. `auth_guard.js` valida sesión JWT de Supabase

## Archivos Modificados
- ✅ `assets/auth_guard.js` - Prioridad a sesiones con código
- ✅ `accounts.html` - Manejo dual de autenticación
- ✅ `fix_verify_access_code_ambiguity.sql` - Corrige ambigüedad en SQL

## Testing
1. ✅ Login con código de acceso → Debe permanecer en accounts.html
2. ✅ Login como admin → Debe permanecer en admin.html o accounts.html
3. ✅ Logout con código → Limpia localStorage
4. ✅ Logout como admin → SignOut de Supabase
5. ✅ Código expirado → Redirige a login

## Fecha
5 de noviembre de 2025
