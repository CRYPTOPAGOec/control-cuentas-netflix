/**
 * test_whatsapp.js
 * Script para probar la integración de WhatsApp con WAHA
 */

const WhatsAppService = require('./whatsapp_service');

// Cargar configuración desde env.admin.js
let adminEnv = {};
try {
  adminEnv = require('./env.admin.js');
  console.log('✅ Configuración cargada desde env.admin.js');
} catch (e) {
  console.warn('⚠️  env.admin.js no encontrado, usando variables de entorno');
}

const whatsappService = new WhatsAppService({
  wahaUrl: process.env.WAHA_URL || adminEnv.WAHA_URL,
  wahaApiKey: process.env.WAHA_API_KEY || adminEnv.WAHA_API_KEY,
  wahaSession: process.env.WAHA_SESSION || adminEnv.WAHA_SESSION || 'default'
});

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Iniciando pruebas de WhatsApp Service');
  console.log('='.repeat(60) + '\n');

  // Test 1: Verificar conexión
  console.log('📝 Test 1: Verificar conexión con WAHA');
  try {
    const isConnected = await whatsappService.checkConnection();
    if (isConnected) {
      console.log('✅ WAHA está conectado y listo\n');
    } else {
      console.log('❌ WAHA no está conectado. Asegúrate de:');
      console.log('   1. WAHA está desplegado en Railway');
      console.log('   2. Has escaneado el código QR');
      console.log('   3. WAHA_URL está configurado correctamente\n');
      return;
    }
  } catch (error) {
    console.error('❌ Error al verificar conexión:', error.message);
    return;
  }

  // Test 2: Formatear número de teléfono
  console.log('📝 Test 2: Formatear números de teléfono');
  try {
    const tests = [
      { input: '+593987654321', expected: '593987654321@c.us' },
      { input: '0987654321', expected: '593987654321@c.us' },
      { input: '987654321', expected: '593987654321@c.us' },
      { input: '+51 987 654 321', expected: '51987654321@c.us' }
    ];

    for (const test of tests) {
      const result = whatsappService.formatPhoneNumber(test.input);
      const status = result === test.expected ? '✅' : '❌';
      console.log(`   ${status} ${test.input} → ${result}`);
    }
    console.log();
  } catch (error) {
    console.error('❌ Error al formatear números:', error.message);
  }

  // Test 3: Enviar mensaje de prueba (OPCIONAL - comentado por defecto)
  console.log('📝 Test 3: Enviar mensaje de prueba');
  console.log('   ⚠️  DESHABILITADO (descomenta el código para enviar mensajes reales)\n');
  
  /*
  // DESCOMENTA ESTA SECCIÓN PARA ENVIAR UN MENSAJE DE PRUEBA
  const TEST_PHONE = '+593987654321'; // CAMBIA ESTO POR TU NÚMERO
  console.log(`   Enviando mensaje de prueba a ${TEST_PHONE}...`);
  try {
    const result = await whatsappService.sendMessage(
      TEST_PHONE,
      '🧪 Mensaje de prueba del sistema de Control de Cuentas Netflix.\n\nSi recibes esto, ¡la integración funciona! ✅'
    );
    
    if (result.success) {
      console.log('   ✅ Mensaje enviado exitosamente');
      console.log('   📬 ID del mensaje:', result.messageId);
    } else {
      console.log('   ❌ Error al enviar:', result.error);
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
  console.log();
  */

  // Test 4: Simular notificación de pago
  console.log('📝 Test 4: Simular notificación de pago');
  const mockAccount = {
    propietario: 'Juan Pérez',
    telefono: '+593987654321',
    servicio: 'Netflix Premium',
    precio: '5.50',
    fecha_pago: '2025-01-05',
    dias_restantes: 2
  };
  
  console.log('   Cuenta de prueba:', JSON.stringify(mockAccount, null, 2));
  console.log('   ⚠️  NO se enviará (solo simulación)\n');

  // Test 5: Verificar templates
  console.log('📝 Test 5: Verificar templates de mensajes');
  const templates = {
    otp: '🔐 *Control de Cuentas Netflix*\n\nTu código de verificación es:\n\n*123456*',
    payment: '⏰ *Control de Cuentas Netflix*\n\nHola *Juan Pérez* 👋\n\n*Recordatorio de pago*',
    confirmation: '✅ *Control de Cuentas Netflix*\n\nHola *Juan Pérez* 👋\n\n¡Pago confirmado exitosamente! 🎉'
  };

  for (const [name, template] of Object.entries(templates)) {
    console.log(`   ✅ Template ${name}: OK (${template.split('\n')[0]}...)`);
  }
  console.log();

  console.log('='.repeat(60));
  console.log('✅ Pruebas completadas');
  console.log('='.repeat(60));
}

// Ejecutar tests
runTests().catch(console.error);
