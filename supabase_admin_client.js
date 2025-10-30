/**
 * supabase_admin_client.js
 *
 * Cliente admin (server-side) para operaciones que requieren la service_role key.
 * Exporta helpers seguros y centralizados para llamadas administrativas.
 */

const { createClient } = require('@supabase/supabase-js');

let adminClient = null;

/**
 * Crea o devuelve un singleton del cliente admin de Supabase.
 * Preferible: configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en variables de entorno.
 * Alternativa: pasar { url, serviceRoleKey } al llamar.
 */
function getAdminClient({ url, serviceRoleKey } = {}) {
  const supabaseUrl = process.env.SUPABASE_URL || url;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || serviceRoleKey;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados para crear admin client');
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceKey, {
      // Opciones: desactivar autorenew en scripts batch y evitar almacenamiento en memoria innecesario
      auth: { persistSession: false },
      global: { headers: { 'x-admin-client': 'true' } }
    });
  }

  return adminClient;
}

/**
 * isAdminUser: intenta determinar si un user_id es administrador.
 * Implementa varios fallbacks para adaptarse a distintos schemas:
 *  - Llama a la función RPC 'is_admin' con { user_id } si está disponible
 *  - Consulta tabla 'user_roles' buscando rol = 'admin'
 */
async function isAdminUser(userId) {
  if (!userId) return { error: new Error('userId requerido') };
  const sb = getAdminClient();

  try {
    // Intentar RPC 'is_admin' con parámetro
    try {
      const { data, error } = await sb.rpc('is_admin', { user_id: userId });
      if (!error && typeof data !== 'undefined') return { data, error: null };
    } catch (e) {
      // no hacer nada, intentos siguientes
    }

    // Fallback: consultar tabla user_roles
    const { data, error } = await sb.from('user_roles').select('role').eq('user_id', userId).limit(1).maybeSingle();
    if (error) return { data: null, error };
    const isAdmin = data && (data.role === 'admin' || data.role === 'administrator');
    return { data: !!isAdmin, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

async function getAllAccounts({ limit = 1000 } = {}) {
  const sb = getAdminClient();
  try {
    const { data, error } = await sb.from('netflix_accounts').select('*').limit(limit);
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

async function getAuditLogs({ limit = 50 } = {}) {
  const sb = getAdminClient();
  try {
    const { data, error } = await sb
      .from('netflix_accounts_audit')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(limit);
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }

}

module.exports = {
  getAdminClient,
  isAdminUser,
  getAllAccounts,
  getAuditLogs
};
