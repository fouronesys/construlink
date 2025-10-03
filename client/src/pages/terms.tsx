import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Shield, Users, Gavel } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Términos y Condiciones
          </h1>
          <p className="text-lg text-gray-600">
            Construlink - Plataforma de Directorio de Proveedores de Construcción
          </p>
        </div>

        <div className="space-y-6">
          {/* Liability Disclaimer - Featured prominently */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <CardTitle className="text-xl text-orange-800">
                  Exención de Responsabilidad
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-orange-800">
              <p className="text-lg font-semibold mb-4">
                IMPORTANTE: Construlink actúa únicamente como facilitador de información.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>NO somos responsables</strong> de las transacciones comerciales, contratos o acuerdos realizados entre proveedores y clientes.
                </li>
                <li>
                  <strong>NO garantizamos</strong> la calidad, puntualidad, precio o cumplimiento de los servicios ofrecidos por los proveedores registrados.
                </li>
                <li>
                  <strong>NO mediamos</strong> en disputas comerciales entre proveedores y clientes.
                </li>
                <li>
                  Toda transacción se realiza bajo la <strong>exclusiva responsabilidad</strong> de las partes involucradas.
                </li>
                <li>
                  Los usuarios deben realizar su propia <strong>debida diligencia</strong> antes de contratar cualquier servicio.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-600" />
                <CardTitle>Descripción del Servicio</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Construlink es una plataforma digital que conecta a proveedores de materiales y servicios de construcción verificados con clientes potenciales en la República Dominicana.
              </p>
              <p>
                Nuestro servicio incluye:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Verificación de RNC a través de la DGII</li>
                <li>Directorio público de proveedores aprobados</li>
                <li>Sistema de solicitud de cotizaciones</li>
                <li>Gestión de suscripciones mensuales</li>
                <li>Proceso de aprobación administrativa</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-green-600" />
                <CardTitle>Responsabilidades del Usuario</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">Proveedores:</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Proporcionar información veraz y actualizada</li>
                <li>Mantener documentación legal válida</li>
                <li>Cumplir con las obligaciones fiscales dominicanas</li>
                <li>Responder de manera profesional a las solicitudes de cotización</li>
                <li>Mantener al día el pago de la suscripción mensual</li>
              </ul>
              
              <h4 className="font-semibold mt-4">Clientes:</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Verificar las credenciales y capacidades de los proveedores</li>
                <li>Negociar directamente con los proveedores</li>
                <li>Realizar contratos y acuerdos bajo su propia responsabilidad</li>
                <li>Respetar los términos acordados con los proveedores</li>
              </ul>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Términos de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                <strong>Suscripción Mensual:</strong> RD$1,000 pesos dominicanos por mes para proveedores aprobados.
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Período de prueba de 7 días</li>
                <li>Facturación automática mensual</li>
                <li>Suspensión automática por falta de pago</li>
                <li>Procesamiento a través de Verifone</li>
                <li>No hay reembolsos por períodos parciales</li>
              </ul>
            </CardContent>
          </Card>

          {/* Legal Framework */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Gavel className="w-6 h-6 text-purple-600" />
                <CardTitle>Marco Legal</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Estos términos se rigen por las leyes de la República Dominicana. 
                Cualquier disputa será resuelta en los tribunales competentes de Santo Domingo.
              </p>
              <p>
                <strong>Modificaciones:</strong> Nos reservamos el derecho de modificar estos términos con previo aviso de 30 días.
              </p>
              <p>
                <strong>Validez:</strong> Si alguna disposición de estos términos es declarada inválida, las demás disposiciones permanecerán en vigor.
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
                Para consultas sobre estos términos y condiciones, contacte a:
              </p>
              <p className="mt-2">
                <strong>Construlink</strong><br />
                Email: legal@construlink.com<br />
                Teléfono: +1 (809) 123-4567
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