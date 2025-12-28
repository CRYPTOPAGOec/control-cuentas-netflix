/**
 * whatsapp_service.js
 * Servicio para envío de mensajes de WhatsApp usando WAHA (WhatsApp HTTP API)
 * 
 * Características:
 * - Envío de códigos OTP para login
 * - Notificaciones de pagos pendientes
 * - Notificaciones de vencimiento
 * - Sistema de fallback a email si WAHA falla
 */

const axios = require('axios');

class WhatsAppService {
  constructor(config = {}) {
    this.wahaUrl = config.wahaUrl || process.env.WAHA_URL;
    this.wahaApiKey = config.wahaApiKey || process.env.WAHA_API_KEY;
    this.wahaSession = config.wahaSession || process.env.WAHA_SESSION || 'default';
    this.enabled = config.enabled !== false && !!this.wahaUrl;
    this.timeout = config.timeout || 15000; // 15 segundos
    
    if (!this.enabled) {
      console.warn('⚠️ WhatsApp Service: WAHA no está configurado. Los mensajes no se enviarán.');
    } else {
      console.log('✅ WhatsApp Service: Inicializado con WAHA en', this.wahaUrl);
    }
  }

  /**
   * Formatea un número de teléfono al formato de WhatsApp
   * @param {string} phone - Número en formato +593987654321 o 0987654321
   * @returns {string} - Número en formato WhatsApp: 593987654321@c.us
   */
  formatPhoneNumber(phone) {
    if (!phone) throw new Error('Número de teléfono requerido');
    
    // Limpiar el número (quitar espacios, guiones, paréntesis)
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Si empieza con '+', quitarlo
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    // Si empieza con '0' (formato local Ecuador), reemplazar por código país
    if (cleaned.startsWith('0')) {
      cleaned = '593' + cleaned.substring(1);
    }
    
    // Si no tiene código de país, asumir Ecuador (+593)
    if (cleaned.length === 9) {
      cleaned = '593' + cleaned;
    }
    
    return `${cleaned}@c.us`;
  }

  /**
   * Verifica el estado de conexión de WAHA
   * @returns {Promise<boolean>}
   */
  async checkConnection() {
    if (!this.enabled) return false;
    
    try {
      const response = await axios.get(
        `${this.wahaUrl}/api/sessions/${this.wahaSession}`,
        {
          headers: this.wahaApiKey ? { 'X-Api-Key': this.wahaApiKey } : {},
          timeout: 5000
        }
      );
      
      const isReady = response.data?.status === 'WORKING' || response.data?.status === 'READY';
      console.log(`📱 WAHA Status: ${response.data?.status} - ${isReady ? 'READY' : 'NOT READY'}`);
      return isReady;
    } catch (error) {
      console.error('❌ Error verificando conexión WAHA:', error.message);
      return false;
    }
  }

  /**
   * Envía un mensaje de texto por WhatsApp
   * @param {string} phone - Número de teléfono
   * @param {string} message - Mensaje a enviar
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendMessage(phone, message) {
    if (!this.enabled) {
      return { success: false, error: 'WAHA no configurado' };
    }

    try {
      const chatId = this.formatPhoneNumber(phone);
      
      console.log(`📤 Enviando WhatsApp a ${phone} (${chatId})`);
      
      const response = await axios.post(
        `${this.wahaUrl}/api/sendText`,
        {
          chatId: chatId,
          text: message,
          session: this.wahaSession
        },
        {
          headers: this.wahaApiKey ? { 'X-Api-Key': this.wahaApiKey } : {},
          timeout: this.timeout
        }
      );

      console.log('✅ Mensaje WhatsApp enviado exitosamente');
      
      return {
        success: true,
        messageId: response.data?.id || response.data?.messageId
      };
    } catch (error) {
      console.error('❌ Error enviando mensaje WhatsApp:', error.message);
      
      // Detalles del error
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.status, error.response.data);
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Envía un código OTP de verificación
   * @param {string} phone - Número de teléfono
   * @param {string} code - Código OTP
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendOTP(phone, code) {
    const message = `🔐 *Control de Cuentas Netflix*

Tu código de verificación es:

*${code}*

Este código es válido por *5 minutos*.

⚠️ No compartas este código con nadie.`;

    return await this.sendMessage(phone, message);
  }

  /**
   * Envía notificación de pago próximo a vencer
   * @param {Object} account - Datos de la cuenta
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendPaymentReminder(account) {
    const { propietario, telefono, servicio, precio, fecha_pago, dias_restantes } = account;
    
    let emoji = '⏰';
    let urgencia = '';
    
    if (dias_restantes <= 0) {
      emoji = '💸';
      urgencia = '*¡PAGO ATRASADO!*';
    } else if (dias_restantes === 1) {
      emoji = '🔴';
      urgencia = '*¡PAGO VENCE MAÑANA!*';
    } else if (dias_restantes === 2) {
      emoji = '⚠️';
      urgencia = '*Pago vence en 2 días*';
    } else if (dias_restantes === 3) {
      emoji = '⏰';
      urgencia = '*Recordatorio de pago*';
    }

    const message = `${emoji} *Control de Cuentas Netflix*

Hola *${propietario}* 👋

${urgencia}

📺 Servicio: ${servicio || 'Netflix'}
💰 Monto: $${precio}
📅 Fecha de pago: ${fecha_pago}
${dias_restantes > 0 ? `⏱️ Quedan: ${dias_restantes} día(s)` : '⏱️ ATRASADO'}

Por favor, realiza el pago a la brevedad posible para mantener tu servicio activo.

¡Gracias! 🙏`;

    return await this.sendMessage(telefono, message);
  }

  /**
   * Envía notificación de confirmación de pago
   * @param {Object} account - Datos de la cuenta
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendPaymentConfirmation(account) {
    const { propietario, telefono, servicio, precio, fecha_pago } = account;

    const message = `✅ *Control de Cuentas Netflix*

Hola *${propietario}* 👋

¡Pago confirmado exitosamente! 🎉

📺 Servicio: ${servicio || 'Netflix'}
💰 Monto: $${precio}
📅 Próximo pago: ${fecha_pago}

Tu servicio está activo y al día. ¡Disfruta! 🍿

Gracias por tu puntualidad. 🙏`;

    return await this.sendMessage(telefono, message);
  }

  /**
   * Envía notificación de renovación próxima
   * @param {Object} account - Datos de la cuenta
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendRenewalNotification(account) {
    const { propietario, telefono, servicio, fecha_caducidad, dias_restantes } = account;

    const message = `🔄 *Control de Cuentas Netflix*

Hola *${propietario}* 👋

Tu cuenta de ${servicio || 'Netflix'} está próxima a caducar.

📅 Fecha de caducidad: ${fecha_caducidad}
⏱️ Tiempo restante: ${dias_restantes} día(s)

Por favor, contacta al administrador para renovar tu acceso.

¡Gracias! 🙏`;

    return await this.sendMessage(telefono, message);
  }

  /**
   * Envía notificación personalizada con plantilla
   * @param {string} phone - Número de teléfono
   * @param {string} template - Plantilla del mensaje con variables
   * @param {Object} variables - Variables para reemplazar en la plantilla
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendCustomNotification(phone, template, variables) {
    let message = template;
    
    // Reemplazar variables en la plantilla
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      message = message.replace(regex, variables[key]);
    });

    return await this.sendMessage(phone, message);
  }

  /**
   * Envía múltiples mensajes con delay entre cada uno
   * @param {Array} messages - Array de {phone, message}
   * @param {number} delayMs - Delay en milisegundos entre mensajes (default: 2000)
   * @returns {Promise<Array>} - Array de resultados
   */
  async sendBulkMessages(messages, delayMs = 2000) {
    const results = [];
    
    for (let i = 0; i < messages.length; i++) {
      const { phone, message } = messages[i];
      
      console.log(`📤 Enviando mensaje ${i + 1}/${messages.length} a ${phone}`);
      
      const result = await this.sendMessage(phone, message);
      results.push({
        phone,
        ...result
      });
      
      // Esperar antes del siguiente mensaje (excepto en el último)
      if (i < messages.length - 1) {
        console.log(`⏳ Esperando ${delayMs}ms antes del siguiente mensaje...`);
        await this.delay(delayMs);
      }
    }
    
    return results;
  }

  /**
   * Utilidad para hacer delay
   * @param {number} ms - Milisegundos
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = WhatsAppService;
