import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import VerifonePayment from "@/components/verifone-payment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, Building2 } from "lucide-react";

export default function Payment() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Acceso Denegado",
        description: "Debes iniciar sesión para acceder a esta página",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    // Get subscription data from localStorage or query parameters
    const savedData = localStorage.getItem('pendingSubscription');
    if (savedData) {
      setSubscriptionData(JSON.parse(savedData));
      setLoading(false);
    } else {
      // If no subscription data, redirect to supplier registration
      setLocation('/register-supplier');
    }
  }, [user, isLoading, setLocation, toast]);

  const handlePaymentSuccess = () => {
    localStorage.removeItem('pendingSubscription');
    toast({
      title: "¡Bienvenido!",
      description: "Tu suscripción ha sido activada. Ya puedes acceder a tu dashboard.",
    });
    setLocation('/supplier-dashboard');
  };

  const handlePaymentCancel = () => {
    setLocation('/register-supplier');
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-muted-foreground">Cargando información de pago...</p>
        </div>
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <CardTitle>No hay información de suscripción</CardTitle>
            <CardDescription>
              No se encontró información de suscripción pendiente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => setLocation('/register-supplier')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Volver al Registro
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Finalizar Registro
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tu solicitud como proveedor ha sido enviada exitosamente. 
            Configura tu método de pago para activar tu suscripción.
          </p>
        </div>

        {/* Subscription Summary */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Plan Proveedor Verificado
              </CardTitle>
              <CardDescription>
                Acceso completo a la plataforma con todas las funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Período de prueba:</span>
                  <span className="font-medium text-green-600">7 días gratuitos</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Después del período de prueba:</span>
                  <span className="font-medium">RD$1,000 / mes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Beneficios incluidos:</span>
                  <span className="font-medium text-right">
                    Perfil verificado, recepción de cotizaciones,<br />
                    dashboard completo, soporte prioritario
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Component */}
        <VerifonePayment
          subscriptionId={subscriptionData.subscriptionId}
          amount={1000}
          trialEndDate={new Date(subscriptionData.trialEndDate)}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      </div>
    </div>
  );
}