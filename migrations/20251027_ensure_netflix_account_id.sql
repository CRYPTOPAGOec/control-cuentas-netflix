-- Migration: 20251027_ensure_netflix_account_id.sql
-- Objetivo: garantizar que la tabla public.netflix_accounts tenga un id válido
-- incluso cuando el cliente envíe explícitamente id = NULL.
-- Crea una función defensiva y un trigger BEFORE INSERT que asigna
-- uuid_generate_v4() cuando NEW.id IS NULL.

-- Nota: este script asume que la extensión uuid-ossp o pgcrypto está instalada.
-- Usa uuid_generate_v4() (uuid-ossp) porque el esquema actual mostraba ese DEFAULT.

BEGIN;

-- 1) Crear/actualizar la función que asegura id en inserts
CREATE OR REPLACE FUNCTION public.ensure_netflix_account_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si el cliente envía id NULL, generamos uno aquí
  IF NEW.id IS NULL THEN
    BEGIN
      -- Intenta usar uuid_generate_v4() si está disponible
      NEW.id := uuid_generate_v4();
    EXCEPTION WHEN undefined_function THEN
      -- Como fallback, intenta gen_random_uuid() (pgcrypto)
      NEW.id := gen_random_uuid();
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Crear trigger BEFORE INSERT que ejecute la función (idempotente)
DROP TRIGGER IF EXISTS trg_ensure_netflix_id ON public.netflix_accounts;
CREATE TRIGGER trg_ensure_netflix_id
BEFORE INSERT ON public.netflix_accounts
FOR EACH ROW
EXECUTE FUNCTION public.ensure_netflix_account_id();

COMMIT;
