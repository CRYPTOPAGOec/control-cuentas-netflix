-- Fix: Corrige la ambigüedad en la columna expires_at en verify_access_code
-- Fecha: 5 de noviembre de 2025
-- Problema: Error "column reference 'expires_at' is ambiguous" al iniciar sesión con código

-- Nota: Este script es idempotente y se puede ejecutar múltiples veces

-- Eliminar la función existente si existe
DROP FUNCTION IF EXISTS verify_access_code(TEXT, TEXT);

-- Recrear la función sin ambigüedad
CREATE OR REPLACE FUNCTION verify_access_code(p_email TEXT, p_code TEXT)
RETURNS TABLE(is_valid BOOLEAN, user_id UUID, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (ac.is_active AND ac.expires_at > now()) as is_valid,
    ac.user_id,
    ac.expires_at as expires_at
  FROM access_codes ac
  INNER JOIN auth.users u ON u.id = ac.user_id
  WHERE u.email = p_email
    AND ac.code = p_code
  ORDER BY ac.created_at DESC
  LIMIT 1;
  
  -- Actualizar last_used_at si el código es válido
  -- Usar alias ac en UPDATE para evitar ambigüedad
  UPDATE access_codes ac
  SET last_used_at = now()
  WHERE ac.code = p_code
    AND ac.is_active = true
    AND ac.expires_at > now();
END;
$$;

-- Verificar que la función se creó correctamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.routines
    WHERE routine_name = 'verify_access_code'
      AND routine_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ Función verify_access_code creada/actualizada correctamente';
  ELSE
    RAISE EXCEPTION '❌ Error: La función verify_access_code no se creó';
  END IF;
END $$;
