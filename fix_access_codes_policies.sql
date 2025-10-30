-- Fix para recursión infinita en políticas de access_codes
-- Ejecutar este script en el editor SQL de Supabase

-- Primero, eliminar todas las políticas existentes de access_codes
DROP POLICY IF EXISTS "Users can view their own access codes" ON access_codes;
DROP POLICY IF EXISTS "Admins can view all access codes" ON access_codes;
DROP POLICY IF EXISTS "Admins can create access codes" ON access_codes;
DROP POLICY IF EXISTS "Admins can update access codes" ON access_codes;
DROP POLICY IF EXISTS "Admins can delete access codes" ON access_codes;

-- Deshabilitar RLS temporalmente para recrear políticas
ALTER TABLE access_codes DISABLE ROW LEVEL SECURITY;

-- Volver a habilitar RLS
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Política simplificada: Los usuarios pueden ver solo sus propios códigos
CREATE POLICY "Users can view their own access codes"
  ON access_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para admins: usar una verificación más simple sin recursión
-- Usamos user_metadata para verificar si es admin
CREATE POLICY "Service role can manage all access codes"
  ON access_codes
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Alternativamente, si prefieres usar la tabla user_roles sin recursión:
-- Primero elimina la política anterior si existe
DROP POLICY IF EXISTS "Service role can manage all access codes" ON access_codes;

-- Crear política que use una función helper para evitar recursión
CREATE OR REPLACE FUNCTION is_admin_simple()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Política para admins usando la función helper
CREATE POLICY "Admins can manage all access codes"
  ON access_codes
  FOR ALL
  USING (
    is_admin_simple() = true
  );

-- Comentario de documentación
COMMENT ON FUNCTION is_admin_simple IS 'Función helper para verificar si el usuario actual es admin sin causar recursión en RLS';
