const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jaltrpmlwqjgfllibnkt.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbHRycG1sd3FqZ2ZsbGlibmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4ODg0MDIsImV4cCI6MjA3NTQ2NDQwMn0.rcKdQXz5w4W9DVlIbO4F0pT20vBvKjq0DlqD6JTQUiY'; // Reemplaza o usa variable de entorno

if (supabaseKey === 'YOUR_ANON_KEY') {
  console.error('Error: SUPABASE_ANON_KEY no está configurada. Reemplaza el placeholder con tu clave anónima real.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsertUser() {
  try {
    // Usuario específico
    const testEmail = 'atreyucasta2@gmail.com';
    const testPassword = 'Cryptopago1';
    
    console.log(`Intentando crear usuario con email: ${testEmail}`);
    
    // Crear un usuario de prueba con confirmación de email desactivada
    const { data: userData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: undefined,
        data: {
          test: true
        }
      }
    });

    if (signUpError) {
      console.error('Error al crear usuario:', signUpError.message);
      console.error('Detalles del error:', signUpError);
      return;
    }

    console.log('✓ Usuario creado exitosamente:', userData.user?.email);
    console.log('User ID:', userData.user?.id);
    console.log('Confirmación pendiente:', userData.user?.email_confirmed_at === null);

    const userId = userData.user?.id;
    
    if (!userId) {
      console.error('Error: No se pudo obtener el ID del usuario');
      return;
    }

    // Esperar un momento para asegurar que el usuario se haya registrado completamente
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar sesión activa
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Sesión activa:', sessionData.session ? 'Sí' : 'No');
    
    if (!sessionData.session) {
      console.log('Intentando iniciar sesión...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (signInError) {
        console.error('Error al iniciar sesión:', signInError.message);
        return;
      }
      console.log('✓ Sesión iniciada correctamente');
    }

    // Insertar un registro en netflix_accounts
    console.log('\nIntentando insertar registro en netflix_accounts...');
    const newRecord = {
      user_id: userId,
      propietario: 'Usuario de Prueba',
      correo: testEmail,
      fecha_compra: '2023-10-01',
      precio: 15.99,
      duracion_meses: 1,
      notas: 'Registro de prueba generado automáticamente'
    };
    // Log del payload para diagnosticar posibles id: null enviados por el cliente
    console.log('Payload a insertar en netflix_accounts:', JSON.stringify(newRecord, null, 2));

    const { data: insertData, error: insertError } = await supabase
      .from('netflix_accounts')
      .insert([ newRecord ])
      .select();

    if (insertError) {
      console.error('✗ Error al insertar registro:', insertError.message);
      console.error('Detalles completos:', insertError);
      console.error('\nPosibles causas:');
      console.error('1. Row Level Security (RLS) está activado sin políticas');
      console.error('2. La tabla netflix_accounts no existe');
      console.error('3. Faltan permisos en la tabla');
    } else {
      console.log('✓ Registro insertado exitosamente en netflix_accounts!');
      console.log('Datos insertados:', insertData);
    }
  } catch (err) {
    console.error('✗ Error general:', err.message);
    console.error('Stack:', err);
  }
}

testInsertUser();