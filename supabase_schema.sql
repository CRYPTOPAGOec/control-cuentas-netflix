-- supabase_schema_fixed_v2.sql
-- Esquema recomendado y corregido para la tabla `netflix_accounts` en Supabase (Postgres)

-- NOTA: Este script asume que tienes permiso para crear extensiones.
-- Si no puedes crear extensiones, elimina las líneas CREATE EXTENSION indicadas abajo.

-- 1) Extensiones (si procede)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS citext;

-- 2) Tabla principal: cuentas
CREATE TABLE IF NOT EXISTS public.netflix_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id text NOT NULL DEFAULT 'default',
  -- user_id se guarda como UUID para enlazar con auth.users (supabase)
  user_id uuid NOT NULL,
  propietario text,
  correo citext,
  fecha_compra date,
  fecha_pago date,
  fecha_caducidad date,
  precio numeric(10,2) CHECK (precio IS NULL OR precio >= 0),
  duracion_meses integer CHECK (duracion_meses IS NULL OR duracion_meses > 0),
  notas text,
  display_id text,
  -- Columna persistente que almacena el primer día del mes de fecha_compra
  fecha_compra_month date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 3) Índices útiles (sin usar funciones no-IMMUTABLE en expresiones de índice)
CREATE INDEX IF NOT EXISTS idx_netflix_app_user ON public.netflix_accounts (app_id, user_id);
CREATE INDEX IF NOT EXISTS idx_netflix_fecha_caducidad ON public.netflix_accounts (fecha_caducidad);
CREATE INDEX IF NOT EXISTS idx_netflix_correo ON public.netflix_accounts (correo);
CREATE INDEX IF NOT EXISTS idx_netflix_propietario ON public.netflix_accounts (propietario);
-- Índice sobre la columna persistente fecha_compra_month (válido)
CREATE INDEX IF NOT EXISTS idx_netflix_fecha_compra_month ON public.netflix_accounts (fecha_compra_month);

-- Índice único para evitar duplicados por app+user+display_id (acepta NULLs en display_id)
CREATE UNIQUE INDEX IF NOT EXISTS uidx_netflix_display_per_user ON public.netflix_accounts (app_id, user_id, display_id);

-- 4) Función y trigger para mantener fecha_compra_month y updated_at
CREATE OR REPLACE FUNCTION public.set_fecha_compra_month_and_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Normalizamos fecha_compra a la fecha del primer día del mes (date)
  IF (NEW.fecha_compra IS NOT NULL) THEN
    NEW.fecha_compra_month := (date_trunc('month', NEW.fecha_compra))::date;
  ELSE
    NEW.fecha_compra_month := NULL;
  END IF;

  -- Mantener updated_at
  NEW.updated_at := now();

  RETURN NEW;
END;
$$;

-- Reemplazamos cualquier trigger previo de updated_at por este que también mantiene fecha_compra_month
DROP TRIGGER IF EXISTS trg_netflix_set_updated_at ON public.netflix_accounts;
DROP TRIGGER IF EXISTS trg_netflix_set_fecha_compra_month_and_updated_at ON public.netflix_accounts;

CREATE TRIGGER trg_netflix_set_fecha_compra_month_and_updated_at
BEFORE INSERT OR UPDATE ON public.netflix_accounts
FOR EACH ROW EXECUTE FUNCTION public.set_fecha_compra_month_and_updated_at();

-- 4b) Trigger opcional: asignar user_id desde auth.uid() si el cliente no lo envía
-- Esto permite que clientes que no establecen user_id sigan la política WITH CHECK (user_id = auth.uid()).
CREATE OR REPLACE FUNCTION public.set_user_id_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si el cliente no incluyó user_id, intentamos obtenerlo desde el contexto de auth
  IF NEW.user_id IS NULL THEN
    -- auth.uid() puede devolver NULL si no hay contexto de auth (p. ej. service role)
    IF auth.uid() IS NOT NULL THEN
      BEGIN
        NEW.user_id := auth.uid()::uuid;
      EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'No se pudo convertir auth.uid() a UUID: %', auth.uid();
      END;
    ELSE
      -- En este punto no podemos inferir user_id: mejor lanzar un error explícito para que el cliente lo sepa
      RAISE EXCEPTION 'Inserción denegada: user_id no proporcionado y no se pudo inferir desde auth.uid(). Asegúrese de estar autenticado o incluya user_id en la inserción (solo con service role).';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_netflix_set_user_id_from_auth ON public.netflix_accounts;
CREATE TRIGGER trg_netflix_set_user_id_from_auth
BEFORE INSERT ON public.netflix_accounts
FOR EACH ROW EXECUTE FUNCTION public.set_user_id_from_auth();

-- 5) Tabla de auditoría (opcional, para registrar cambios)
CREATE TABLE IF NOT EXISTS public.netflix_accounts_audit (
  audit_id bigserial PRIMARY KEY,
  account_id uuid,
  operation text NOT NULL,
  changed_by text,
  changed_at timestamptz DEFAULT now() NOT NULL,
  old_data jsonb,
  new_data jsonb
);

-- 6) Función de auditoría
CREATE OR REPLACE FUNCTION public.netflix_accounts_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_changed_by text;
BEGIN
  -- auth.uid() puede ser NULL si no hay contexto de supabase auth
  BEGIN
    v_changed_by := auth.uid()::text;
  EXCEPTION WHEN others THEN
    v_changed_by := NULL;
  END;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.netflix_accounts_audit(account_id, operation, changed_by, old_data, new_data)
    VALUES (NEW.id, 'INSERT', v_changed_by, NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.netflix_accounts_audit(account_id, operation, changed_by, old_data, new_data)
    VALUES (NEW.id, 'UPDATE', v_changed_by, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.netflix_accounts_audit(account_id, operation, changed_by, old_data, new_data)
    VALUES (OLD.id, 'DELETE', v_changed_by, to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_netflix_accounts_audit ON public.netflix_accounts;

CREATE TRIGGER trg_netflix_accounts_audit
AFTER INSERT OR UPDATE OR DELETE ON public.netflix_accounts
FOR EACH ROW EXECUTE FUNCTION public.netflix_accounts_audit_trigger();

-- 7) Row Level Security (RLS) y políticas de ejemplo para Supabase Auth
ALTER TABLE public.netflix_accounts ENABLE ROW LEVEL SECURITY;

-- Permitir que usuarios autenticados lean sus propias filas (auth.uid() devuelve UUID)
DROP POLICY IF EXISTS select_own ON public.netflix_accounts;
CREATE POLICY select_own ON public.netflix_accounts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Permitir INSERT si el user_id coincide con el claim (evita que creen filas en nombre de otro)
DROP POLICY IF EXISTS insert_own ON public.netflix_accounts;
CREATE POLICY insert_own ON public.netflix_accounts
  FOR INSERT
  TO authenticated
  -- Permitimos también INSERTS donde user_id IS NULL mientras el cliente esté autenticado;
  -- el trigger `set_user_id_from_auth` intentará rellenarlo antes de la comprobación de constraints.
  WITH CHECK (user_id = auth.uid() OR (user_id IS NULL AND auth.uid() IS NOT NULL));

-- Permitir UPDATE solo sobre filas propias
DROP POLICY IF EXISTS update_own ON public.netflix_accounts;
CREATE POLICY update_own ON public.netflix_accounts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Permitir DELETE solo sobre filas propias
DROP POLICY IF EXISTS delete_own ON public.netflix_accounts;
CREATE POLICY delete_own ON public.netflix_accounts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 8) Recomendaciones de seguridad y notas
-- Si creas funciones SECURITY DEFINER para helpers, revoca EXECUTE de anon y authenticated:
-- REVOKE EXECUTE ON FUNCTION public.some_helper() FROM anon, authenticated;

-- Notas adicionales:
-- - auth.uid() retorna NULL cuando no hay contexto de auth (por ejemplo, llamadas del servicio).
-- - Ajusta las políticas si tu JWT usa otra claim para el ID de usuario.
-- - Si no puedes crear extensiones, elimina las líneas CREATE EXTENSION y:
--   - Si uuid-ossp está disponible, usa uuid_generate_v4() en lugar de gen_random_uuid()
--   - O genera UUIDs desde la aplicación cliente