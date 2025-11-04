# 🚂 Guía de Deployment en Railway

## Variables de Entorno Requeridas

Debes configurar estas variables en el dashboard de Railway:

### 🔑 Variables Obligatorias:
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
PORT=3000
```

### 📋 Dónde obtener las credenciales:

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

## 🔐 Autenticación de Administradores

A partir de la versión 2.0, el sistema utiliza **autenticación JWT basada en sesión**:

- Los administradores inician sesión con su **email y contraseña** (no se requiere ADMIN_SECRET)
- La sesión se mantiene entre dispositivos usando Supabase Auth
- El backend valida el token JWT y verifica permisos de admin
- Ya no es necesario introducir manualmente el ADMIN_SECRET desde el frontend

## 🎯 Archivos de Configuración Creados:
- ✅ railway.json - Configuración de build y deploy
- ✅ .railwayignore - Archivos a ignorar en el deploy
- ✅ package.json - Ya tiene el script "start" configurado

## 📦 El servidor expone estos endpoints:
- GET /_health - Verificar estado del servidor
- GET /admin/users - Listar usuarios (requiere Authorization: Bearer <token>)
- POST /admin/users - Crear usuario (requiere Authorization: Bearer <token>)
- PUT /admin/users/:id - Actualizar usuario (requiere Authorization: Bearer <token>)
- DELETE /admin/users/:id - Eliminar usuario (requiere Authorization: Bearer <token>)
- POST /admin/users/:id/toggle - Habilitar/deshabilitar usuario (requiere Authorization: Bearer <token>)
