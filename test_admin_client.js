/**
 * Script de comprobación local para el cliente admin.
 * No imprime claves sensibles. Si no hay Service Role Key, muestra instrucciones.
 * Uso: node test_admin_client.js
 */

const fs = require('fs');
const path = require('path');

// Intentar cargar un archivo env.admin.js local si existe (opcional)
const localEnvPath = path.join(__dirname, 'env.admin.js');
if (fs.existsSync(localEnvPath)) {
  try {
    const local = require(localEnvPath);
    if (local && typeof local === 'object') {
      // Solo setear variables si no están ya presentes (evitar sobrescribir envs en CI/CD)
      Object.keys(local).forEach(k => {
        if (!process.env[k]) process.env[k] = local[k];
      });
    }
  } catch (e) {
    console.warn('No se pudo cargar env.admin.js local:', e.message);
  }
}

const { getAdminClient, getAllAccounts, getAuditLogs } = require('./supabase_admin_client');

async function main() {
  try {
    // Validar que exista la clave
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('\n❗ SUPABASE_SERVICE_ROLE_KEY no encontrada en process.env.');
      console.log(' - Copia `env.admin.example.js` a `env.admin.js` y coloca tus valores.');
      console.log(' - Alternativamente, exporta SUPABASE_SERVICE_ROLE_KEY y SUPABASE_URL en tu entorno.');
      console.log('\nPor seguridad, este script no continuará sin la service_role key.');
      return;
    }

    // Crear cliente admin (esto valida que SUPABASE_URL esté presente)
    const sb = getAdminClient();
    console.log('\n✓ Cliente admin inicializado correctamente (no se muestran claves)');

    // Probar una llamada segura: listar cuentas (limit bajo)
    console.log('\nProbando getAllAccounts (limit 5) ...');
    const { data: accounts, error: accountsError } = await getAllAccounts({ limit: 5 });
    if (accountsError) {
      console.error('✗ Error al consultar cuentas:', accountsError.message || accountsError);
    } else {
      console.log(`✓ Cuentas recuperadas: ${Array.isArray(accounts) ? accounts.length : 0}`);
    }

    // Probar audit logs
    console.log('\nProbando getAuditLogs (limit 5) ...');
    const { data: logs, error: logsError } = await getAuditLogs({ limit: 5 });
    if (logsError) {
      console.error('✗ Error al consultar logs de auditoría:', logsError.message || logsError);
    } else {
      console.log(`✓ Logs recuperados: ${Array.isArray(logs) ? logs.length : 0}`);
    }

    console.log('\nTest admin finalizado. Si necesitas más acciones, revisa `supabase_admin_client.js` para añadir helpers.');

  } catch (err) {
    console.error('Error general en test_admin_client:', err.message || err);
  }
}

main();
