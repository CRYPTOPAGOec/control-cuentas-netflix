/*
  Ejemplo de archivo de configuración cliente para desarrollo.
  Copia este archivo a `env.js` y reemplaza los valores por los de tu proyecto Supabase.

  Nota de seguridad: nunca comites `env.js` con claves privadas (service_role). En el navegador
  sólo debe usarse la ANON KEY pública. Mantén `env.js` fuera del control de versiones o usa
  variables de entorno en el despliegue.
*/

// Reemplaza con los valores de tu proyecto Supabase (anon/public key)
window.SUPABASE_URL = window.SUPABASE_URL || 'https://<tu-proyecto>.supabase.co';
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '<tu-anon-key-publica>';

// Opcional: puedes definir otros valores globales aquí
// window.MI_APP_VAR = 'valor';

console.info('env.example.js loaded — copia a env.js y reemplaza los valores para pruebas locales');
