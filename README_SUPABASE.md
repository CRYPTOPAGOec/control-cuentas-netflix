Uso del schema `supabase_schema.sql` y cómo aplicarlo (PowerShell)

IMPORTANTE: La cadena de conexión del transaction pooler contiene credenciales sensibles (password). No la incluyas en código cliente ni en repositorios públicos.

Opciones para aplicar el SQL:

1) Usando psql (psql debe estar instalado en tu máquina):

# Desde PowerShell (reemplaza la URI si es necesario)
psql "postgresql://postgres.jaltrpmlwqjgfllibnkt:chullavida@aws-1-sa-east-1.pooler.supabase.com:6543/postgres" -f supabase_schema.sql

Si prefieres no pasar la contraseña en la URI, puedes exportarla como variable de entorno temporalmente:
$env:PGPASSWORD = 'chullavida'
psql "postgresql://postgres@aws-1-sa-east-1.pooler.supabase.com:6543/postgres" -U postgres -f supabase_schema.sql
Remove-Item Env:PGPASSWORD

2) Usando el SQL Editor del dashboard de Supabase:
- Ve a tu proyecto en https://jaltrpmlwqjgfllibnkt.supabase.co
- Abre "SQL Editor" -> "New query"
- Pega el contenido de `supabase_schema.sql` y ejecútalo.

Notas y recomendaciones:
- El schema incluye los siguientes campos principales: propietario, correo (email de la cuenta Netflix), fecha_compra, fecha_pago, fecha_caducidad, precio, duracion_meses, notas, display_id
- El pooler (aws-1-sa-east-1.pooler.supabase.com:6543) está pensado para usar desde servidores o herramientas administrativas, no desde el navegador.
- Para la aplicación cliente (tu `index.html`) usa solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ya inyectados). No expongas la cadena del pooler en el cliente.
- Considera habilitar Row Level Security (RLS) y crear políticas que garanticen que cada usuario solo vea/edite sus datos.
- Si quieres, puedo generar también un archivo `migrations/001_create_netflix_accounts.sql` o un script Node/Python para ejecutar el SQL de forma automatizada.

## Entorno y cliente ADMIN (server-side)

Para tareas administrativas (respaldos, migraciones, operaciones que requieren privilegios), es necesario usar la "service_role key" de Supabase. Esta clave permite ignorar RLS y ejecutar acciones con permisos elevados — por tanto debe quedarse estrictamente en servidores de confianza.

Pasos recomendados:

1. Copia `env.admin.example.js` a `env.admin.js` en tu entorno local (o mejor, configura las variables de entorno en tu plataforma de despliegue):

	- `SUPABASE_URL` — URL de tu proyecto Supabase
	- `SUPABASE_SERVICE_ROLE_KEY` — la service_role key (sensible)
	- `PG_CONNECTION` — opcional, cadena de conexión Postgres para tareas offline

2. Usa el helper `supabase_admin_client.js` desde scripts Node/servidor. Ejemplo rápido:

	const { getAdminClient } = require('./supabase_admin_client');
	const sb = getAdminClient();

	// Usar sb para consultas administrativas

3. Hay un script de comprobación: `test_admin_client.js`. Ejecuta `node test_admin_client.js` en tu máquina donde la variable `SUPABASE_SERVICE_ROLE_KEY` esté configurada. El script evita mostrar claves y falla seguro si la clave no está presente.

Advertencias de seguridad:

- No subas `env.admin.js` ni las claves a repositorios remotos.
- No uses la service_role key desde el navegador o cliente público.
- En despliegues automatizados, usa las variables de entorno del proveedor (Vercel, Netlify, Heroku, etc.) o un secret manager.

Si quieres, puedo también:

- Añadir más helpers al cliente admin (p. ej. funciones para rotación de claves, exportación/backup a CSV, endpoints restringidos para un panel de administración).
- Crear un pipeline seguro de despliegue que inyecte las variables de entorno en CI/CD.