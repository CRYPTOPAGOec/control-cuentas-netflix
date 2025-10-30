-- =====================================================
-- MEJORA: Detección automática de pago confirmado
-- =====================================================
-- Este script agrega la lógica para que el sistema
-- detecte automáticamente cuando un pago fue confirmado
-- y deje de enviar notificaciones
-- =====================================================

-- PASO 1: Agregar campos a netflix_accounts
-- =====================================================

-- Opción A: Campo simple de confirmación (RECOMENDADO)
ALTER TABLE netflix_accounts 
ADD COLUMN IF NOT EXISTS pago_confirmado BOOLEAN DEFAULT FALSE;

-- Opción B: Campos detallados (si quieres más control)
ALTER TABLE netflix_accounts 
ADD COLUMN IF NOT EXISTS pago_confirmado_fecha TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pago_confirmado_por UUID REFERENCES auth.users(id);

-- Índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_netflix_pago_confirmado 
ON netflix_accounts(pago_confirmado) 
WHERE pago_confirmado = FALSE;

-- Comentarios
COMMENT ON COLUMN netflix_accounts.pago_confirmado IS 'Indica si el pago del período actual ya fue confirmado/recibido';
COMMENT ON COLUMN netflix_accounts.pago_confirmado_fecha IS 'Fecha y hora en que se confirmó el pago';
COMMENT ON COLUMN netflix_accounts.pago_confirmado_por IS 'Usuario que confirmó el pago';


-- =====================================================
-- PASO 2: Actualizar función get_pending_notifications
-- =====================================================

-- Eliminar la función anterior (necesario porque cambia el tipo de retorno)
DROP FUNCTION IF EXISTS get_pending_notifications(UUID);

-- Esta función ahora EXCLUYE las cuentas con pago confirmado
CREATE OR REPLACE FUNCTION get_pending_notifications(p_user_id UUID)
RETURNS TABLE (
  account_id UUID,
  propietario VARCHAR,
  telefono VARCHAR,
  servicio VARCHAR,
  precio NUMERIC,
  fecha_pago DATE,
  fecha_caducidad DATE,
  notification_type VARCHAR,
  days_until_payment INTEGER,
  days_until_expiry INTEGER,
  last_notification_sent TIMESTAMP WITH TIME ZONE,
  pago_confirmado BOOLEAN
) AS $$
DECLARE
  v_settings RECORD;
BEGIN
  -- Obtener la configuración del usuario
  SELECT 
    auto_send_enabled,
    whatsapp_api_enabled,
    test_mode,
    send_reminder_3days,
    send_reminder_2days,
    send_reminder_1day,
    send_reminder_today,
    send_payment_overdue,
    min_hours_between_same_notification,
    max_notifications_per_day,
    send_on_weekdays
  INTO v_settings
  FROM notification_settings
  WHERE user_id = p_user_id;

  -- Si no hay configuración o está desactivada, retornar vacío
  IF v_settings IS NULL OR 
     NOT v_settings.auto_send_enabled OR 
     NOT v_settings.whatsapp_api_enabled THEN
    RETURN;
  END IF;

  -- Verificar que hoy sea un día permitido
  IF NOT (v_settings.send_on_weekdays @> to_jsonb(EXTRACT(DOW FROM CURRENT_DATE)::INTEGER)) THEN
    RETURN;
  END IF;

  -- Verificar límite diario de notificaciones
  IF (
    SELECT COUNT(*)
    FROM notification_logs
    WHERE user_id = p_user_id
      AND DATE(sent_at) = CURRENT_DATE
      AND status = 'sent'
  ) >= v_settings.max_notifications_per_day THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    na.id as account_id,
    na.propietario,
    na.telefono,
    na.servicio,
    na.precio,
    na.fecha_pago,
    na.fecha_caducidad,
    CASE 
      WHEN (na.fecha_pago - CURRENT_DATE) = 3 THEN 'pago_3dias'
      WHEN (na.fecha_pago - CURRENT_DATE) = 2 THEN 'pago_2dias'
      WHEN (na.fecha_pago - CURRENT_DATE) = 1 THEN 'pago_1dia'
      WHEN (na.fecha_pago - CURRENT_DATE) = 0 THEN 'pago_hoy'
      WHEN (na.fecha_pago - CURRENT_DATE) < 0 THEN 'pago_atrasado'
      WHEN (na.fecha_caducidad - CURRENT_DATE) <= 7 AND (na.fecha_caducidad - CURRENT_DATE) > 0 THEN 'renovacion_proxima'
      ELSE NULL
    END as notification_type,
    (na.fecha_pago - CURRENT_DATE)::INTEGER as days_until_payment,
    (na.fecha_caducidad - CURRENT_DATE)::INTEGER as days_until_expiry,
    (
      SELECT MAX(nl.sent_at)
      FROM notification_logs nl
      WHERE nl.account_id = na.id
        AND nl.notification_type = CASE 
          WHEN (na.fecha_pago - CURRENT_DATE) = 3 THEN 'pago_3dias'
          WHEN (na.fecha_pago - CURRENT_DATE) = 2 THEN 'pago_2dias'
          WHEN (na.fecha_pago - CURRENT_DATE) = 1 THEN 'pago_1dia'
          WHEN (na.fecha_pago - CURRENT_DATE) = 0 THEN 'pago_hoy'
          WHEN (na.fecha_pago - CURRENT_DATE) < 0 THEN 'pago_atrasado'
          WHEN (na.fecha_caducidad - CURRENT_DATE) <= 7 AND (na.fecha_caducidad - CURRENT_DATE) > 0 THEN 'renovacion_proxima'
          ELSE NULL
        END
        AND nl.status = 'sent'
    ) as last_notification_sent,
    na.pago_confirmado
  FROM netflix_accounts na
  WHERE na.user_id = p_user_id
    AND na.telefono IS NOT NULL
    AND na.telefono != ''
    -- 🔥 CLAVE: Excluir cuentas con pago confirmado
    AND (na.pago_confirmado IS NULL OR na.pago_confirmado = FALSE)
    AND (
      (na.fecha_pago - CURRENT_DATE) BETWEEN -7 AND 3
      OR (na.fecha_caducidad - CURRENT_DATE) BETWEEN 0 AND 7
    )
    -- Validar que el tipo de recordatorio esté habilitado
    AND (
      (v_settings.send_reminder_3days AND (na.fecha_pago - CURRENT_DATE) = 3) OR
      (v_settings.send_reminder_2days AND (na.fecha_pago - CURRENT_DATE) = 2) OR
      (v_settings.send_reminder_1day AND (na.fecha_pago - CURRENT_DATE) = 1) OR
      (v_settings.send_reminder_today AND (na.fecha_pago - CURRENT_DATE) = 0) OR
      (v_settings.send_payment_overdue AND (na.fecha_pago - CURRENT_DATE) < 0) OR
      ((na.fecha_caducidad - CURRENT_DATE) <= 7 AND (na.fecha_caducidad - CURRENT_DATE) > 0)
    )
    -- Anti-spam: No enviar si ya se envió recientemente el mismo tipo
    AND (
      (
        SELECT MAX(nl.sent_at)
        FROM notification_logs nl
        WHERE nl.account_id = na.id
          AND nl.notification_type = CASE 
            WHEN (na.fecha_pago - CURRENT_DATE) = 3 THEN 'pago_3dias'
            WHEN (na.fecha_pago - CURRENT_DATE) = 2 THEN 'pago_2dias'
            WHEN (na.fecha_pago - CURRENT_DATE) = 1 THEN 'pago_1dia'
            WHEN (na.fecha_pago - CURRENT_DATE) = 0 THEN 'pago_hoy'
            WHEN (na.fecha_pago - CURRENT_DATE) < 0 THEN 'pago_atrasado'
            WHEN (na.fecha_caducidad - CURRENT_DATE) <= 7 AND (na.fecha_caducidad - CURRENT_DATE) > 0 THEN 'renovacion_proxima'
            ELSE NULL
          END
          AND nl.status = 'sent'
      ) IS NULL
      OR 
      (
        SELECT MAX(nl.sent_at)
        FROM notification_logs nl
        WHERE nl.account_id = na.id
          AND nl.notification_type = CASE 
            WHEN (na.fecha_pago - CURRENT_DATE) = 3 THEN 'pago_3dias'
            WHEN (na.fecha_pago - CURRENT_DATE) = 2 THEN 'pago_2dias'
            WHEN (na.fecha_pago - CURRENT_DATE) = 1 THEN 'pago_1dia'
            WHEN (na.fecha_pago - CURRENT_DATE) = 0 THEN 'pago_hoy'
            WHEN (na.fecha_pago - CURRENT_DATE) < 0 THEN 'pago_atrasado'
            WHEN (na.fecha_caducidad - CURRENT_DATE) <= 7 AND (na.fecha_caducidad - CURRENT_DATE) > 0 THEN 'renovacion_proxima'
            ELSE NULL
          END
          AND nl.status = 'sent'
      ) < (NOW() - (v_settings.min_hours_between_same_notification || ' hours')::INTERVAL)
    )
  ORDER BY days_until_payment ASC, days_until_expiry ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- PASO 3: Trigger automático para resetear pago_confirmado
-- =====================================================

-- Cuando se actualiza fecha_pago a un nuevo período,
-- automáticamente resetear pago_confirmado a FALSE

CREATE OR REPLACE FUNCTION reset_pago_confirmado_on_date_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Si fecha_pago cambió a una fecha futura (nuevo período)
  IF OLD.fecha_pago IS DISTINCT FROM NEW.fecha_pago THEN
    -- Si la nueva fecha es futura, resetear confirmación
    IF NEW.fecha_pago > CURRENT_DATE THEN
      NEW.pago_confirmado := FALSE;
      NEW.pago_confirmado_fecha := NULL;
      NEW.pago_confirmado_por := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_reset_pago_confirmado ON netflix_accounts;
CREATE TRIGGER trigger_reset_pago_confirmado
  BEFORE UPDATE ON netflix_accounts
  FOR EACH ROW
  WHEN (OLD.fecha_pago IS DISTINCT FROM NEW.fecha_pago)
  EXECUTE FUNCTION reset_pago_confirmado_on_date_change();


-- =====================================================
-- PASO 4: Función para confirmar pago
-- =====================================================

CREATE OR REPLACE FUNCTION confirmar_pago_cuenta(
  p_account_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Actualizar la cuenta
  UPDATE netflix_accounts
  SET 
    pago_confirmado = TRUE,
    pago_confirmado_fecha = NOW(),
    pago_confirmado_por = p_user_id,
    updated_at = NOW()
  WHERE id = p_account_id
    AND user_id = p_user_id;
  
  -- Cancelar notificaciones pendientes en la cola
  UPDATE notification_queue
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE account_id = p_account_id
    AND user_id = p_user_id
    AND status = 'pending';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- PASO 5: Función para desconfirmar pago
-- =====================================================

CREATE OR REPLACE FUNCTION desconfirmar_pago_cuenta(
  p_account_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE netflix_accounts
  SET 
    pago_confirmado = FALSE,
    pago_confirmado_fecha = NULL,
    pago_confirmado_por = NULL,
    updated_at = NOW()
  WHERE id = p_account_id
    AND user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- PASO 6: Función para marcar múltiples pagos como confirmados
-- =====================================================

CREATE OR REPLACE FUNCTION confirmar_pagos_masivos(
  p_account_ids UUID[],
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE netflix_accounts
  SET 
    pago_confirmado = TRUE,
    pago_confirmado_fecha = NOW(),
    pago_confirmado_por = p_user_id,
    updated_at = NOW()
  WHERE id = ANY(p_account_ids)
    AND user_id = p_user_id;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Cancelar notificaciones pendientes
  UPDATE notification_queue
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE account_id = ANY(p_account_ids)
    AND user_id = p_user_id
    AND status = 'pending';
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

COMMENT ON FUNCTION confirmar_pago_cuenta IS 'Marca un pago como confirmado y detiene las notificaciones automáticas';
COMMENT ON FUNCTION desconfirmar_pago_cuenta IS 'Desmarca un pago confirmado (por si fue error)';
COMMENT ON FUNCTION confirmar_pagos_masivos IS 'Confirma múltiples pagos a la vez';
COMMENT ON FUNCTION reset_pago_confirmado_on_date_change IS 'Resetea automáticamente pago_confirmado cuando cambia fecha_pago';
