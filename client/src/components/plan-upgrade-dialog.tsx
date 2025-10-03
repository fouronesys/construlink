import { useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Crown, Shield } from "lucide-react";

interface PlanUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
  limitType: string;
  limitMessage: string;
}

const plans = [
  {
    id: "basic",
    name: "Plan Básico",
    price: 1000,
    icon: <Shield className="w-6 h-6 text-blue-600" />,
    features: [
      "Hasta 10 productos en catálogo",
      "Recibir hasta 5 cotizaciones por mes",
      "1 especialidad",
      "Soporte por email",
      "Verificación de identidad"
    ],
    color: "bg-blue-50 border-blue-200"
  },
  {
    id: "professional",
    name: "Plan Profesional",
    price: 2500,
    icon: <Zap className="w-6 h-6 text-emerald-600" />,
    popular: true,
    features: [
      "Productos ilimitados en catálogo",
      "Cotizaciones ilimitadas",
      "Hasta 5 especialidades",
      "Perfil destacado en búsquedas",
      "Analytics básicos de perfil",
      "Galería de proyectos (hasta 20 fotos)",
      "Badge de 'Proveedor Verificado'",
      "Soporte prioritario"
    ],
    color: "bg-emerald-50 border-emerald-200"
  },
  {
    id: "enterprise",
    name: "Plan Empresarial",
    price: 5000,
    icon: <Crown className="w-6 h-6 text-purple-600" />,
    features: [
      "Todo ilimitado",
      "Especialidades ilimitadas",
      "Galería ilimitada de proyectos",
      "Analytics avanzados y reportes",
      "API personalizada",
      "Gerente de cuenta dedicado",
      "Soporte 24/7",
      "Badge de 'Proveedor Premium'",
      "Integración con CRM"
    ],
    color: "bg-purple-50 border-purple-200"
  }
];

export default function PlanUpgradeDialog({
  open,
  onOpenChange,
  currentPlan,
  limitType,
  limitMessage
}: PlanUpgradeDialogProps) {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (planId: string) => {
    setLoading(true);
    try {
      // Navigate to subscription selection with the recommended plan
      navigate(`/subscription-selection?recommended=${planId}`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error upgrading plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendedPlans = () => {
    const currentIndex = plans.findIndex(p => p.id === currentPlan);
    return plans.filter((_, index) => index > currentIndex);
  };

  const recommendedPlans = getRecommendedPlans();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
            Actualiza tu Plan de Suscripción
          </DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-lg">
            {limitMessage}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <p className="text-yellow-800 font-medium">
                Tu plan actual ({currentPlan}) tiene limitaciones para {limitType}
              </p>
            </div>
            <p className="text-yellow-700 mt-1 text-sm">
              Actualiza a un plan superior para desbloquear más funcionalidades y hacer crecer tu negocio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${plan.color} ${plan.popular ? 'ring-2 ring-emerald-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white px-3 py-1">
                      <Zap className="w-3 h-3 mr-1" />
                      Recomendado
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">
                    {plan.icon}
                  </div>
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-3">
                    <span className="text-3xl font-bold">
                      RD${plan.price.toLocaleString()}
                    </span>
                    <span className="text-gray-600">/mes</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <ul className="space-y-2">
                      {plan.features.slice(0, 5).map((feature, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 5 && (
                        <li className="text-sm text-gray-500 italic">
                          + {plan.features.length - 5} funcionalidades más
                        </li>
                      )}
                    </ul>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {loading ? "Procesando..." : "Actualizar Plan"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Continuar con Plan Actual
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}