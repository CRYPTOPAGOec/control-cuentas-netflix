/*
  Ejemplo de archivo de configuración cliente para desarrollo.
  Copia este archivo a `env.js` y reemplaza los valores por los de tu proyecto Supabase.

  Nota de seguridad: nunca comites `env.js` con claves privadas (service_role). En el navegador
  sólo debe usarse la ANON KEY pública. Mantén `env.js` fuera del control de versiones o usa
  variables de entorno en el despliegue.
*/

// Reemplaza con los valores de tu proyecto Supabase (anon/public key)
window.SUPABASE_URL = window.SUPABASE_URL || 'https://jaltrpmlwqjgfllibnkt.supabase.co';
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbHRycG1sd3FqZ2ZsbGlibmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4ODg0MDIsImV4cCI6MjA3NTQ2NDQwMn0.rcKdQXz5w4W9DVlIbO4F0pT20vBvKjq0DlqD6JTQUiY';

// IMPORTANTE: La SERVICE_ROLE_KEY es MUY SENSIBLE y solo debe usarse en desarrollo local.
// NUNCA la uses en producción en el navegador. En producción usa un servidor backend seguro.
window.SUPABASE_SERVICE_ROLE_KEY = window.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbHRycG1sd3FqZ2ZsbGlibmt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg4ODQwMiwiZXhwIjoyMDc1NDY0NDAyfQ.jP6ReXIFlQZf8sZhNPImr0BtPikGOKQiSg-ZnxMlc-Y';


// Opcional: puedes definir otros valores globales aquí
// window.MI_APP_VAR = 'valor';

console.info('env.example.js loaded — copia a env.js y reemplaza los valores para pruebas locales');
