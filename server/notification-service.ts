import type { Subscription } from "@shared/schema";
import { Resend } from 'resend';

// Initialize Resend client (only if API key is available)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Email templates
const emailTemplates = {
  trialReminder: (supplierName: string, daysRemaining: number, plan: string) => ({
    subject: `Tu período de prueba termina en ${daysRemaining} días`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Recordatorio de Período de Prueba</h2>
        <p>Hola ${supplierName},</p>
        <p>Tu período de prueba gratuito del <strong>${plan}</strong> terminará en <strong>${daysRemaining} días</strong>.</p>
        <p>Para continuar disfrutando de todas las funcionalidades, asegúrate de tener un método de pago activo.</p>
        <p><strong>Beneficios de tu plan:</strong></p>
        <ul>
          ${plan === 'Plan Básico' ? `
            <li>Hasta 10 productos en catálogo</li>
            <li>Recibir hasta 5 cotizaciones por mes</li>
            <li>Soporte por email</li>
          ` : plan === 'Plan Profesional' ? `
            <li>Productos ilimitados</li>
            <li>Cotizaciones ilimitadas</li>
            <li>Perfil destacado en búsquedas</li>
            <li>Soporte prioritario</li>
          ` : `
            <li>Todo ilimitado</li>
            <li>Analytics avanzados</li>
            <li>Gerente de cuenta dedicado</li>
            <li>Soporte 24/7</li>
          `}
        </ul>
        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        <p>Saludos,<br>El equipo de soporte</p>
      </div>
    `,
    text: `Hola ${supplierName}, tu período de prueba del ${plan} terminará en ${daysRemaining} días. Asegúrate de tener un método de pago activo para continuar.`
  }),

  trialEnded: (supplierName: string, plan: string) => ({
    subject: 'Tu período de prueba ha finalizado',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Período de Prueba Finalizado</h2>
        <p>Hola ${supplierName},</p>
        <p>Tu período de prueba del <strong>${plan}</strong> ha finalizado.</p>
        <p>Para continuar accediendo a todas las funcionalidades, activa tu suscripción desde tu panel de control.</p>
        <p>¡Gracias por probar nuestro servicio!</p>
        <p>Saludos,<br>El equipo de soporte</p>
      </div>
    `,
    text: `Hola ${supplierName}, tu período de prueba del ${plan} ha finalizado. Activa tu suscripción para continuar.`
  }),

  welcomeSubscription: (supplierName: string, plan: string, trialDays: number) => ({
    subject: `¡Bienvenido a ${plan}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">¡Bienvenido a tu nuevo plan!</h2>
        <p>Hola ${supplierName},</p>
        <p>¡Felicidades! Te has suscrito exitosamente al <strong>${plan}</strong>.</p>
        <p>Tienes <strong>${trialDays} días de prueba gratuita</strong> para explorar todas las funcionalidades.</p>
        <p>Durante este período podrás:</p>
        <ul>
          <li>Configurar tu perfil de proveedor</li>
          <li>Agregar tus productos y servicios</li>
          <li>Recibir cotizaciones de clientes potenciales</li>
          <li>Acceder a todas las herramientas del plan</li>
        </ul>
        <p>¡Comienza ahora y haz crecer tu negocio!</p>
        <p>Saludos,<br>El equipo de soporte</p>
      </div>
    `,
    text: `¡Bienvenido ${supplierName}! Te has suscrito al ${plan} con ${trialDays} días de prueba gratuita.`
  }),

  paymentSuccess: (supplierName: string, amount: number, plan: string) => ({
    subject: 'Confirmación de Pago Recibido',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Pago Recibido Exitosamente</h2>
        <p>Hola ${supplierName},</p>
        <p>Hemos recibido tu pago de <strong>RD$${amount.toLocaleString()}</strong> para el <strong>${plan}</strong>.</p>
        <p>Tu suscripción está activa y puedes continuar disfrutando de todos los beneficios.</p>
        <p>Puedes descargar tu factura desde tu panel de control.</p>
        <p>Gracias por tu confianza.</p>
        <p>Saludos,<br>El equipo de soporte</p>
      </div>
    `,
    text: `Hola ${supplierName}, hemos recibido tu pago de RD$${amount.toLocaleString()} para ${plan}.`
  }),

  paymentFailed: (supplierName: string, plan: string) => ({
    subject: 'Error al Procesar tu Pago',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Error al Procesar Pago</h2>
        <p>Hola ${supplierName},</p>
        <p>No hemos podido procesar tu pago para el <strong>${plan}</strong>.</p>
        <p>Por favor, verifica tu método de pago e intenta nuevamente.</p>
        <p>Si el problema persiste, contáctanos para ayudarte.</p>
        <p>Saludos,<br>El equipo de soporte</p>
      </div>
    `,
    text: `Hola ${supplierName}, no hemos podido procesar tu pago para ${plan}. Por favor, verifica tu método de pago.`
  }),

  subscriptionCancelled: (supplierName: string, plan: string, endDate: string) => ({
    subject: 'Confirmación de Cancelación de Suscripción',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Suscripción Cancelada</h2>
        <p>Hola ${supplierName},</p>
        <p>Tu suscripción al <strong>${plan}</strong> ha sido cancelada.</p>
        <p>Podrás continuar accediendo a las funcionalidades hasta el <strong>${endDate}</strong>.</p>
        <p>Lamentamos verte partir. Si cambias de opinión, puedes reactivar tu suscripción en cualquier momento.</p>
        <p>Saludos,<br>El equipo de soporte</p>
      </div>
    `,
    text: `Hola ${supplierName}, tu suscripción al ${plan} ha sido cancelada. Acceso hasta ${endDate}.`
  })
};

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Email service using Resend
async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    if (!resend) {
      // Fallback: log to console if Resend is not configured
      console.warn('⚠️ RESEND_API_KEY no configurada. Email no enviado (solo simulación):');
      console.log('📧 Email simulado:', {
        to: emailData.to,
        subject: emailData.subject,
        preview: emailData.text.substring(0, 100) + '...'
      });
      return false;
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    if (error) {
      console.error('Error al enviar email con Resend:', error);
      return false;
    }

    console.log('✅ Email enviado exitosamente:', {
      id: data?.id,
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
