-- Políticas RLS para la tabla netflix_accounts
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Asegurarse de que RLS esté habilitado (ya lo está según el error)
ALTER TABLE public.netflix_accounts ENABLE ROW LEVEL SECURITY;

-- 2. Crear política para que los usuarios puedan insertar sus propios registros
DROP POLICY IF EXISTS "Users can insert their own netflix accounts" ON public.netflix_accounts;
CREATE POLICY "Users can insert their own netflix accounts"
ON public.netflix_accounts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Crear política para que los usuarios puedan leer sus propios registros
DROP POLICY IF EXISTS "Users can view their own netflix accounts" ON public.netflix_accounts;
CREATE POLICY "Users can view their own netflix accounts"
ON public.netflix_accounts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Crear política para que los usuarios puedan actualizar sus propios registros
DROP POLICY IF EXISTS "Users can update their own netflix accounts" ON public.netflix_accounts;
CREATE POLICY "Users can update their own netflix accounts"
ON public.netflix_accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Crear política para que los usuarios puedan eliminar sus propios registros
DROP POLICY IF EXISTS "Users can delete their own netflix accounts" ON public.netflix_accounts;
CREATE POLICY "Users can delete their own netflix accounts"
ON public.netflix_accounts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- IMPORTANTE: Si quieres permitir inserts sin autenticación (para pruebas), usa esta política adicional:
-- (NO RECOMENDADO en producción)
-- CREATE POLICY "Allow anonymous inserts for testing"
-- ON public.netflix_accounts
-- FOR INSERT
-- TO anon
-- WITH CHECK (true);

-- ==============================================================================
-- POLÍTICAS PARA TABLA DE AUDITORÍA (netflix_accounts_audit)
-- ==============================================================================

-- Habilitar RLS en la tabla de auditoría
ALTER TABLE public.netflix_accounts_audit ENABLE ROW LEVEL SECURITY;

-- Permitir que el trigger inserte en la tabla de auditoría (usando SECURITY DEFINER)
-- O permitir inserts desde usuarios autenticados
DROP POLICY IF EXISTS "Allow authenticated users to insert audit logs" ON public.netflix_accounts_audit;
CREATE POLICY "Allow authenticated users to insert audit logs"
ON public.netflix_accounts_audit
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir que usuarios lean sus propios logs de auditoría (basado en el changed_by)
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.netflix_accounts_audit;
CREATE POLICY "Users can view their own audit logs"
ON public.netflix_accounts_audit
FOR SELECT
TO authenticated
USING (changed_by = auth.uid()::text);

-- Opcionalmente, permitir que el sistema (service role) tenga acceso completo
-- Esta política solo aplica cuando se usa la service role key
DROP POLICY IF EXISTS "Service role has full access to audit logs" ON public.netflix_accounts_audit;
CREATE POLICY "Service role has full access to audit logs"
ON public.netflix_accounts_audit
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
