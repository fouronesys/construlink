import type { Subscription } from "@shared/schema";
import nodemailer from 'nodemailer';

// Configurar el transportador SMTP
const createTransporter = () => {
  // Si no hay configuración SMTP, retornar null
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true para puerto 465, false para otros puertos
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const transporter = createTransporter();

// ConstruLink Branding Colors
const BRAND_COLORS = {
  primary: '#2b4a7c',      // Azul ConstruLink
  secondary: '#ff9900',    // Naranja ConstruLink
  text: '#333333',
  textLight: '#666666',
  background: '#f5f5f5',
  white: '#ffffff'
};

// Email Template Wrapper
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ConstruLink</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${BRAND_COLORS.background};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND_COLORS.background}; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${BRAND_COLORS.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, #1e3a5f 100%); padding: 30px 40px; text-align: center;">
              <img src="https://i.postimg.cc/SsZMnmWw/construlink-logo.png" alt="ConstruLink" style="height: 60px; margin-bottom: 10px;">
              <h1 style="color: ${BRAND_COLORS.white}; margin: 10px 0 0 0; font-size: 24px; font-weight: 600;">ConstruLink</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Conectamos proveedores con oportunidades</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px 40px; border-top: 3px solid ${BRAND_COLORS.secondary};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0 0 10px 0; color: ${BRAND_COLORS.text}; font-size: 16px; font-weight: 600;">Equipo ConstruLink</p>
                    <p style="margin: 0; color: ${BRAND_COLORS.textLight}; font-size: 14px; line-height: 1.5;">
                      Tu plataforma de confianza para conectar con los mejores proveedores de la industria de la construcción.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: ${BRAND_COLORS.textLight}; font-size: 12px; line-height: 1.6;">
                          <p style="margin: 0 0 5px 0;">📧 Email: <a href="mailto:soporte@construlink.com" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">soporte@construlink.com</a></p>
                          <p style="margin: 0 0 5px 0;">🌐 Web: <a href="https://construlink.com" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">www.construlink.com</a></p>
                          <p style="margin: 0;">📱 WhatsApp: <a href="https://wa.me/18095551234" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">+1 (809) 555-1234</a></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px; text-align: center;">
                    <p style="margin: 0; color: ${BRAND_COLORS.textLight}; font-size: 11px;">
                      © ${new Date().getFullYear()} ConstruLink. Todos los derechos reservados.<br>
                      República Dominicana
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Email templates
const emailTemplates = {
  trialReminder: (supplierName: string, daysRemaining: number, plan: string) => ({
    subject: `Tu período de prueba termina en ${daysRemaining} días`,
    html: emailWrapper(`
      <h2 style="color: ${BRAND_COLORS.secondary}; margin: 0 0 20px 0; font-size: 22px;">⏰ Recordatorio de Período de Prueba</h2>
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Hola <strong>${supplierName}</strong>,</p>
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
        Tu período de prueba gratuito del <strong style="color: ${BRAND_COLORS.primary};">${plan}</strong> terminará en <strong style="color: ${BRAND_COLORS.secondary};">${daysRemaining} días</strong>.
      </p>
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Para continuar disfrutando de todas las funcionalidades, asegúrate de tener un método de pago activo.
      </p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid ${BRAND_COLORS.primary}; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: ${BRAND_COLORS.primary}; font-weight: 600; font-size: 16px;">Beneficios de tu plan:</p>
        <ul style="margin: 0; padding-left: 20px; color: ${BRAND_COLORS.text};">
          ${plan === 'Plan Básico' ? `
            <li style="margin-bottom: 8px;">Hasta 10 productos en catálogo</li>
            <li style="margin-bottom: 8px;">Recibir hasta 5 cotizaciones por mes</li>
            <li style="margin-bottom: 8px;">Soporte por email</li>
          ` : plan === 'Plan Profesional' ? `
            <li style="margin-bottom: 8px;">Productos ilimitados</li>
            <li style="margin-bottom: 8px;">Cotizaciones ilimitadas</li>
            <li style="margin-bottom: 8px;">Perfil destacado en búsquedas</li>
            <li style="margin-bottom: 8px;">Soporte prioritario</li>
          ` : `
            <li style="margin-bottom: 8px;">Todo ilimitado</li>
            <li style="margin-bottom: 8px;">Analytics avanzados</li>
            <li style="margin-bottom: 8px;">Gerente de cuenta dedicado</li>
            <li style="margin-bottom: 8px;">Soporte 24/7</li>
          `}
        </ul>
      </div>
      
      <p style="color: ${BRAND_COLORS.textLight}; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
        Si tienes alguna pregunta, no dudes en contactarnos.
      </p>
    `),
    text: `Hola ${supplierName}, tu período de prueba del ${plan} terminará en ${daysRemaining} días. Asegúrate de tener un método de pago activo para continuar.`
  }),

  trialEnded: (supplierName: string, plan: string) => ({
    subject: 'Tu período de prueba ha finalizado',
    html: emailWrapper(`
      <h2 style="color: ${BRAND_COLORS.primary}; margin: 0 0 20px 0; font-size: 22px;">⌛ Período de Prueba Finalizado</h2>
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Hola <strong>${supplierName}</strong>,</p>
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
        Tu período de prueba del <strong style="color: ${BRAND_COLORS.primary};">${plan}</strong> ha finalizado.
      </p>
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Para continuar accediendo a todas las funcionalidades, activa tu suscripción desde tu panel de control.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://construlink.com/dashboard/subscription" style="display: inline-block; padding: 14px 30px; background-color: ${BRAND_COLORS.secondary}; color: ${BRAND_COLORS.white}; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Activar Suscripción</a>
      </div>
      
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
        ¡Gracias por probar nuestro servicio!
      </p>
    `),
    text: `Hola ${supplierName}, tu período de prueba del ${plan} ha finalizado. Activa tu suscripción para continuar.`
  }),

  welcomeSubscription: (supplierName: string, plan: string, trialDays: number) => ({
    subject: `¡Bienvenido a ${plan}!`,
    html: emailWrapper(`
      <h2 style="color: ${BRAND_COLORS.secondary}; margin: 0 0 20px 0; font-size: 22px;">🎉 ¡Bienvenido a ConstruLink!</h2>
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Hola <strong>${supplierName}</strong>,</p>
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
        ¡Felicidades! Te has suscrito exitosamente al <strong style="color: ${BRAND_COLORS.primary};">${plan}</strong>.
      </p>
      
      <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="margin: 0; font-size: 18px; color: ${BRAND_COLORS.primary};">
          Tienes <strong style="color: ${BRAND_COLORS.secondary}; font-size: 24px;">${trialDays} días</strong> de prueba gratuita
        </p>
      </div>
      
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 20px 0 10px 0;">Durante este período podrás:</p>
      <ul style="color: ${BRAND_COLORS.text}; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
        <li>✅ Configurar tu perfil de proveedor</li>
        <li>✅ Agregar tus productos y servicios</li>
        <li>✅ Recibir cotizaciones de clientes potenciales</li>
        <li>✅ Acceder a todas las herramientas del plan</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://construlink.com/dashboard" style="display: inline-block; padding: 14px 30px; background-color: ${BRAND_COLORS.primary}; color: ${BRAND_COLORS.white}; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Ir a mi Dashboard</a>
      </div>
      
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
        ¡Comienza ahora y haz crecer tu negocio!
      </p>
    `),
    text: `¡Bienvenido ${supplierName}! Te has suscrito al ${plan} con ${trialDays} días de prueba gratuita.`
  }),

  paymentSuccess: (supplierName: string, amount: number, plan: string) => ({
    subject: 'Confirmación de Pago Recibido',
    html: emailWrapper(`
      <h2 style="color: #059669; margin: 0 0 20px 0; font-size: 22px;">✅ Pago Recibido Exitosamente</h2>
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Hola <strong>${supplierName}</strong>,</p>
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hemos recibido tu pago de <strong style="color: #059669; font-size: 20px;">RD$${amount.toLocaleString()}</strong> para el <strong style="color: ${BRAND_COLORS.primary};">${plan}</strong>.
      </p>
      
      <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0;">
        <p style="margin: 0; color: #059669; font-size: 16px;">
          ✓ Tu suscripción está activa
        </p>
      </div>
      
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 20px 0;">
        Puedes descargar tu factura desde tu panel de control.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://construlink.com/dashboard/billing" style="display: inline-block; padding: 14px 30px; background-color: ${BRAND_COLORS.primary}; color: ${BRAND_COLORS.white}; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Ver Factura</a>
      </div>
      
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
        Gracias por tu confianza.
      </p>
    `),
    text: `Hola ${supplierName}, hemos recibido tu pago de RD$${amount.toLocaleString()} para ${plan}.`
  }),

  paymentFailed: (supplierName: string, plan: string) => ({
    subject: 'Error al Procesar tu Pago',
    html: emailWrapper(`
      <h2 style="color: #dc2626; margin: 0 0 20px 0; font-size: 22px;">⚠️ Error al Procesar Pago</h2>
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Hola <strong>${supplierName}</strong>,</p>
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        No hemos podido procesar tu pago para el <strong style="color: ${BRAND_COLORS.primary};">${plan}</strong>.
      </p>
      
      <div style="background-color: #fee; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: #dc2626; font-weight: 600; font-size: 16px;">Posibles causas:</p>
        <ul style="margin: 0; padding-left: 20px; color: ${BRAND_COLORS.text}; font-size: 14px;">
          <li style="margin-bottom: 5px;">Fondos insuficientes</li>
          <li style="margin-bottom: 5px;">Tarjeta vencida o bloqueada</li>
          <li style="margin-bottom: 5px;">Datos de pago incorrectos</li>
        </ul>
      </div>
      
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 20px 0;">
        Por favor, verifica tu método de pago e intenta nuevamente.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://construlink.com/dashboard/payment-methods" style="display: inline-block; padding: 14px 30px; background-color: ${BRAND_COLORS.secondary}; color: ${BRAND_COLORS.white}; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Actualizar Método de Pago</a>
      </div>
      
      <p style="color: ${BRAND_COLORS.textLight}; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
        Si el problema persiste, contáctanos para ayudarte.
      </p>
    `),
    text: `Hola ${supplierName}, no hemos podido procesar tu pago para ${plan}. Por favor, verifica tu método de pago.`
  }),

  subscriptionCancelled: (supplierName: string, plan: string, endDate: string) => ({
    subject: 'Confirmación de Cancelación de Suscripción',
    html: emailWrapper(`
      <h2 style="color: ${BRAND_COLORS.primary}; margin: 0 0 20px 0; font-size: 22px;">Suscripción Cancelada</h2>
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Hola <strong>${supplierName}</strong>,</p>
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Tu suscripción al <strong style="color: ${BRAND_COLORS.primary};">${plan}</strong> ha sido cancelada.
      </p>
      
      <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid ${BRAND_COLORS.secondary}; margin: 20px 0;">
        <p style="margin: 0; color: ${BRAND_COLORS.text}; font-size: 16px;">
          Podrás continuar accediendo a las funcionalidades hasta el <strong style="color: ${BRAND_COLORS.secondary};">${endDate}</strong>
        </p>
      </div>
      
      <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 20px 0;">
        Lamentamos verte partir. Si cambias de opinión, puedes reactivar tu suscripción en cualquier momento.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://construlink.com/dashboard/subscription" style="display: inline-block; padding: 14px 30px; background-color: ${BRAND_COLORS.primary}; color: ${BRAND_COLORS.white}; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Reactivar Suscripción</a>
      </div>
      
      <p style="color: ${BRAND_COLORS.textLight}; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
        ¿Nos ayudas con tu feedback? Cuéntanos por qué cancelaste tu suscripción.
      </p>
    `),
    text: `Hola ${supplierName}, tu suscripción al ${plan} ha sido cancelada. Acceso hasta ${endDate}.`
  })
};

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Email service using SMTP
async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    if (!transporter) {
      // Fallback: log to console if SMTP is not configured
      console.warn('⚠️ Configuración SMTP incompleta. Email no enviado (solo simulación):');
      console.log('📧 Email simulado:', {
        to: emailData.to,
        subject: emailData.subject,
        preview: emailData.text.substring(0, 100) + '...'
      });
      return false;
    }

    // Send email using SMTP
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    console.log('✅ Email enviado exitosamente:', {
      messageId: info.messageId,
      to: emailData.to,
      subject: emailData.subject
    });
    
    return true;
  } catch (error) {
    console.error('Error al enviar email:', error);
    return false;
  }
}

// Send trial reminder email
export async function sendTrialReminder(
  email: string,
  supplierName: string,
  daysRemaining: number,
  plan: string
): Promise<boolean> {
  const template = emailTemplates.trialReminder(supplierName, daysRemaining, plan);
  return await sendEmail({
    to: email,
    ...template
  });
}

// Send trial ended email
export async function sendTrialEnded(
  email: string,
  supplierName: string,
  plan: string
): Promise<boolean> {
  const template = emailTemplates.trialEnded(supplierName, plan);
  return await sendEmail({
    to: email,
    ...template
  });
}

// Send welcome email
export async function sendWelcomeEmail(
  email: string,
  supplierName: string,
  plan: string,
  trialDays: number
): Promise<boolean> {
  const template = emailTemplates.welcomeSubscription(supplierName, plan, trialDays);
  return await sendEmail({
    to: email,
    ...template
  });
}

// Send payment success email
export async function sendPaymentSuccess(
  email: string,
  supplierName: string,
  amount: number,
  plan: string
): Promise<boolean> {
  const template = emailTemplates.paymentSuccess(supplierName, amount, plan);
  return await sendEmail({
    to: email,
    ...template
  });
}

// Send payment failed email
export async function sendPaymentFailed(
  email: string,
  supplierName: string,
  plan: string
): Promise<boolean> {
  const template = emailTemplates.paymentFailed(supplierName, plan);
  return await sendEmail({
    to: email,
    ...template
  });
}

// Send subscription cancelled email
export async function sendSubscriptionCancelled(
  email: string,
  supplierName: string,
  plan: string,
  endDate: string
): Promise<boolean> {
  const template = emailTemplates.subscriptionCancelled(supplierName, plan, endDate);
  return await sendEmail({
    to: email,
    ...template
  });
}

// Check trials expiring soon and send reminders
export async function checkTrialReminders(storage: any): Promise<void> {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    // Get all trialing subscriptions
    const trialingSubscriptions = await storage.getTrialingSubscriptions();
    
    for (const subscription of trialingSubscriptions) {
      if (!subscription.trialEndDate) continue;
      
      const trialEndDate = new Date(subscription.trialEndDate);
      const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Send reminder 3 days before trial ends
      if (daysRemaining === 3) {
        const supplier = await storage.getSupplier(subscription.supplierId);
        if (supplier) {
          await sendTrialReminder(
            supplier.email,
            supplier.legalName,
            daysRemaining,
            getPlanDisplayName(subscription.plan)
          );
          console.log(`Recordatorio de trial enviado a ${supplier.email} (${daysRemaining} días restantes)`);
        }
      }
      
      // Send reminder on trial end date
      if (daysRemaining === 0) {
        const supplier = await storage.getSupplier(subscription.supplierId);
        if (supplier) {
          await sendTrialEnded(
            supplier.email,
            supplier.legalName,
            getPlanDisplayName(subscription.plan)
          );
          console.log(`Notificación de fin de trial enviada a ${supplier.email}`);
        }
      }
    }
  } catch (error) {
    console.error('Error al verificar recordatorios de trial:', error);
  }
}

// Helper function to get display name for plan
function getPlanDisplayName(plan: string): string {
  const planNames: Record<string, string> = {
    basic: 'Plan Básico',
    professional: 'Plan Profesional',
    enterprise: 'Plan Empresarial'
  };
  return planNames[plan] || plan;
}
