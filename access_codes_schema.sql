-- Schema para sistema de códigos de acceso temporal
-- Ejecutar este script en el editor SQL de Supabase

-- Tabla para códigos de acceso
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  duration_days INTEGER NOT NULL DEFAULT 30,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  
  CONSTRAINT code_format CHECK (length(code) >= 8 AND length(code) <= 20)
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_access_codes_user_id ON access_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_expires_at ON access_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_access_codes_active ON access_codes(is_active) WHERE is_active = true;

-- Habilitar RLS
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver solo sus propios códigos
CREATE POLICY "Users can view their own access codes"
  ON access_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los admins pueden ver todos los códigos
CREATE POLICY "Admins can view all access codes"
  ON access_codes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Política: Solo admins pueden crear códigos
CREATE POLICY "Admins can create access codes"
  ON access_codes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Política: Solo admins pueden actualizar códigos
CREATE POLICY "Admins can update access codes"
  ON access_codes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Política: Solo admins pueden eliminar códigos
CREATE POLICY "Admins can delete access codes"
  ON access_codes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- Función para generar código alfanumérico seguro de 13 caracteres
CREATE OR REPLACE FUNCTION generate_access_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  uppercase TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ'; -- Sin I, O
  lowercase TEXT := 'abcdefghjkmnpqrstuvwxyz'; -- Sin i, l, o
  numbers TEXT := '23456789'; -- Sin 0, 1
  special TEXT := '@#$%&*';
  all_chars TEXT := uppercase || lowercase || numbers;
  result TEXT := '';
  special_char TEXT;
  insert_pos INTEGER;
  i INTEGER;
BEGIN
  -- Generar 12 caracteres alfanuméricos
  FOR i IN 1..12 LOOP
    result := result || substr(all_chars, floor(random() * length(all_chars) + 1)::int, 1);
  END LOOP;
  
  -- Agregar un carácter especial en posición aleatoria
  special_char := substr(special, floor(random() * length(special) + 1)::int, 1);
  insert_pos := floor(random() * (length(result) + 1))::int;
  result := substr(result, 1, insert_pos) || special_char || substr(result, insert_pos + 1);
  
  RETURN result;
END;
$$;

-- Función para verificar si un código es válido
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
    ac.expires_at
  FROM access_codes ac
  INNER JOIN auth.users u ON u.id = ac.user_id
  WHERE u.email = p_email
    AND ac.code = p_code
  ORDER BY ac.created_at DESC
  LIMIT 1;
  
  -- Actualizar last_used_at si el código es válido
  UPDATE access_codes
  SET last_used_at = now()
  WHERE code = p_code
    AND is_active = true
    AND expires_at > now();
END;
$$;

-- Función para obtener código activo de un usuario
CREATE OR REPLACE FUNCTION get_user_active_code(p_user_id UUID)
RETURNS TABLE(code TEXT, expires_at TIMESTAMPTZ, days_remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.code,
    ac.expires_at,
    GREATEST(0, EXTRACT(day FROM ac.expires_at - now())::INTEGER) as days_remaining
  FROM access_codes ac
  WHERE ac.user_id = p_user_id
    AND ac.is_active = true
    AND ac.expires_at > now()
  ORDER BY ac.expires_at DESC
  LIMIT 1;
END;
$$;

-- Comentarios para documentación
COMMENT ON TABLE access_codes IS 'Códigos de acceso temporal para usuarios';
COMMENT ON COLUMN access_codes.code IS 'Código alfanumérico de 13 caracteres (mayúsculas, minúsculas, números y 1 carácter especial @#$%&* para mayor seguridad)';
COMMENT ON COLUMN access_codes.duration_days IS 'Duración en días del código';
COMMENT ON COLUMN access_codes.expires_at IS 'Fecha y hora de expiración del código';
COMMENT ON COLUMN access_codes.is_active IS 'Indica si el código está activo (puede desactivarse manualmente)';
COMMENT ON COLUMN access_codes.last_used_at IS 'Última vez que se usó el código para iniciar sesión';
