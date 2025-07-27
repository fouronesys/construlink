import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/navigation";
import { Building, Users, FileText, Settings } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {user?.firstName || user?.email}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'supplier' && "Gestiona tu perfil de proveedor y revisa tus cotizaciones."}
            {user?.role === 'admin' && "Administra la plataforma y gestiona las aprobaciones."}
            {user?.role === 'superadmin' && "Control total de la plataforma."}
            {user?.role === 'client' && "Explora proveedores verificados y solicita cotizaciones."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Supplier Dashboard Link */}
          {user?.role === 'supplier' && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/supplier-dashboard')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-6 h-6 mr-2 text-primary" />
                  Panel de Proveedor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Accede a tu dashboard personalizado para gestionar tu perfil, productos y cotizaciones.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Admin Panel Link */}
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/admin-panel')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-6 h-6 mr-2 text-primary" />
                  Panel Administrativo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Gestiona aprobaciones de proveedores, revisa estadísticas y administra la plataforma.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Directory Access */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/directory')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-6 h-6 mr-2 text-emerald" />
                Directorio de Proveedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Explora nuestra base de datos de proveedores verificados y encuentra el ideal para tu proyecto.
              </p>
            </CardContent>
          </Card>

          {/* Quick Quote Request */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-6 h-6 mr-2 text-emerald" />
                Solicitar Cotización
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Obtén cotizaciones rápidas de múltiples proveedores para tu proyecto.
              </p>
              <Button 
                className="w-full bg-emerald text-emerald-foreground hover:bg-emerald/90"
                onClick={() => setLocation('/directory')}
              >
                Comenzar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity or Quick Stats */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Actividad Reciente</h2>
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay actividad reciente</h3>
                <p className="text-gray-600 mb-4">
                  Comienza explorando proveedores o gestionando tu perfil.
                </p>
                <Button onClick={() => setLocation('/directory')}>
                  Explorar Proveedores
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
