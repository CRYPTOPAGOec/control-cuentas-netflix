const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jaltrpmlwqjgfllibnkt.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbHRycG1sd3FqZ2ZsbGlibmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4ODg0MDIsImV4cCI6MjA3NTQ2NDQwMn0.rcKdQXz5w4W9DVlIbO4F0pT20vBvKjq0DlqD6JTQUiY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoginAndInsert() {
  try {
    const testEmail = 'atreyucasta2@gmail.com';
    const testPassword = 'Cryptopago1';
    
    console.log('Iniciando sesión...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.error('✗ Error al iniciar sesión:', signInError.message);
      console.error('\nSi el error es "Email not confirmed", ve a tu bandeja de entrada');
      console.error(`${testEmail} y confirma el email haciendo clic en el enlace.`);
      return;
    }
    
    console.log('✓ Sesión iniciada correctamente');
    console.log('User ID:', signInData.user.id);
    
    // Insertar registro de prueba
    console.log('\nInsertando registro en netflix_accounts...');
    const { data: insertData, error: insertError } = await supabase
      .from('netflix_accounts')
      .insert([
        {
          user_id: signInData.user.id,
          propietario: 'Atreyu Casta',
          correo: testEmail,
          fecha_compra: '2025-10-26',
          precio: 19.99,
          duracion_meses: 1,
          notas: 'Primera cuenta de prueba'
        }
      ])
      .select();
    
    if (insertError) {
      console.error('✗ Error al insertar:', insertError.message);
      console.error('Detalles:', insertError);
    } else {
      console.log('✓ Registro insertado exitosamente en netflix_accounts!');
      console.log('Datos:', insertData);
    }
    
    // Leer todos los registros del usuario
    console.log('\nVerificando registros del usuario...');
    const { data: records, error: selectError } = await supabase
      .from('netflix_accounts')
      .select('*')
      .eq('user_id', signInData.user.id);
    
    if (selectError) {
      console.error('✗ Error al leer registros:', selectError.message);
    } else {
      console.log(`✓ Total de registros: ${records.length}`);
      console.log('Registros:', records);
    }
    
  } catch (err) {
    console.error('✗ Error general:', err.message);
  }
}

testLoginAndInsert();
