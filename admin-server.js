#!/usr/bin/env node
/* admin-server.js
   Pequeño servidor Express para operaciones administrativas seguras.

   Seguridad: este servidor usa la SERVICE_ROLE KEY para operar contra Supabase.
   Protege los endpoints con la cabecera `x-admin-secret` que debe coincidir con ADMIN_SECRET.

   Uso (local):
     - Copia env.admin.example.js -> env.admin.js y rellena SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y ADMIN_SECRET
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
const ADMIN_SECRET = process.env.ADMIN_SECRET || adminEnv.ADMIN_SECRET || 'local-dev-secret';
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

// Simple middleware to verify admin secret
function verifySecret(req,res,next){ const secret = req.headers['x-admin-secret']; if(!secret || secret !== ADMIN_SECRET){ return res.status(401).json({ error: 'Unauthorized' }); } next(); }

// Root endpoint - API info (solo para /api/)
app.get('/api', (req,res)=> res.json({ 
  message: 'Admin Server API', 
  version: '1.0.0',
  endpoints: [
    'GET /_health',
    'GET /admin/users (requiere x-admin-secret)',
    'POST /admin/users (requiere x-admin-secret)',
    'PUT /admin/users/:id (requiere x-admin-secret)',
    'DELETE /admin/users/:id (requiere x-admin-secret)',
    'POST /admin/users/:id/toggle (requiere x-admin-secret)'
  ]
}));

// Health
app.get('/_health', (req,res)=> res.json({ 
  ok: true, 
  supabase_url: !!SUPABASE_URL,
  supabase_anon_key: !!SUPABASE_ANON_KEY,
  supabase_service_role_key: !!SUPABASE_SERVICE_ROLE_KEY,
  admin_secret: !!ADMIN_SECRET,
  timestamp: new Date().toISOString()
}));

// List users (paginated)
app.get('/admin/users', verifySecret, async (req,res)=>{
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
app.post('/admin/users', verifySecret, async (req,res)=>{
  try{
    const { email, password } = req.body;
    if(!email) return res.status(400).json({ error: 'email required' });
    // create via admin API
    const resp = await supabaseAdmin.auth.admin.createUser({ email, password });
    return res.json(resp);
  }catch(err){ console.error(err); return res.status(500).json({ error: String(err) }); }
});

// Update user (partial)
app.put('/admin/users/:id', verifySecret, async (req,res)=>{
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
app.delete('/admin/users/:id', verifySecret, async (req,res)=>{
  try{
    const id = req.params.id;
    if(!id) return res.status(400).json({ error: 'id required' });
    const resp = await supabaseAdmin.auth.admin.deleteUser(id);
    return res.json(resp);
  }catch(err){ console.error(err); return res.status(500).json({ error: String(err) }); }
});

// Toggle enable/disable user
app.post('/admin/users/:id/toggle', verifySecret, async (req,res)=>{
  try{
    const id = req.params.id; const { enable } = req.body; if(!id) return res.status(400).json({ error: 'id required' });
    const updates = { is_disabled: enable === true ? false : true };
    const resp = await supabaseAdmin.auth.admin.updateUserById(id, updates);
    return res.json(resp);
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
  console.log(`🛡️  ADMIN_SECRET configured: ${!!ADMIN_SECRET}`);
  console.log('='.repeat(60));
});
