-- Script para configurar roles de usuario y hacer admin a atreyucasta2@gmail.com
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Crear tabla de roles de usuario
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Habilitar RLS en user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_roles: solo admins pueden ver/modificar roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 2. Asignar rol de admin a atreyucasta2@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'atreyucasta2@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = now();

-- 3. Función helper para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- 4. Actualizar políticas de netflix_accounts para que admins vean todo
DROP POLICY IF EXISTS "Users can view their own netflix accounts" ON public.netflix_accounts;
CREATE POLICY "Users can view their own netflix accounts"
ON public.netflix_accounts
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS "Users can update their own netflix accounts" ON public.netflix_accounts;
CREATE POLICY "Users can update their own netflix accounts"
ON public.netflix_accounts
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR public.is_admin()
)
WITH CHECK (
  user_id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS "Users can delete their own netflix accounts" ON public.netflix_accounts;
CREATE POLICY "Users can delete their own netflix accounts"
ON public.netflix_accounts
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() OR public.is_admin()
);

-- 5. Política especial para que admins puedan insertar cuentas para cualquier usuario
DROP POLICY IF EXISTS "Users can insert their own netflix accounts" ON public.netflix_accounts;
CREATE POLICY "Users can insert their own netflix accounts"
ON public.netflix_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR public.is_admin()
);

-- 6. Actualizar políticas de auditoría para que admins vean todo
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.netflix_accounts_audit;
CREATE POLICY "Users can view their own audit logs"
ON public.netflix_accounts_audit
FOR SELECT
TO authenticated
USING (
  changed_by = auth.uid()::text OR public.is_admin()
);

-- 7. Verificar que el usuario admin fue creado correctamente
SELECT 
  u.email, 
  ur.role,
  ur.created_at as role_assigned_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'atreyucasta2@gmail.com';
