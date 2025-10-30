# 🚂 Guía de Deployment en Railway

## Variables de Entorno Requeridas

Debes configurar estas variables en el dashboard de Railway:

### 🔑 Variables Obligatorias:
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
ADMIN_SECRET=tu_secreto_admin_muy_seguro_aqui
PORT=3000
```

### 📋 Dónde obtener las credenciales:

1. **SUPABASE_URL**: 
   - Ve a tu proyecto en Supabase
   - Settings > API > Project URL

2. **SUPABASE_SERVICE_ROLE_KEY**: 
   - Settings > API > Project API keys > service_role key
   - ⚠️ IMPORTANTE: Esta key es secreta, nunca la compartas

3. **ADMIN_SECRET**: 
   - Genera un secreto seguro (ej: `openssl rand -hex 32`)
   - Este secreto se usará en la cabecera `x-admin-secret` para autenticar operaciones admin

4. **PORT**: 
   - Railway lo asigna automáticamente
   - El valor por defecto 3000 funciona si no se especifica

## 🎯 Archivos de Configuración Creados:
- ✅ railway.json - Configuración de build y deploy
- ✅ .railwayignore - Archivos a ignorar en el deploy
- ✅ package.json - Ya tiene el script "start" configurado

## 📦 El servidor expone estos endpoints:
- GET /_health - Verificar estado del servidor
- GET /admin/users - Listar usuarios (requiere x-admin-secret)
- POST /admin/user - Crear usuario admin (requiere x-admin-secret)
- POST /admin/user/:id/make-admin - Hacer usuario admin (requiere x-admin-secret)
- DELETE /admin/user/:id - Eliminar usuario (requiere x-admin-secret)
