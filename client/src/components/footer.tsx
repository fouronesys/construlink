import { Link } from "wouter";
import { Building2, Mail, Phone, MapPin, Shield, FileText } from "lucide-react";
import logoPath from "@assets/ConstructLink_20251004_013258_0000_1759557121076.png";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <img src={logoPath} alt="ConstructLink" className="h-8 w-8" />
              <span className="text-xl font-bold">ConstructLink</span>
            </div>
            <p className="text-gray-300 mb-4">
              Conectando proveedores verificados de construcción con clientes en República Dominicana.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-300">
                <Mail className="h-4 w-4" />
                <span>info@construlink.com</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <Phone className="h-4 w-4" />
                <span>+1 (809) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <MapPin className="h-4 w-4" />
                <span>Santo Domingo, República Dominicana</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-orange transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/directory" className="text-gray-300 hover:text-orange transition-colors">
                  Directorio de Proveedores
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-300 hover:text-orange transition-colors">
                  Registrarse
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-300 hover:text-orange transition-colors">
                  Ser Proveedor
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Servicios</h3>
            <ul className="space-y-2">
              <li className="text-gray-300">
                <Shield className="h-4 w-4 inline mr-2" />
                Verificación RNC
              </li>
              <li className="text-gray-300">
                <Building2 className="h-4 w-4 inline mr-2" />
                Directorio Verificado
              </li>
              <li className="text-gray-300">
                <FileText className="h-4 w-4 inline mr-2" />
                Solicitud de Cotizaciones
              </li>
              <li className="text-gray-300">
                <Mail className="h-4 w-4 inline mr-2" />
                Conexión Directa
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-orange transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-300 hover:text-orange transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="text-gray-300 hover:text-orange transition-colors">
                  Política de Cookies
                </Link>
              </li>
            </ul>
            
            {/* Liability Disclaimer */}
            <div className="mt-6 p-4 bg-orange-900/30 border border-orange-700 rounded-lg">
              <p className="text-orange-200 text-sm">
                <Shield className="h-4 w-4 inline mr-1" />
                <strong>Importante:</strong> No nos hacemos responsables de las transacciones entre proveedores y clientes. Somos facilitadores de información.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} ConstructLink. Todos los derechos reservados.
            </p>
            <p className="text-gray-400 text-sm mt-2 md:mt-0">
              Plataforma de directorio B2B para la industria de la construcción
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}