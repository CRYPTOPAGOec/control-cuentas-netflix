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

// Cargar env.admin.js si existe
let adminEnv = {};
const localEnvPath = path.join(__dirname, 'env.admin.js');
try{ adminEnv = require(localEnvPath); }catch(e){/* ignore if not present */}

const SUPABASE_URL = process.env.SUPABASE_URL || adminEnv.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || adminEnv.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || adminEnv.SUPABASE_ANON_KEY;
const PORT = process.env.PORT || 3000;

if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY){
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured (env or env.admin.js)');
  process.exit(1);
}

if(!SUPABASE_ANON_KEY){
  console.warn('WARNING: SUPABASE_ANON_KEY not configured. Frontend authentication may not work.');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

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
  
  const envContent = `
// Configuración generada dinámicamente desde el servidor
window.SUPABASE_URL = '${SUPABASE_URL}';
window.SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';

console.info('✅ Configuración de Supabase cargada correctamente');
console.info('URL:', window.SUPABASE_URL);
`;
  
  console.log('[env.js] Sending configuration successfully');
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
    
    // Verificar que el usuario sea admin consultando la tabla admins directamente
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single();
    
    if (adminError || !adminData) {
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

// Railway requiere escuchar en 0.0.0.0 para aceptar conexiones externas
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, ()=> {
  console.log('='.repeat(60));
  console.log(`🚀 Admin server listening on http://${HOST}:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 SUPABASE_ANON_KEY configured: ${!!SUPABASE_ANON_KEY}`);
  console.log(`🔐 SUPABASE_SERVICE_ROLE_KEY configured: ${!!SUPABASE_SERVICE_ROLE_KEY}`);
  console.log(`� Auth method: JWT Bearer Token`);
  console.log('='.repeat(60));
});
