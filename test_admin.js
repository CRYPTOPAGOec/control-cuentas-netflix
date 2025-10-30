const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jaltrpmlwqjgfllibnkt.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbHRycG1sd3FqZ2ZsbGlibmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4ODg0MDIsImV4cCI6MjA3NTQ2NDQwMn0.rcKdQXz5w4W9DVlIbO4F0pT20vBvKjq0DlqD6JTQUiY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminAccess() {
  try {
    const testEmail = 'atreyucasta2@gmail.com';
    const testPassword = 'Cryptopago1';
    
    console.log('=== Verificando acceso de ADMIN ===\n');
    
    // Login
    console.log('1. Iniciando sesión como admin...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.error('✗ Error al iniciar sesión:', signInError.message);
      return;
    }
    
    console.log('✓ Sesión iniciada correctamente');
    console.log('User ID:', signInData.user.id);
    
    // Verificar rol
    console.log('\n2. Verificando rol de admin...');
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', signInData.user.id)
      .single();
    
    if (roleError) {
      console.error('✗ Error al verificar rol:', roleError.message);
    } else {
      console.log('✓ Rol actual:', roleData.role);
    }
    
    // Verificar función is_admin()
    console.log('\n3. Verificando función is_admin()...');
    const { data: isAdminData, error: isAdminError } = await supabase
      .rpc('is_admin');
    
    if (isAdminError) {
      console.error('✗ Error al verificar is_admin():', isAdminError.message);
    } else {
      console.log('✓ is_admin() retorna:', isAdminData);
    }
    
    // Ver todas las cuentas (como admin debería ver todas)
    console.log('\n4. Consultando todas las cuentas netflix_accounts...');
    const { data: allAccounts, error: accountsError } = await supabase
      .from('netflix_accounts')
      .select('*');
    
    if (accountsError) {
      console.error('✗ Error al consultar cuentas:', accountsError.message);
    } else {
      console.log(`✓ Total de cuentas visibles: ${allAccounts.length}`);
      console.log('Cuentas:', allAccounts);
    }
    
    // Ver todos los logs de auditoría (admin debería ver todos)
    console.log('\n5. Consultando logs de auditoría...');
    const { data: auditLogs, error: auditError } = await supabase
      .from('netflix_accounts_audit')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(5);
    
    if (auditError) {
      console.error('✗ Error al consultar auditoría:', auditError.message);
    } else {
      console.log(`✓ Total de logs visibles: ${auditLogs.length}`);
      console.log('Últimos logs:', auditLogs);
    }
    
    console.log('\n=== Prueba de admin completada ===');
    
  } catch (err) {
    console.error('✗ Error general:', err.message);
  }
}

testAdminAccess();
