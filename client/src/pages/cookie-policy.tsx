import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Cookie, Settings, Eye, Shield, Info } from "lucide-react";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Política de Cookies
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
                <Cookie className="w-6 h-6 text-blue-600" />
                <CardTitle>¿Qué son las Cookies?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (ordenador, tablet o móvil) cuando visita un sitio web. Las cookies permiten que el sitio web recuerde sus acciones y preferencias durante un período de tiempo.
              </p>
              <p>
                Construlink utiliza cookies para mejorar su experiencia de navegación, mantener su sesión activa y analizar cómo se utiliza nuestra plataforma.
              </p>
            </CardContent>
          </Card>

          {/* Types of Cookies */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Info className="w-6 h-6 text-green-600" />
                <CardTitle>Tipos de Cookies que Utilizamos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">1. Cookies Esenciales</h4>
              <p>
                Estas cookies son necesarias para el funcionamiento básico de la plataforma y no se pueden desactivar.
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Sesión de usuario:</strong> Mantiene su sesión activa mientras navega</li>
                <li><strong>Autenticación:</strong> Verifica que está autenticado correctamente</li>
                <li><strong>Seguridad:</strong> Protege contra ataques y fraudes</li>
              </ul>

              <h4 className="font-semibold mt-4">2. Cookies de Funcionalidad</h4>
              <p>
                Estas cookies permiten que la plataforma recuerde sus elecciones y preferencias.
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Preferencias de idioma:</strong> Recuerda su idioma preferido</li>
                <li><strong>Configuración de visualización:</strong> Mantiene sus preferencias de interfaz</li>
                <li><strong>Filtros de búsqueda:</strong> Recuerda sus últimas búsquedas y filtros</li>
              </ul>

              <h4 className="font-semibold mt-4">3. Cookies de Rendimiento</h4>
              <p>
                Estas cookies nos ayudan a entender cómo los visitantes interactúan con nuestra plataforma.
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Análisis de uso:</strong> Recopila información sobre páginas visitadas</li>
                <li><strong>Tiempo en página:</strong> Mide cuánto tiempo pasa en cada sección</li>
                <li><strong>Errores técnicos:</strong> Identifica problemas técnicos para mejorar el servicio</li>
              </ul>

              <h4 className="font-semibold mt-4">4. Cookies de Publicidad</h4>
              <p>
                Actualmente, Construlink no utiliza cookies de publicidad de terceros.
              </p>
            </CardContent>
          </Card>

          {/* Specific Cookies */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-purple-600" />
                <CardTitle>Cookies Específicas que Utilizamos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Nombre</th>
                      <th className="px-4 py-2 text-left">Propósito</th>
                      <th className="px-4 py-2 text-left">Duración</th>
                      <th className="px-4 py-2 text-left">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-4 py-2 font-mono">session_id</td>
                      <td className="px-4 py-2">Mantener sesión activa</td>
                      <td className="px-4 py-2">Al cerrar navegador</td>
                      <td className="px-4 py-2">Esencial</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono">auth_token</td>
                      <td className="px-4 py-2">Autenticación de usuario</td>
                      <td className="px-4 py-2">7 días</td>
                      <td className="px-4 py-2">Esencial</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono">user_prefs</td>
                      <td className="px-4 py-2">Preferencias de usuario</td>
                      <td className="px-4 py-2">1 año</td>
                      <td className="px-4 py-2">Funcionalidad</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono">analytics</td>
                      <td className="px-4 py-2">Análisis de uso</td>
                      <td className="px-4 py-2">2 años</td>
                      <td className="px-4 py-2">Rendimiento</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Third Party Cookies */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-orange-600" />
                <CardTitle>Cookies de Terceros</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Algunos servicios de terceros que utilizamos pueden establecer sus propias cookies:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Verifone:</strong> Para procesamiento seguro de pagos. Estas cookies son esenciales para completar transacciones.
                </li>
                <li>
                  <strong>Servicios de hosting:</strong> Para garantizar el funcionamiento y seguridad de la plataforma.
                </li>
              </ul>
              <p className="mt-4">
                Estas cookies de terceros están sujetas a las políticas de privacidad de sus respectivos proveedores.
              </p>
            </CardContent>
          </Card>

          {/* Cookie Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-indigo-600" />
                <CardTitle>Cómo Gestionar las Cookies</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Usted puede controlar y/o eliminar las cookies según desee. Puede eliminar todas las cookies que ya están en su dispositivo y configurar la mayoría de los navegadores para que no se instalen.
              </p>
              
              <h4 className="font-semibold mt-4">Gestión en su Navegador:</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Google Chrome:</strong> Configuración {'>'} Privacidad y seguridad {'>'} Cookies y otros datos de sitios</li>
                <li><strong>Mozilla Firefox:</strong> Opciones {'>'} Privacidad y seguridad {'>'} Cookies y datos del sitio</li>
                <li><strong>Safari:</strong> Preferencias {'>'} Privacidad {'>'} Cookies y datos de sitios web</li>
                <li><strong>Microsoft Edge:</strong> Configuración {'>'} Privacidad, búsqueda y servicios {'>'} Cookies</li>
              </ul>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Si bloquea o elimina las cookies esenciales, es posible que algunas funciones de la plataforma no funcionen correctamente y no pueda iniciar sesión en su cuenta.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Updates to Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Actualizaciones de esta Política</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Podemos actualizar esta Política de Cookies ocasionalmente para reflejar cambios en las cookies que utilizamos o por razones operativas, legales o regulatorias.
              </p>
              <p>
                Le recomendamos revisar esta página periódicamente para estar informado sobre nuestro uso de cookies.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Más Información</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Si tiene preguntas sobre nuestra Política de Cookies, puede contactarnos en:
              </p>
              <p className="mt-2">
                <strong>Construlink</strong><br />
                Email: cookies@construlink.com<br />
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
