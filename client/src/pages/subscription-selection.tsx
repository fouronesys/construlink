import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Shield, Users, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const subscriptionPlans = [
  {
    id: "basic",
    name: "Plan Básico",
    price: 1000,
    currency: "DOP",
    period: "mes",
    description: "Perfecto para proveedores que comienzan",
    features: [
      "Perfil básico en directorio",
      "Hasta 10 productos en catálogo",
      "Recibir hasta 5 cotizaciones por mes",
      "Soporte por email",
      "Verificación de identidad"
    ],
    limitations: [
      "Sin destacados en búsquedas",
      "Sin analytics avanzados",
      "Sin soporte prioritario"
    ],
    popular: false,
    color: "bg-blue-50 border-blue-200"
  },
  {
    id: "professional",
    name: "Plan Profesional",
    price: 2500,
    currency: "DOP",
    period: "mes",
    description: "Para proveedores establecidos",
    features: [
      "Todo lo del Plan Básico",
      "Productos ilimitados en catálogo",
      "Cotizaciones ilimitadas",
      "Hasta 5 especialidades",
      "Perfil destacado en búsquedas",
      "Analytics básicos de perfil",
      "Galería de proyectos (hasta 20 fotos)",
      "Badge de 'Proveedor Verificado'",
      "Soporte prioritario"
    ],
    limitations: [
      "Sin especialidades ilimitadas",
      "Sin análisis avanzados de competencia",
      "Sin API access",
      "Sin leads exclusivos"
    ],
    popular: true,
    color: "bg-emerald-50 border-emerald-200"
  },
  {
    id: "enterprise",
    name: "Plan Empresarial",
    price: 5000,
    currency: "DOP",
    period: "mes",
    description: "Para empresas grandes y corporaciones",
    features: [
      "Todo lo del Plan Profesional",
      "Especialidades ilimitadas",
      "Galería ilimitada de proyectos",
      "Analytics avanzados y reportes",
      "Leads exclusivos prioritarios",
      "API access completo",
      "Gerente de cuenta dedicado",
      "Soporte 24/7",
      "Badge de 'Proveedor Premium'",
      "Integración con CRM",
      "Capacitación personalizada",
      "Múltiples ubicaciones",
      "SLA garantizado"
    ],
    limitations: [],
    popular: false,
    color: "bg-purple-50 border-purple-200"
  }
];

export default function SubscriptionSelection() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePlanSelection = async (planId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para seleccionar un plan",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const plan = subscriptionPlans.find(p => p.id === planId);
      if (!plan) return;

      // Create subscription with selected plan
      const response = await apiRequest("POST", "/api/create-subscription", {
        planId: plan.id,
        planName: plan.name,
        monthlyAmount: plan.price
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Verifone payment
        window.location.href = `/payment?subscriptionId=${data.subscriptionId}&planId=${planId}`;
      } else {
        throw new Error("Error creating subscription");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear suscripción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'supplier') {
    window.location.href = '/';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Selecciona tu Plan de Suscripción
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Elige el plan que mejor se adapte a tu negocio. Todos los planes incluyen acceso completo 
            al directorio de proveedores verificados.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subscriptionPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.color} ${plan.popular ? 'ring-2 ring-emerald-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-emerald-500 text-white px-4 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Más Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {plan.id === 'basic' && <Users className="w-12 h-12 text-blue-600" />}
                  {plan.id === 'professional' && <Shield className="w-12 h-12 text-emerald-600" />}
                  {plan.id === 'enterprise' && <Zap className="w-12 h-12 text-purple-600" />}
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <p className="text-gray-600 mt-2">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    RD${plan.price.toLocaleString()}
                  </span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Incluye:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.limitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Limitaciones:</h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0">×</span>
                          <span className="text-sm text-gray-600">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handlePlanSelection(plan.id)}
                  disabled={loading}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {loading ? "Procesando..." : "Seleccionar Plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              ¿Necesitas ayuda para elegir?
            </h3>
            <p className="text-gray-600 mb-6">
              Nuestro equipo puede ayudarte a seleccionar el plan perfecto para tu negocio.
            </p>
            <Button variant="outline">
              Contactar Soporte
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}