-- Script para actualizar el sistema de códigos a versión más segura
-- Ejecutar este script en el editor SQL de Supabase

-- 1. Eliminar la restricción antigua de longitud
ALTER TABLE access_codes DROP CONSTRAINT IF EXISTS code_format;

-- 2. Agregar nueva restricción que permite códigos de 8 a 20 caracteres
ALTER TABLE access_codes ADD CONSTRAINT code_format CHECK (length(code) >= 8 AND length(code) <= 20);

-- 3. Actualizar la función de generación de códigos
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

-- 4. Actualizar comentario de documentación
COMMENT ON COLUMN access_codes.code IS 'Código alfanumérico de 13 caracteres (mayúsculas, minúsculas, números y 1 carácter especial @#$%&* para mayor seguridad)';

-- Nota: Los códigos antiguos de 8 caracteres seguirán funcionando.
-- Solo los nuevos códigos generados tendrán 13 caracteres con mayor seguridad.
