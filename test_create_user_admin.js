/*
 Script: test_create_user_admin.js
 Crea (o confirma) un usuario en Supabase usando la SERVICE_ROLE key.
 USO (PowerShell):
   $env:SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbHRycG1sd3FqZ2ZsbGlibmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg4ODQwMiwiZXhwIjoyMDc1NDY0NDAyfQ.jP6ReXIFlQZf8sZhNPImr0BtPikGOKQiSg-ZnxMlc-Y'
   node test_create_user_admin.js atreyucasta2@gmail.com Cryptopago1

 ADVERTENCIA: la SERVICE_ROLE key tiene privilegios completos. NO la uses desde el navegador ni la compartas.
*/

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jaltrpmlwqjgfllibnkt.supabase.co';
let serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Permitir pasar la service_role key como 4º argumento opcional: node script.js email pass 'SERVICE_ROLE_KEY'
if (!serviceRole && process.argv[4]) {
  serviceRole = process.argv[4];
}

if (!serviceRole) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY no está definida. Exporta la service_role key como variable de entorno o pásala como 4º argumento.');
  console.error('Uso: node test_create_user_admin.js <email> <password> [service_role_key]');
  process.exit(1);
}

if (process.argv.length < 4) {
  console.error('Uso: node test_create_user_admin.js <email> <password>');
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

const supabaseAdmin = createClient(supabaseUrl, serviceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Validar rápidamente la service role key consultando el endpoint admin
async function validateServiceRoleKey(){
  try{
    if (typeof fetch === 'undefined'){
      // Node viejo puede no tener fetch; no abortamos, pero avisamos
      console.warn('fetch no está disponible en este entorno de Node; omitiendo validación HTTP previa.');
      return;
    }
    const testUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users?limit=1`;
    const res = await fetch(testUrl, { method: 'GET', headers: { 'Authorization': `Bearer ${serviceRole}`, 'apikey': serviceRole } });
    const body = await res.text();
    if (!res.ok) {
      console.error(`Validación de service_role falló: status=${res.status} ${res.statusText}`);
      // mostrar body parcialmente sin exponer la key
      try { const j = JSON.parse(body); console.error('Respuesta:', j); } catch(e){ console.error('Respuesta:', body.slice(0,400)); }
      process.exit(1);
    }
    console.log('Service role key válida (validación HTTP OK).');
  }catch(err){
    console.warn('Error durante validación de service_role key:', err.message || err);
  }
}

async function createOrConfirmUser() {
  try {
    console.log(`Creando/confirmando usuario: ${email}`);

    // Validar service role key antes de intentar operaciones administrativas
    await validateServiceRoleKey();

    // Intentar crear el usuario (si ya existe, admin.createUser fallará)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // marcar como confirmado para permitir login inmediato
    });

    if (error) {
      // Si el usuario ya existe, intentar actualizar/confirmar la cuenta
      console.warn('Advertencia al crear usuario:', error.message || error);
      console.log('Intentando obtener usuario existente por email...');

      // Buscar usuario usando el endpoint admin (REST) ya que auth.users no es una tabla pública
      const lookupUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
      const lookupRes = await fetch(lookupUrl, { method: 'GET', headers: { 'Authorization': `Bearer ${serviceRole}`, 'apikey': serviceRole } });
      const lookupBody = await lookupRes.text();
      if (!lookupRes.ok) {
        console.error('No se pudo buscar usuario existente via admin API:', lookupRes.status, lookupRes.statusText);
        try { console.error('Respuesta:', JSON.parse(lookupBody)); } catch(e) { console.error('Respuesta:', lookupBody.slice(0,400)); }
        process.exit(1);
      }
      let foundUsers = [];
      try { foundUsers = JSON.parse(lookupBody); } catch(e) { console.error('Error parseando respuesta de lookup:', e); process.exit(1); }
      const found = Array.isArray(foundUsers) && foundUsers.length ? foundUsers[0] : null;
      if (!found) {
        console.error('Usuario no encontrado via admin API y no se pudo crear automáticamente. Error original:', error.message || error);
        process.exit(1);
      }
      console.log('Usuario encontrado:', found.id, found.email);

      // Intentar forzar confirmación usando admin.updateUser si está disponible
      if (supabaseAdmin.auth && supabaseAdmin.auth.admin && typeof supabaseAdmin.auth.admin.updateUser === 'function') {
        const { data: ud2, error: udErr2 } = await supabaseAdmin.auth.admin.updateUser(found.id, { email_confirm: true });
        if (udErr2) {
          console.error('No se pudo confirmar usuario mediante admin.updateUser:', udErr2.message || udErr2);
          process.exit(1);
        }
        console.log('Usuario confirmado mediante admin.updateUser:', ud2.user?.id || found.id);
        console.log('Listo — puedes iniciar sesión con ese usuario.');
        process.exit(0);
      }

      // Fallback: usar PATCH directo al endpoint admin para actualizar el usuario
      const patchUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users/${encodeURIComponent(found.id)}`;
      const patchRes = await fetch(patchUrl, { method: 'PATCH', headers: { 'Authorization': `Bearer ${serviceRole}`, 'apikey': serviceRole, 'Content-Type': 'application/json' }, body: JSON.stringify({ email_confirm: true }) });
      const patchBody = await patchRes.text();
      if (!patchRes.ok) {
        console.error('No fue posible confirmar la cuenta mediante PATCH admin API:', patchRes.status, patchRes.statusText);
        try { console.error('Respuesta:', JSON.parse(patchBody)); } catch(e) { console.error('Respuesta:', patchBody.slice(0,400)); }
        process.exit(1);
      }
      console.log('Usuario confirmado mediante admin PATCH:', found.id);
      console.log('Listo — puedes iniciar sesión con ese usuario.');
      process.exit(0);
    }

    console.log('Usuario creado correctamente:', data.user?.id || data.user);
    console.log('Puedes iniciar sesión ahora con ese usuario.');
    process.exit(0);
  } catch (err) {
    console.error('Error inesperado:', err.message || err);
    process.exit(1);
  }
}

createOrConfirmUser();
