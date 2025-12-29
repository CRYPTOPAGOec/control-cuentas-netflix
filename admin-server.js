#!/usr/bin/env node
/* admin-server.js
   Pequeño servidor Express para operaciones administrativas seguras.

   Seguridad: este servidor usa la SERVICE_ROLE KEY para operar contra Supabase.
   Protege los endpoints validando el JWT Bearer Token del usuario autenticado y verificando que sea admin.

   Uso (local):
     - Copia env.admin.example.js -> env.admin.js y rellena SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
     - npm install
     - npm run admin-server
*/

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const WhatsAppService = require('./whatsapp_service');

// Cargar env.admin.js si existe
let adminEnv = {};
const localEnvPath = path.join(__dirname, 'env.admin.js');
try{ adminEnv = require(localEnvPath); }catch(e){/* ignore if not present */}

const SUPABASE_URL = process.env.SUPABASE_URL || adminEnv.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || adminEnv.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || adminEnv.SUPABASE_ANON_KEY;
const PORT = process.env.PORT || 8000;

if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY){
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured (env or env.admin.js)');
  process.exit(1);
}

if(!SUPABASE_ANON_KEY){
  console.warn('WARNING: SUPABASE_ANON_KEY not configured. Frontend authentication may not work.');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Inicializar servicio de WhatsApp
const whatsappService = new WhatsAppService({
  wahaUrl: process.env.WAHA_URL || adminEnv.WAHA_URL,
  wahaApiKey: process.env.WAHA_API_KEY || adminEnv.WAHA_API_KEY,
  wahaSession: process.env.WAHA_SESSION || adminEnv.WAHA_SESSION || 'default'
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Endpoint dinámico para env.js - genera el archivo con las variables de entorno
app.get('/env.js', (req, res) => {
  console.log('[env.js] Request received');
  console.log('[env.js] SUPABASE_URL exists:', !!SUPABASE_URL);
  console.log('[env.js] SUPABASE_ANON_KEY exists:', !!SUPABASE_ANON_KEY);
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[env.js] Missing configuration!');
    return res.status(500).type('application/javascript').send(
      `console.error('Error: Supabase no configurado en el servidor.');
       console.error('SUPABASE_URL: ${!!SUPABASE_URL}');
       console.error('SUPABASE_ANON_KEY: ${!!SUPABASE_ANON_KEY}');
       window.SUPABASE_URL = null;
       window.SUPABASE_ANON_KEY = null;`
    );
  }
  
  // Detectar la URL base según el entorno
  // En Railway, usar el host del request. En local, usar localhost
  const host = req.get('host');
  const protocol = host.includes('railway.app') || host.includes('herokuapp.com') ? 'https' : 'http';
  const adminBaseUrl = `${protocol}://${host}`;
  
  const envContent = `
// Configuración generada dinámicamente desde el servidor
window.SUPABASE_URL = '${SUPABASE_URL}';
window.SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';
window.ADMIN_BASE_URL = '${adminBaseUrl}';

console.info('✅ Configuración de Supabase cargada correctamente');
console.info('URL:', window.SUPABASE_URL);
console.info('ADMIN_BASE_URL:', window.ADMIN_BASE_URL);
`;
  
  console.log('[env.js] Sending configuration successfully');
  console.log('[env.js] Host:', host);
  console.log('[env.js] ADMIN_BASE_URL:', adminBaseUrl);
  res.type('application/javascript').send(envContent);
});

// Servir archivos estáticos (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname), {
  extensions: ['html'],
  index: 'index.html'
}));

// Servir la carpeta assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Middleware para verificar JWT y que el usuario sea admin
async function verifyAdminAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }
    
    const token = authHeader.substring(7); // Remover "Bearer "
    
    // Verificar el token usando Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      console.error('Error al verificar token:', error);
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    
    console.log('Usuario autenticado:', user.email, 'ID:', user.id);
    
    // Verificar que el usuario sea admin consultando la tabla user_roles directamente
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
    
    if (roleError || !roleData) {
      console.log('Usuario no es admin:', user.email);
      return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    
    console.log('✅ Usuario admin verificado:', user.email);
    
    // Adjuntar información del usuario a la request
    req.user = user;
    next();
  } catch (err) {
    console.error('Error en verifyAdminAuth:', err);
    return res.status(500).json({ error: 'Error al verificar autenticación' });
  }
}

// Root endpoint - API info (solo para /api/)
app.get('/api', (req,res)=> res.json({ 
  message: 'Admin Server API', 
  version: '2.0.0',
  authentication: 'JWT Bearer Token',
  endpoints: [
    'GET /_health',
    'GET /admin/users (requiere Authorization: Bearer <token>)',
    'POST /admin/users (requiere Authorization: Bearer <token>)',
    'PUT /admin/users/:id (requiere Authorization: Bearer <token>)',
    'DELETE /admin/users/:id (requiere Authorization: Bearer <token>)',
    'POST /admin/users/:id/toggle (requiere Authorization: Bearer <token>)',
    'GET /admin/access-codes (requiere Authorization: Bearer <token>)',
    'POST /admin/access-codes (requiere Authorization: Bearer <token>)',
    'PUT /admin/access-codes/:id (requiere Authorization: Bearer <token>)',
    'DELETE /admin/access-codes/:id (requiere Authorization: Bearer <token>)'
  ]
}));

// Health
app.get('/_health', (req,res)=> res.json({ 
  ok: true, 
  supabase_url: !!SUPABASE_URL,
  supabase_anon_key: !!SUPABASE_ANON_KEY,
  supabase_service_role_key: !!SUPABASE_SERVICE_ROLE_KEY,
  auth_method: 'JWT',
  timestamp: new Date().toISOString()
}));

// Verify admin status (for UI to check if user is admin)
app.get('/admin/verify', verifyAdminAuth, async (req,res)=> {
  return res.json({ 
    isAdmin: true,
    user: {
      id: req.user.id,
      email: req.user.email
    }
  });
});

// List users (paginated)
app.get('/admin/users', verifyAdminAuth, async (req,res)=>{
  try{
    const { page = 1, per_page = 100 } = req.query;
    const offset = (Number(page)-1) * Number(per_page);
    // Supabase admin auth.listUsers supports pagination via page/per_page in newer SDKs
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ per_page: Number(per_page), page: Number(page) });
    if(error) return res.status(500).json({ error });
    return res.json(data || []);
  }catch(err){ console.error(err); return res.status(500).json({ error: String(err) }); }
});

// Create user
app.post('/admin/users', verifyAdminAuth, async (req,res)=>{
  try{
    const { email, password } = req.body;
    if(!email) return res.status(400).json({ error: 'email required' });
    // create via admin API
    const resp = await supabaseAdmin.auth.admin.createUser({ email, password });
    return res.json(resp);
  }catch(err){ console.error(err); return res.status(500).json({ error: String(err) }); }
});

// Update user (partial)
app.put('/admin/users/:id', verifyAdminAuth, async (req,res)=>{
  try{
    const id = req.params.id;
    const { email, password, user_metadata } = req.body;
    if(!id) return res.status(400).json({ error: 'id required' });
    const updates = {};
    if(email) updates.email = email;
    if(password) updates.password = password;
    if(user_metadata) updates.user_metadata = user_metadata;
    const resp = await supabaseAdmin.auth.admin.updateUserById(id, updates);
    return res.json(resp);
  }catch(err){ console.error(err); return res.status(500).json({ error: String(err) }); }
});

// Delete user
app.delete('/admin/users/:id', verifyAdminAuth, async (req,res)=>{
  try{
    const id = req.params.id;
    if(!id) return res.status(400).json({ error: 'id required' });
    const resp = await supabaseAdmin.auth.admin.deleteUser(id);
    return res.json(resp);
  }catch(err){ console.error(err); return res.status(500).json({ error: String(err) }); }
});

// Toggle enable/disable user
app.post('/admin/users/:id/toggle', verifyAdminAuth, async (req,res)=>{
  try{
    const id = req.params.id; const { enable } = req.body; if(!id) return res.status(400).json({ error: 'id required' });
    const updates = { is_disabled: enable === true ? false : true };
    const resp = await supabaseAdmin.auth.admin.updateUserById(id, updates);
    return res.json(resp);
  }catch(err){ console.error(err); return res.status(500).json({ error: String(err) }); }
});

// ===== ACCESS CODES ENDPOINTS =====

// List access codes
app.get('/admin/access-codes', verifyAdminAuth, async (req,res)=>{
  try{
    const { data, error } = await supabaseAdmin
      .from('access_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if(error) return res.status(500).json({ error });
    return res.json({ data });
  }catch(err){ console.error(err); return res.status(500).json({ error: String(err) }); }
});

// Create access code
app.post('/admin/access-codes', verifyAdminAuth, async (req,res)=>{
  try{
    const { user_id, code, expires_at } = req.body;
    if(!user_id || !code) return res.status(400).json({ error: 'user_id and code required' });
    
    const { data, error } = await supabaseAdmin.from('access_codes').insert({
      user_id,
      code,
      expires_at: expires_at || null
    }).select();
    
    if(error) return res.status(500).json({ error });
    return res.json({ data });
  }catch(err){ console.error(err); return res.status(500).json({ error: String(err) }); }
});

// Update access code
app.put('/admin/access-codes/:id', verifyAdminAuth, async (req,res)=>{
  try{
    const id = req.params.id;
    const { code, expires_at, is_active } = req.body;
    if(!id) return res.status(400).json({ error: 'id required' });
    
    const updates = {};
    if(code !== undefined) updates.code = code;
    if(expires_at !== undefined) updates.expires_at = expires_at;
    if(is_active !== undefined) updates.is_active = is_active;
    
    const { data, error } = await supabaseAdmin
      .from('access_codes')
      .update(updates)
      .eq('id', id)
      .select();
    
    if(error) return res.status(500).json({ error });
    return res.json({ data });
  }catch(err){ console.error(err); return res.status(500).json({ error: String(err) }); }
});

// Delete access code
app.delete('/admin/access-codes/:id', verifyAdminAuth, async (req,res)=>{
  try{
    const id = req.params.id;
    if(!id) return res.status(400).json({ error: 'id required' });
    
    const { error } = await supabaseAdmin
      .from('access_codes')
      .delete()
      .eq('id', id);
    
    if(error) return res.status(500).json({ error });
    return res.json({ success: true });
  }catch(err){ console.error(err); return res.status(500).json({ error: String(err) }); }
});

// ===== WHATSAPP ENDPOINTS =====

// Check WhatsApp connection status
app.get('/admin/whatsapp/status', verifyAdminAuth, async (req, res) => {
  try {
    const isConnected = await whatsappService.checkConnection();
    return res.json({ 
      enabled: whatsappService.enabled,
      connected: isConnected,
      wahaUrl: whatsappService.wahaUrl ? '✓ Configured' : '✗ Not configured'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

// Send payment reminder
app.post('/admin/whatsapp/send-payment-reminder', verifyAdminAuth, async (req, res) => {
  try {
    const { accountId } = req.body;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });
    
    // Obtener datos de la cuenta
    const { data: account, error } = await supabaseAdmin
      .from('cuentas')
      .select('*')
      .eq('id', accountId)
      .single();
    
    if (error || !account) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }
    
    if (!account.telefono) {
      return res.status(400).json({ error: 'La cuenta no tiene teléfono registrado' });
    }
    
    // Enviar notificación
    const result = await whatsappService.sendPaymentReminder(account);
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

// Send payment confirmation
app.post('/admin/whatsapp/send-payment-confirmation', verifyAdminAuth, async (req, res) => {
  try {
    const { accountId } = req.body;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });
    
    // Obtener datos de la cuenta
    const { data: account, error } = await supabaseAdmin
      .from('cuentas')
      .select('*')
      .eq('id', accountId)
      .single();
    
    if (error || !account) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }
    
    if (!account.telefono) {
      return res.status(400).json({ error: 'La cuenta no tiene teléfono registrado' });
    }
    
    // Enviar confirmación
    const result = await whatsappService.sendPaymentConfirmation(account);
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

// Send custom message
app.post('/admin/whatsapp/send-custom', verifyAdminAuth, async (req, res) => {
  try {
    const { phone, template, variables } = req.body;
    if (!phone || !template) {
      return res.status(400).json({ error: 'phone and template required' });
    }
    
    const result = await whatsappService.sendCustomNotification(phone, template, variables || {});
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

// Send bulk notifications
app.post('/admin/whatsapp/send-bulk', verifyAdminAuth, async (req, res) => {
  try {
    const { notifications, delayMs } = req.body;
    if (!notifications || !Array.isArray(notifications)) {
      return res.status(400).json({ error: 'notifications array required' });
    }
    
    // Validar que cada notificación tenga los campos requeridos
    const messages = [];
    for (const notif of notifications) {
      if (!notif.accountId) {
        return res.status(400).json({ error: 'Each notification must have accountId' });
      }
      
      // Obtener datos de la cuenta
      const { data: account, error } = await supabaseAdmin
        .from('cuentas')
        .select('*')
        .eq('id', notif.accountId)
        .single();
      
      if (error || !account || !account.telefono) {
        console.warn(`⚠️ Cuenta ${notif.accountId} sin teléfono, omitiendo...`);
        continue;
      }
      
      // Determinar tipo de mensaje y generar contenido
      let message = '';
      if (notif.type === 'payment_reminder') {
        const reminderResult = await whatsappService.sendPaymentReminder(account);
        continue; // Ya se envió, no agregar a messages
      } else if (notif.type === 'custom' && notif.template) {
        message = notif.template;
        Object.keys(account).forEach(key => {
          message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), account[key]);
        });
      }
      
      if (message) {
        messages.push({ phone: account.telefono, message });
      }
    }
    
    // Enviar mensajes en lote
    const results = await whatsappService.sendBulkMessages(messages, delayMs || 2000);
    return res.json({ 
      total: notifications.length,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

// =====================================================
// AUTOMATION CONFIG ENDPOINTS
// =====================================================

// Get automation configuration
app.get('/admin/automation/config', verifyAdminAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('automation_config')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    console.error('Error fetching automation config:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Update automation configuration
app.put('/admin/automation/config', verifyAdminAuth, async (req, res) => {
  try {
    const { status, config, paused_reason } = req.body;
    const userId = req.user.id;

    // Get current config for logging
    const { data: currentConfig } = await supabaseAdmin
      .from('automation_config')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    // Build update object
    const updates = {
      updated_by: userId,
      updated_at: new Date().toISOString()
    };

    if (status !== undefined) {
      updates.status = status;
      if (status === 'paused') {
        updates.paused_at = new Date().toISOString();
        updates.paused_by = userId;
        updates.paused_reason = paused_reason || null;
      } else if (status === 'active') {
        updates.paused_at = null;
        updates.paused_by = null;
        updates.paused_reason = null;
      }
    }

    if (config !== undefined) {
      updates.config = config;
    }

    // Update config
    const { data, error } = await supabaseAdmin
      .from('automation_config')
      .update(updates)
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .select()
      .single();

    if (error) throw error;

    // Log the action
    let action = 'config_change';
    if (status === 'paused') action = 'pause';
    else if (status === 'active' && currentConfig?.status === 'paused') action = 'resume';
    else if (status === 'maintenance') action = 'maintenance_mode';

    await supabaseAdmin
      .from('automation_logs')
      .insert({
        action,
        config_before: currentConfig,
        config_after: data,
        reason: paused_reason || `Configuration updated by admin`,
        created_by: userId
      });

    return res.json(data);
  } catch (err) {
    console.error('Error updating automation config:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Get automation logs (últimos 100)
app.get('/admin/automation/logs', verifyAdminAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('automation_logs')
      .select('*, created_by_user:users!automation_logs_created_by_fkey(email, nombre)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    console.error('Error fetching automation logs:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Get today's notification statistics
app.get('/admin/automation/stats/today', verifyAdminAuth, async (req, res) => {
  try {
    // Intentar usar la función RPC si existe
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_today_notification_stats');

      if (!error && data) {
        return res.json(data[0] || {
          total_sent: 0,
          total_failed: 0,
          total_pending: 0,
          by_type: {}
        });
      }
    } catch (rpcError) {
      console.log('RPC function not available, using fallback query');
    }

    // Fallback: consulta directa si la función RPC no existe
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: tracking, error } = await supabaseAdmin
      .from('notification_tracking')
      .select('success, notification_type')
      .gte('sent_at', today.toISOString());

    if (error) throw error;

    const stats = {
      total_sent: tracking?.filter(t => t.success).length || 0,
      total_failed: tracking?.filter(t => !t.success).length || 0,
      total_pending: 0,
      by_type: {}
    };

    // Agrupar por tipo
    tracking?.forEach(t => {
      if (!stats.by_type[t.notification_type]) {
        stats.by_type[t.notification_type] = { sent: 0, failed: 0 };
      }
      if (t.success) {
        stats.by_type[t.notification_type].sent++;
      } else {
        stats.by_type[t.notification_type].failed++;
      }
    });

    return res.json(stats);
  } catch (err) {
    console.error('Error fetching today stats:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Get upcoming scheduled messages
app.get('/admin/automation/upcoming-messages', verifyAdminAuth, async (req, res) => {
  try {
    // Verificar si la automatización está activa
    let isActive = true;
    try {
      const { data: config } = await supabaseAdmin
        .from('automation_config')
        .select('config, status')
        .limit(1)
        .single();

      if (config?.status !== 'active') {
        return res.json({ messages: [], status: config?.status || 'inactive' });
      }
    } catch (configError) {
      console.log('automation_config no disponible, asumiendo activo');
    }

    // Obtener cuentas próximas a vencer
    const today = new Date();
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    const { data: accounts, error } = await supabaseAdmin
      .from('cuentas')
      .select('id, propietario, telefono, correo, fecha_pago, precio, servicio')
      .gte('fecha_pago', today.toISOString().split('T')[0])
      .lte('fecha_pago', in7Days.toISOString().split('T')[0])
      .not('telefono', 'is', null)
      .order('fecha_pago', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error querying cuentas:', error);
      return res.json({ messages: [], status: 'error', error: error.message });
    }

    if (!accounts || accounts.length === 0) {
      return res.json({ messages: [], status: 'active', updated_at: new Date().toISOString() });
    }

    // Calcular tipo de notificación y tiempo restante para cada cuenta
    const messages = accounts.map(account => {
      const fechaPago = new Date(account.fecha_pago);
      const diffTime = fechaPago.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let notificationType = 'renovacion_proxima';
      let priority = 4;
      let scheduledTime = new Date(fechaPago);
      
      if (diffDays === 3) {
        notificationType = 'pago_3dias';
        priority = 3;
        scheduledTime.setHours(9, 0, 0, 0); // 9 AM del día -3
      } else if (diffDays === 2) {
        notificationType = 'pago_2dias';
        priority = 3;
        scheduledTime.setHours(10, 0, 0, 0); // 10 AM del día -2
      } else if (diffDays === 1) {
        notificationType = 'pago_1dia';
        priority = 2;
        scheduledTime.setHours(11, 0, 0, 0); // 11 AM del día -1
      } else if (diffDays === 0) {
        notificationType = 'pago_hoy';
        priority = 1;
        scheduledTime.setHours(9, 0, 0, 0); // 9 AM del día de vencimiento
      } else if (diffDays < 0) {
        notificationType = 'pago_atrasado';
        priority = 1;
        scheduledTime = new Date(); // Enviar lo antes posible
      }

      return {
        id: account.id,
        propietario: account.propietario || 'Sin nombre',
        telefono: account.telefono,
        correo: account.correo,
        fecha_pago: account.fecha_pago,
        precio: account.precio || 0,
        servicio: account.servicio || 'Netflix',
        notification_type: notificationType,
        priority: priority,
        scheduled_time: scheduledTime.toISOString(),
        days_until: diffDays,
        seconds_until: Math.max(0, Math.floor((scheduledTime.getTime() - Date.now()) / 1000))
      };
    });

    // Ordenar por prioridad y tiempo
    messages.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.seconds_until - b.seconds_until;
    });

    return res.json({ messages, status: 'active', updated_at: new Date().toISOString() });
  } catch (err) {
    console.error('Error fetching upcoming messages:', err);
    return res.status(500).json({ error: String(err), message: err.message });
  }
});

// Check rate limit
app.get('/admin/automation/rate-limit', verifyAdminAuth, async (req, res) => {
  try {
    // Get current config
    const { data: config } = await supabaseAdmin
      .from('automation_config')
      .select('config')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    const limit = config?.config?.limits?.maxPerHour || 50;

    // Check rate limit
    const { data, error } = await supabaseAdmin
      .rpc('check_rate_limit', { hour_limit: limit });

    if (error) throw error;

    // Get current count
    const { count } = await supabaseAdmin
      .from('notification_tracking')
      .select('*', { count: 'exact', head: true })
      .gte('sent_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .eq('success', true);

    return res.json({
      canSend: data,
      currentCount: count || 0,
      limit,
      remaining: Math.max(0, limit - (count || 0))
    });
  } catch (err) {
    console.error('Error checking rate limit:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Track notification sent
app.post('/admin/automation/track', verifyAdminAuth, async (req, res) => {
  try {
    const { account_id, notification_type, success, error_message, phone, message_id, metadata } = req.body;

    const { data, error } = await supabaseAdmin
      .from('notification_tracking')
      .insert({
        account_id,
        notification_type,
        success: success !== false,
        error_message,
        phone,
        message_id,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    console.error('Error tracking notification:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Railway requiere escuchar en 0.0.0.0 para aceptar conexiones externas
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, ()=> {
  console.log('='.repeat(60));
  console.log(`🚀 Admin server listening on http://${HOST}:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 SUPABASE_ANON_KEY configured: ${!!SUPABASE_ANON_KEY}`);
  console.log(`🔐 SUPABASE_SERVICE_ROLE_KEY configured: ${!!SUPABASE_SERVICE_ROLE_KEY}`);
  console.log(`📱 WhatsApp Service: ${whatsappService.enabled ? '✅ ENABLED' : '⚠️  DISABLED'}`);
  if (whatsappService.enabled) {
    console.log(`   WAHA URL: ${whatsappService.wahaUrl}`);
    console.log(`   Session: ${whatsappService.wahaSession}`);
  }
  console.log(`🔒 Auth method: JWT Bearer Token`);
  console.log('='.repeat(60));
});
