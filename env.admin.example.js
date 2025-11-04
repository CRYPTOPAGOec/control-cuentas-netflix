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

  // Secreta para proteger el servidor admin (elige un valor fuerte). El cliente debe enviar este valor
  // en la cabecera `x-admin-secret` para usar los endpoints admin.
  ADMIN_SECRET: '<tu-admin-secret-fuerte-aqui>',

  // Opcional: cadena de conexión Postgres para tareas administrativas y migraciones (solo servidores)
  PG_CONNECTION: 'postgresql://usuario:password@host:port/postgres'
};

/*
  Consejos de seguridad:
  - No uses la service_role key en el navegador.
  - Para despliegues CI/CD, configura variables de entorno en la plataforma (Vercel, Heroku, etc.).
  - Considera usar un secret manager y rotación periódica de claves.
*/
