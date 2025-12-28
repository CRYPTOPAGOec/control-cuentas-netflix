-- ================================================
-- SISTEMA DE CONFIGURACIÓN DE AUTOMATIZACIÓN
-- Creado: 28 diciembre 2025
-- ================================================

-- Tabla para configuración de automatización
CREATE TABLE IF NOT EXISTS automation_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'maintenance')),
  config jsonb NOT NULL DEFAULT '{
    "intervals": {
      "bulk": 3000,
      "retry": 5000,
      "check": 60000
    },
    "limits": {
      "maxPerHour": 50,
      "maxRetries": 3,
      "cooldownMinutes": 30
    },
    "notificationTypes": {
      "3_days_before": {"enabled": true, "priority": 3, "interval": 2000},
      "2_days_before": {"enabled": true, "priority": 3, "interval": 2000},
      "1_day_before": {"enabled": true, "priority": 2, "interval": 2000},
      "due_today": {"enabled": true, "priority": 1, "interval": 1000},
      "overdue": {"enabled": true, "priority": 1, "interval": 1000},
      "renewal": {"enabled": true, "priority": 4, "interval": 3000}
    }
  }'::jsonb,
  paused_at timestamptz,
  paused_by uuid REFERENCES auth.users(id),
  paused_reason text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Tabla para logs de acciones de automatización
CREATE TABLE IF NOT EXISTS automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL, -- 'pause', 'resume', 'config_change', 'maintenance_mode', 'limit_reached', 'error'
  config_before jsonb,
  config_after jsonb,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Tabla para tracking de envíos (rate limiting y estadísticas)
CREATE TABLE IF NOT EXISTS notification_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES netflix_accounts(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  success boolean DEFAULT true,
  error_message text,
  phone text,
  message_id text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON automation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_logs_action ON automation_logs(action);
CREATE INDEX IF NOT EXISTS idx_notification_tracking_sent_at ON notification_tracking(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_tracking_account_id ON notification_tracking(account_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_automation_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER automation_config_updated_at
  BEFORE UPDATE ON automation_config
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_config_updated_at();

-- Insertar configuración por defecto si no existe
INSERT INTO automation_config (id, status, config)
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'active',
  '{
    "intervals": {
      "bulk": 3000,
      "retry": 5000,
      "check": 60000
    },
    "limits": {
      "maxPerHour": 50,
      "maxRetries": 3,
      "cooldownMinutes": 30
    },
    "notificationTypes": {
      "3_days_before": {"enabled": true, "priority": 3, "interval": 2000},
      "2_days_before": {"enabled": true, "priority": 3, "interval": 2000},
      "1_day_before": {"enabled": true, "priority": 2, "interval": 2000},
      "due_today": {"enabled": true, "priority": 1, "interval": 1000},
      "overdue": {"enabled": true, "priority": 1, "interval": 1000},
      "renewal": {"enabled": true, "priority": 4, "interval": 3000}
    }
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- POLÍTICAS RLS (Row Level Security)
-- ================================================

ALTER TABLE automation_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_tracking ENABLE ROW LEVEL SECURITY;

-- Permitir acceso completo mediante service_role (usado por el backend)
-- Las políticas se bypassean cuando se usa service_role key desde el backend

-- Permitir lectura de configuración (el backend con service_role puede acceder)
CREATE POLICY "Allow service role read automation_config" ON automation_config
  FOR SELECT
  USING (true);

-- Permitir actualización de configuración (el backend con service_role puede acceder)
CREATE POLICY "Allow service role update automation_config" ON automation_config
  FOR UPDATE
  USING (true);

-- Permitir lectura de logs (el backend con service_role puede acceder)
CREATE POLICY "Allow service role read automation_logs" ON automation_logs
  FOR SELECT
  USING (true);

-- Permitir inserción de logs (el backend con service_role puede acceder)
CREATE POLICY "Allow service role insert automation_logs" ON automation_logs
  FOR INSERT
  WITH CHECK (true);

-- Permitir lectura de tracking (el backend con service_role puede acceder)
CREATE POLICY "Allow service role read notification_tracking" ON notification_tracking
  FOR SELECT
  USING (true);

-- Permitir inserción de tracking (el backend con service_role puede acceder)
CREATE POLICY "Allow service role insert notification_tracking" ON notification_tracking
  FOR INSERT
  WITH CHECK (true);

-- ================================================
-- FUNCIONES HELPER
-- ================================================

-- Función para obtener estadísticas de envío del día
CREATE OR REPLACE FUNCTION get_today_notification_stats()
RETURNS TABLE (
  total_sent bigint,
  total_failed bigint,
  total_pending bigint,
  by_type jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE success = true) as total_sent,
    COUNT(*) FILTER (WHERE success = false) as total_failed,
    0::bigint as total_pending,
    jsonb_object_agg(
      notification_type,
      jsonb_build_object(
        'sent', COUNT(*) FILTER (WHERE success = true),
        'failed', COUNT(*) FILTER (WHERE success = false)
      )
    ) as by_type
  FROM notification_tracking
  WHERE sent_at >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(hour_limit integer)
RETURNS boolean AS $$
DECLARE
  messages_last_hour integer;
BEGIN
  SELECT COUNT(*)
  INTO messages_last_hour
  FROM notification_tracking
  WHERE sent_at >= (now() - interval '1 hour')
  AND success = true;
  
  RETURN messages_last_hour < hour_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE automation_config IS 'Configuración global del sistema de automatización de notificaciones';
COMMENT ON TABLE automation_logs IS 'Registro de acciones administrativas sobre el sistema de automatización';
COMMENT ON TABLE notification_tracking IS 'Tracking de todas las notificaciones enviadas para rate limiting y estadísticas';
