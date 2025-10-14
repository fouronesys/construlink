import {
  sendTrialReminder,
  sendTrialEnded,
  sendWelcomeEmail,
  sendPaymentSuccess,
  sendPaymentFailed,
  sendSubscriptionCancelled
} from './server/notification-service';
import dotenv from 'dotenv';

dotenv.config();

const TEST_EMAIL = process.env.SMTP_USER || 'test@example.com';
const SUPPLIER_NAME = 'Proveedor de Prueba';

async function testAllEmails() {
  console.log('\n🧪 INICIANDO PRUEBA DE TODOS LOS EMAILS\n');
  console.log(`📧 Enviando todos los emails a: ${TEST_EMAIL}\n`);
  
  const results: { name: string; success: boolean }[] = [];

  try {
    // 1. Test Trial Reminder (3 días restantes)
    console.log('1️⃣  Probando: Recordatorio de Trial (3 días)...');
    const result1 = await sendTrialReminder(
      TEST_EMAIL,
      SUPPLIER_NAME,
      3,
      'Plan Profesional'
    );
    results.push({ name: 'Trial Reminder (3 días)', success: result1 });
    console.log(result1 ? '   ✅ Enviado\n' : '   ❌ Falló\n');

    // 2. Test Trial Reminder (1 día restante)
    console.log('2️⃣  Probando: Recordatorio de Trial (1 día)...');
    const result2 = await sendTrialReminder(
      TEST_EMAIL,
      SUPPLIER_NAME,
      1,
      'Plan Básico'
    );
    results.push({ name: 'Trial Reminder (1 día)', success: result2 });
    console.log(result2 ? '   ✅ Enviado\n' : '   ❌ Falló\n');

    // 3. Test Trial Ended
    console.log('3️⃣  Probando: Trial Finalizado...');
    const result3 = await sendTrialEnded(
      TEST_EMAIL,
      SUPPLIER_NAME,
      'Plan Empresarial'
    );
    results.push({ name: 'Trial Ended', success: result3 });
    console.log(result3 ? '   ✅ Enviado\n' : '   ❌ Falló\n');

    // 4. Test Welcome Email
    console.log('4️⃣  Probando: Email de Bienvenida...');
    const result4 = await sendWelcomeEmail(
      TEST_EMAIL,
      SUPPLIER_NAME,
      'Plan Profesional',
      14
    );
    results.push({ name: 'Welcome Email', success: result4 });
    console.log(result4 ? '   ✅ Enviado\n' : '   ❌ Falló\n');

    // 5. Test Payment Success
    console.log('5️⃣  Probando: Confirmación de Pago Exitoso...');
    const result5 = await sendPaymentSuccess(
      TEST_EMAIL,
      SUPPLIER_NAME,
      2500,
      'Plan Profesional'
    );
    results.push({ name: 'Payment Success', success: result5 });
    console.log(result5 ? '   ✅ Enviado\n' : '   ❌ Falló\n');

    // 6. Test Payment Failed
    console.log('6️⃣  Probando: Notificación de Pago Fallido...');
    const result6 = await sendPaymentFailed(
      TEST_EMAIL,
      SUPPLIER_NAME,
      'Plan Básico'
    );
    results.push({ name: 'Payment Failed', success: result6 });
    console.log(result6 ? '   ✅ Enviado\n' : '   ❌ Falló\n');

    // 7. Test Subscription Cancelled
    console.log('7️⃣  Probando: Confirmación de Cancelación...');
    const result7 = await sendSubscriptionCancelled(
      TEST_EMAIL,
      SUPPLIER_NAME,
      'Plan Empresarial',
      '31 de Octubre de 2025'
    );
    results.push({ name: 'Subscription Cancelled', success: result7 });
    console.log(result7 ? '   ✅ Enviado\n' : '   ❌ Falló\n');

    // Resumen
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE PRUEBAS');
    console.log('═══════════════════════════════════════════════════\n');
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.name}`);
    });
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log(`Total: ${results.length} | Exitosos: ${successful} | Fallidos: ${failed}`);
    console.log('═══════════════════════════════════════════════════\n');
    
    if (successful === results.length) {
      console.log('🎉 ¡TODOS LOS EMAILS SE ENVIARON EXITOSAMENTE!\n');
      console.log(`📬 Revisa tu bandeja de entrada en: ${TEST_EMAIL}\n`);
    } else {
      console.log('⚠️  Algunos emails no se pudieron enviar. Revisa la configuración SMTP.\n');
    }

  } catch (error) {
    console.error('\n❌ Error durante las pruebas:', error);
    if (error instanceof Error) {
      console.error('Detalles:', error.message);
    }
  }
}

testAllEmails();
