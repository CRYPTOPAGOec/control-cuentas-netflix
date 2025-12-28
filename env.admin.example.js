/*
  Ejemplo de configuración para código servidor/administración.
  USO SEGURO: Este archivo contiene claves sensibles (service_role). Nunca lo incluyas en el control de
  versiones ni lo expongas en el navegador. Copia a `env.admin.js` o, preferible, exporta variables de
  entorno en tu servidor (process.env).

  Ejemplo de uso (recomendado): exporta las variables en tu entorno y no mantengas `env.admin.js` en el repo.
*/

module.exports = {
  // URL pública de tu proyecto Supabase
  SUPABASE_URL: 'https://<tu-proyecto>.supabase.co',

  // CLAVE ANON (pública - se usa en el frontend)
  // Reemplaza por la ANON KEY desde Settings -> API en el dashboard de Supabase.
  SUPABASE_ANON_KEY: '<tu-anon-key-aqui>',

  // CLAVE SERVICE ROLE (muy sensible). Usar solo en servidores de confianza.
  // Reemplaza por la SERVICE_ROLE KEY desde Settings -> API en el dashboard de Supabase.
  SUPABASE_SERVICE_ROLE_KEY: '<tu-service-role-key-aqui>',

  // Opcional: cadena de conexión Postgres para tareas administrativas y migraciones (solo servidores)
  PG_CONNECTION: 'postgresql://usuario:password@host:port/postgres',

  // ===== CONFIGURACIÓN WAHA (WhatsApp HTTP API) =====
  // URL de tu instancia de WAHA en Railway
  WAHA_URL: 'https://tu-waha-instance.up.railway.app',

  // Clave API para autenticar con WAHA (genera una clave segura)
  WAHA_API_KEY: '<genera-una-clave-segura-aqui>',

  // Sesión de WhatsApp (default es suficiente para una sola instancia)
  WAHA_SESSION: 'default'
};

/*
  Consejos de seguridad:
  - No uses la service_role key en el navegador.
  - Para despliegues CI/CD, configura variables de entorno en la plataforma (Vercel, Heroku, etc.).
  - Considera usar un secret manager y rotación periódica de claves.
*/
