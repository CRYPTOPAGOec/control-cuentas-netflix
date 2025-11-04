#!/usr/bin/env node
/*
  Script para hacer a un usuario administrador del sistema.
  Uso: node make_admin.js <email>
*/

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Cargar env.admin.js
let adminEnv = {};
try {
  adminEnv = require(path.join(__dirname, 'env.admin.js'));
} catch(e) {
  console.error('❌ Error: No se pudo cargar env.admin.js');
  console.error('   Crea el archivo env.admin.js con tus credenciales de Supabase');
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL || adminEnv.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || adminEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function makeAdmin(email) {
  try {
    console.log(`🔍 Buscando usuario: ${email}`);
    
    // Buscar el usuario por email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Error al listar usuarios: ${listError.message}`);
    }
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      throw new Error(`Usuario con email ${email} no encontrado`);
    }
    
    console.log(`✅ Usuario encontrado: ${user.email} (ID: ${user.id})`);
    
    // Verificar si ya es admin
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
    
    if (existingRole) {
      console.log(`ℹ️  El usuario ya es administrador`);
      return;
    }
    
    // Insertar o actualizar en la tabla user_roles
    const { data, error: insertError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'admin'
      }, {
        onConflict: 'user_id'
      })
      .select();
    
    if (insertError) {
      throw new Error(`Error al insertar en tabla user_roles: ${insertError.message}`);
    }
    
    console.log(`🎉 ¡Usuario ${email} ahora es administrador!`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Obtener email de los argumentos
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Debes proporcionar un email');
  console.log('');
  console.log('Uso: node make_admin.js <email>');
  console.log('Ejemplo: node make_admin.js atreyucasta2@gmail.com');
  process.exit(1);
}

makeAdmin(email).then(() => {
  console.log('');
  console.log('✅ Proceso completado');
  process.exit(0);
});
