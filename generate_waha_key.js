/**
 * generate_waha_key.js
 * Script simple para generar una clave API segura para WAHA
 */

const crypto = require('crypto');

console.log('\n' + '='.repeat(60));
console.log('🔑 Generador de Clave API para WAHA');
console.log('='.repeat(60) + '\n');

// Generar clave aleatoria de 32 bytes (256 bits)
const apiKey = crypto.randomBytes(32).toString('hex');

console.log('Tu clave API segura es:\n');
console.log('┌' + '─'.repeat(66) + '┐');
console.log('│ ' + apiKey + ' │');
console.log('└' + '─'.repeat(66) + '┘');

console.log('\n📋 Usa esta clave en Railway:\n');
console.log('1. En el servicio WAHA:');
console.log('   Variable: WHATSAPP_API_KEY');
console.log('   Valor: ' + apiKey);

console.log('\n2. En tu app principal:');
console.log('   Variable: WAHA_API_KEY');
console.log('   Valor: ' + apiKey);

console.log('\n⚠️  IMPORTANTE:');
console.log('   - Guarda esta clave en un lugar seguro');
console.log('   - NO la compartas ni la subas a GitHub');
console.log('   - Debe ser la MISMA en ambos servicios');

console.log('\n' + '='.repeat(60) + '\n');
