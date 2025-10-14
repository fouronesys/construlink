import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Lock, Eye, Database, UserCheck, FileText } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Política de Privacidad
          </h1>
          <p className="text-lg text-gray-600">
            Construlink - Plataforma de Directorio de Proveedores de Construcción
          </p>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-600" />
                <CardTitle>Introducción</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                En Construlink, respetamos y protegemos la privacidad de nuestros usuarios. Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos su información personal cuando utiliza nuestra plataforma.
              </p>
              <p>
                Al utilizar Construlink, usted acepta las prácticas descritas en esta política.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-green-600" />
                <CardTitle>Información que Recopilamos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">Información de Proveedores:</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nombre legal de la empresa</li>
                <li>Registro Nacional de Contribuyentes (RNC)</li>
                <li>Información de contacto (correo electrónico, teléfono, dirección)</li>
                <li>Especialidades y servicios ofrecidos</li>
                <li>Documentos de verificación (licencias, certificados)</li>
                <li>Información de suscripción y pagos</li>
              </ul>
              
              <h4 className="font-semibold mt-4">Información de Clientes:</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nombre y apellido</li>
                <li>Correo electrónico</li>
                <li>Número de teléfono (opcional)</li>
                <li>Información de solicitudes de cotización</li>
              </ul>

              <h4 className="font-semibold mt-4">Información Técnica:</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Dirección IP</li>
                <li>Tipo de navegador y dispositivo</li>
                <li>Páginas visitadas y tiempo de navegación</li>
                <li>Cookies y tecnologías similares</li>
              </ul>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-purple-600" />
                <CardTitle>Cómo Utilizamos su Información</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Utilizamos la información recopilada para:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Verificar la identidad y legitimidad de los proveedores registrados</li>
                <li>Facilitar la conexión entre proveedores y clientes</li>
                <li>Procesar suscripciones y pagos</li>
                <li>Enviar notificaciones importantes sobre el servicio</li>
                <li>Mejorar la funcionalidad y experiencia de la plataforma</li>
                <li>Cumplir con obligaciones legales y regulatorias</li>
                <li>Prevenir fraudes y garantizar la seguridad de la plataforma</li>
              </ul>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-orange-600" />
                <CardTitle>Compartir Información</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                <strong>Información Pública:</strong> Los perfiles de proveedores aprobados son visibles públicamente en nuestro directorio, incluyendo nombre legal, RNC, ubicación, especialidades y descripción de servicios.
              </p>
              <p>
                <strong>No vendemos su información:</strong> Nunca vendemos, alquilamos o compartimos su información personal con terceros con fines de marketing.
              </p>
              <p>
                <strong>Compartimos información con:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Proveedores de servicios:</strong> Azul para procesamiento de pagos, servicios de hosting y almacenamiento</li>
                <li><strong>Autoridades:</strong> Cuando sea requerido por ley o para proteger nuestros derechos legales</li>
                <li><strong>DGII:</strong> Para verificación de RNC de proveedores</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-red-600" />
                <CardTitle>Seguridad de los Datos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Cifrado de datos en tránsito y en reposo</li>
                <li>Acceso restringido a información personal</li>
                <li>Autenticación segura de usuarios</li>
                <li>Monitoreo continuo de seguridad</li>
                <li>Actualizaciones regulares de sistemas de seguridad</li>
              </ul>
              <p className="mt-4">
                Sin embargo, ningún método de transmisión por Internet o almacenamiento electrónico es 100% seguro. No podemos garantizar la seguridad absoluta de su información.
              </p>
            </CardContent>
          </Card>

          {/* User Rights */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-indigo-600" />
                <CardTitle>Sus Derechos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Usted tiene derecho a:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Acceder:</strong> Solicitar una copia de la información personal que tenemos sobre usted</li>
                <li><strong>Rectificar:</strong> Corregir información inexacta o incompleta</li>
                <li><strong>Eliminar:</strong> Solicitar la eliminación de su información personal (sujeto a obligaciones legales)</li>
                <li><strong>Oponerse:</strong> Oponerse al procesamiento de su información para ciertos fines</li>
                <li><strong>Portabilidad:</strong> Solicitar una copia de su información en formato estructurado</li>
                <li><strong>Retirar consentimiento:</strong> Retirar su consentimiento en cualquier momento</li>
              </ul>
              <p className="mt-4">
                Para ejercer estos derechos, contáctenos a: privacy@construlink.com
              </p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle>Retención de Datos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Conservamos su información personal durante el tiempo necesario para cumplir con los fines descritos en esta política, a menos que la ley requiera o permita un período de retención más largo.
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Información de proveedores activos: Durante la vigencia de la suscripción</li>
                <li>Información de proveedores inactivos: Hasta 5 años después de la cancelación</li>
                <li>Registros de transacciones: Según lo requiera la ley dominicana (mínimo 5 años)</li>
                <li>Información de clientes: Hasta que soliciten su eliminación o 2 años de inactividad</li>
              </ul>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Cambios a esta Política</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos sobre cambios significativos por correo electrónico o mediante un aviso destacado en nuestra plataforma.
              </p>
              <p>
                Le recomendamos revisar esta política periódicamente para estar informado sobre cómo protegemos su información.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Para consultas sobre esta Política de Privacidad o sobre cómo manejamos su información personal, contacte a:
              </p>
              <p className="mt-2">
                <strong>Construlink</strong><br />
                Email: privacy@construlink.com<br />
                Teléfono: +1 (809) 123-4567<br />
                Dirección: Santo Domingo, República Dominicana
              </p>
            </CardContent>
          </Card>

          <Separator />
          
          <div className="text-center text-sm text-gray-500">
            <p>
              Última actualización: {new Date().toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
