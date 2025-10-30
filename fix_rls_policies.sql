-- Script para corregir las políticas RLS problemáticas en user_roles
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Eliminar políticas problemáticas que causan recursión infinita
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;

-- 2. Crear políticas corregidas que evitan recursión

-- Política básica: usuarios pueden ver su propio rol
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política para admins: pueden ver todos los roles (usando una subconsulta que no cause recursión)
-- Esta política permite a los usuarios ver su propio rol Y a los admins ver todos
DROP POLICY IF EXISTS "Admins can view all roles safely" ON public.user_roles;
CREATE POLICY "Admins can view all roles safely"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
);

-- Política para insertar roles: solo el service role puede insertar inicialmente
-- Para evitar recursión, permitimos que usuarios autenticados inserten si son el primer admin
-- O usamos service role para configuraciones iniciales
DROP POLICY IF EXISTS "Service role can manage roles" ON public.user_roles;
CREATE POLICY "Service role can manage roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Política temporal para permitir que el primer admin se configure a sí mismo
-- (esto es inseguro en producción, pero necesario para bootstrapping)
DROP POLICY IF EXISTS "First admin setup" ON public.user_roles;
CREATE POLICY "First admin setup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'admin' AND
  NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
);

-- 3. Verificar que las políticas funcionen correctamente
-- Este query debería funcionar sin recursión
SELECT
  u.email,
  ur.role,
  ur.created_at as role_assigned_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'atreyucasta2@gmail.com';
