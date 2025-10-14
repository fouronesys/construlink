import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function sendTestEmail() {
  try {
    // Crear transportador SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('📧 Enviando email de prueba...');
    console.log('Servidor:', process.env.SMTP_HOST);
    console.log('Puerto:', process.env.SMTP_PORT);
    console.log('Usuario:', process.env.SMTP_USER);
    console.log('Email desde:', process.env.EMAIL_FROM || process.env.SMTP_USER);

    // Enviar email de prueba
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Enviar al mismo usuario como prueba
      subject: 'Email de Prueba - Sistema de Proveedores',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">✅ Email de Prueba Exitoso</h2>
          <p>¡Felicidades! Tu servidor SMTP está configurado correctamente.</p>
          <p><strong>Detalles de la configuración:</strong></p>
          <ul>
            <li>Servidor: ${process.env.SMTP_HOST}</li>
            <li>Puerto: ${process.env.SMTP_PORT}</li>
            <li>Seguridad: ${process.env.SMTP_SECURE === 'true' ? 'SSL' : 'STARTTLS'}</li>
            <li>Email desde: ${process.env.EMAIL_FROM || process.env.SMTP_USER}</li>
          </ul>
          <p>El sistema ya puede enviar emails transaccionales:</p>
          <ul>
            <li>Bienvenida a nuevos suscriptores</li>
            <li>Recordatorios de período de prueba</li>
            <li>Confirmaciones de pago</li>
            <li>Notificaciones de cancelación</li>
          </ul>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Este es un email de prueba del sistema de proveedores verificados.
          </p>
        </div>
      `,
      text: `
Email de Prueba Exitoso

¡Felicidades! Tu servidor SMTP está configurado correctamente.

Detalles de la configuración:
- Servidor: ${process.env.SMTP_HOST}
- Puerto: ${process.env.SMTP_PORT}
- Seguridad: ${process.env.SMTP_SECURE === 'true' ? 'SSL' : 'STARTTLS'}
- Email desde: ${process.env.EMAIL_FROM || process.env.SMTP_USER}

El sistema ya puede enviar emails transaccionales.
      `,
    });

    console.log('\n✅ Email enviado exitosamente!');
    console.log('Message ID:', info.messageId);
    console.log('Destinatario:', process.env.SMTP_USER);
    console.log('\n📬 Revisa tu bandeja de entrada en:', process.env.SMTP_USER);
    
  } catch (error) {
    console.error('\n❌ Error al enviar email:', error);
    if (error instanceof Error) {
      console.error('Detalles:', error.message);
    }
  }
}

sendTestEmail();
