import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Star, Zap, Crown, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import VerifonePayment from "./verifone-payment";

export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  description: string;
  popular?: boolean;
  premium?: boolean;
  features: PlanFeature[];
  icon: React.ReactNode;
  color: string;

}

interface SubscriptionPlansProps {
  selectedPlan?: string;
  onPlanSelect: (planId: string) => void;
  onContinue: () => void;
}

const plans: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Plan Básico",
    price: 1000,
    period: "mes",
    description: "Perfecto para proveedores que están comenzando",
    icon: <Shield className="w-6 h-6" />,
    color: "blue",
    features: [
      { name: "Perfil de empresa verificado", included: true },
      { name: "Listado en directorio público", included: true },
      { name: "Hasta 10 productos en catálogo", included: true },
      { name: "Recibir hasta 5 cotizaciones/mes", included: true },
      { name: "1 especialidad", included: true },
      { name: "Verificación RNC incluida", included: true },
      { name: "Soporte por email", included: true },
      { name: "Estadísticas básicas", included: true },
      { name: "Productos ilimitados", included: false },
      { name: "Cotizaciones ilimitadas", included: false },
      { name: "Múltiples especialidades", included: false },
      { name: "Galería de proyectos", included: false },
      { name: "Prioridad en búsquedas", included: false },
      { name: "Analytics avanzados", included: false },
      { name: "Soporte prioritario", included: false },
      { name: "API access", included: false },
    ],
  },
  {
    id: "professional",
    name: "Plan Profesional",
    price: 2500,
    originalPrice: 3000,
    period: "mes",
    description: "Para proveedores establecidos que buscan más visibilidad",
    popular: true,
    icon: <Star className="w-6 h-6" />,
    color: "emerald",
    features: [
      { name: "Todo del Plan Básico", included: true },
      { name: "Productos ilimitados en catálogo", included: true },
      { name: "Cotizaciones ilimitadas", included: true },
      { name: "Hasta 5 especialidades", included: true },
      { name: "Galería de proyectos (hasta 20 fotos)", included: true },
      { name: "Prioridad en búsquedas", included: true },
      { name: "Badge de 'Proveedor Verificado'", included: true },
      { name: "Analytics básicos de perfil", included: true },
      { name: "Soporte prioritario", included: true },
      { name: "Estadísticas detalladas", included: true },
      { name: "Especialidades ilimitadas", included: false },
      { name: "Galería ilimitada", included: false },
      { name: "API access completo", included: false },
      { name: "Manager de cuenta dedicado", included: false },
      { name: "Analytics avanzados", included: false },
      { name: "Soporte 24/7", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Plan Empresarial",
    price: 5000,
    period: "mes",
    description: "Para grandes empresas con necesidades especializadas",
    premium: true,
    icon: <Crown className="w-6 h-6" />,
    color: "purple",
    features: [
      { name: "Todo del Plan Profesional", included: true },
      { name: "Productos ilimitados", included: true },
      { name: "Cotizaciones ilimitadas", included: true },
      { name: "Especialidades ilimitadas", included: true },
      { name: "Galería ilimitada de proyectos", included: true },
      { name: "Analytics avanzados y reportes", included: true },
      { name: "API access completo", included: true },
      { name: "Manager de cuenta dedicado", included: true },
      { name: "Integración con CRM", included: true },
      { name: "Reportes personalizados", included: true },
      { name: "Soporte 24/7", included: true },
      { name: "Capacitación personalizada", included: true },
      { name: "SLA garantizado", included: true },
      { name: "Branding personalizado", included: true },
      { name: "Múltiples ubicaciones", included: true },
      { name: "Leads exclusivos prioritarios", included: true },
    ],
  },
];

export default function SubscriptionPlans({ selectedPlan, onPlanSelect, onContinue }: SubscriptionPlansProps) {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [selected, setSelected] = useState(selectedPlan);
  const [showPayment, setShowPayment] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const createSubscriptionMutation = useMutation({
    mutationFn: async (plan: string) => {
      const response = await apiRequest("POST", "/api/create-subscription", { plan });
      return await response.json();
    },
    onSuccess: (data) => {
      setSubscriptionData(data);
      setShowPayment(true);
    },
    onError: (error: any) => {
      console.error("Error creating subscription:", error);
      
      // If it's an authentication error, redirect to login
      if (error.status === 401 || (error.message && error.message.includes("Unauthorized"))) {
        toast({
          title: "Sesión requerida",
          description: "Debes iniciar sesión para seleccionar un plan.",
          variant: "destructive",
        });
        setLocation("/login?redirect=subscription-selection");
        return;
      }
      
      toast({
        title: "Error",
        description: "No se pudo crear la suscripción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handlePlanSelect = (planId: string) => {
    setSelected(planId);
    onPlanSelect(planId);
  };

  const handleContinue = async () => {
    if (!selected) return;
    
    // Check authentication before proceeding
    if (!user) {
      toast({
        title: "Sesión requerida",
        description: "Debes iniciar sesión para continuar con la suscripción.",
        variant: "destructive",
      });
      setLocation("/login?redirect=subscription-selection");
      return;
    }
    
    createSubscriptionMutation.mutate(selected);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    toast({
      title: "¡Suscripción Activada!",
      description: "Tu plan ha sido activado exitosamente.",
    });
    onContinue();
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  const getPlanColorClasses = (plan: SubscriptionPlan, isSelected: boolean, isHovered: boolean) => {
    const baseClasses = "transition-all duration-200";
    
    if (plan.popular) {
      return `${baseClasses} ${isSelected || isHovered ? 'border-emerald-500 shadow-lg scale-105' : 'border-emerald-200 shadow-md'}`;
    }
    
    if (plan.premium) {
      return `${baseClasses} ${isSelected || isHovered ? 'border-purple-500 shadow-lg scale-105' : 'border-purple-200 shadow-md'}`;
    }
    
    return `${baseClasses} ${isSelected || isHovered ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-200'}`;
  };

  const getPlanButtonClasses = (plan: SubscriptionPlan, isSelected: boolean) => {
    if (isSelected) {
      if (plan.popular) return "bg-emerald-600 hover:bg-emerald-700 text-white";
      if (plan.premium) return "bg-purple-600 hover:bg-purple-700 text-white";
      return "bg-blue-600 hover:bg-blue-700 text-white";
    }
    
    if (plan.popular) return "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200";
    if (plan.premium) return "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200";
    return "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200";
  };

  // Show authentication required message if user is not logged in
  if (!isLoading && !user) {
    return (
      <div className="space-y-8">
        <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Sesión requerida
          </h3>
          <p className="text-yellow-700 mb-4">
            Debes iniciar sesión para seleccionar un plan de suscripción.
          </p>
          <Button 
            onClick={() => setLocation("/login?redirect=subscription-selection")}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Elige tu Plan de Suscripción</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Selecciona el plan que mejor se adapte a las necesidades de tu empresa. 
          Todos los planes incluyen período de prueba gratuito.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {plans.map((plan) => {
          const isSelected = selected === plan.id;
          const isHovered = hoveredPlan === plan.id;
          
          return (
            <Card
              key={plan.id}
              className={`relative cursor-pointer ${getPlanColorClasses(plan, isSelected, isHovered)}`}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              onClick={() => {
                console.log("Plan selected:", plan.id);
                setSelected(plan.id);
                onPlanSelect(plan.id);
                
                // Proceed directly to payment
                if (!user) {
                  toast({
                    title: "Sesión requerida",
                    description: "Debes iniciar sesión para continuar con la suscripción.",
                    variant: "destructive",
                  });
                  setLocation("/login?redirect=subscription-selection");
                  return;
                }
                
                createSubscriptionMutation.mutate(plan.id);
              }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-emerald-500 text-white px-3 py-1">
                    <Zap className="w-3 h-3 mr-1" />
                    Más Popular
                  </Badge>
                </div>
              )}
              
              {plan.premium && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white px-3 py-1">
                    <Crown className="w-3 h-3 mr-1" />
                    Empresarial
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  plan.popular ? 'bg-emerald-100 text-emerald-600' : 
                  plan.premium ? 'bg-purple-100 text-purple-600' : 
                  'bg-blue-100 text-blue-600'
                }`}>
                  {plan.icon}
                </div>
                
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-sm px-2">{plan.description}</CardDescription>
                
                <div className="pt-4">
                  <div className="flex items-center justify-center">
                    {plan.originalPrice && (
                      <span className="text-lg text-gray-400 line-through mr-2">
                        RD${plan.originalPrice.toLocaleString()}
                      </span>
                    )}
                    <span className="text-3xl font-bold text-gray-900">
                      RD${plan.price.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">por {plan.period}</p>
                  

                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check 
                        className={`w-4 h-4 mr-3 mt-0.5 flex-shrink-0 ${
                          feature.included ? 'text-green-600' : 'text-gray-300'
                        }`} 
                      />
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${getPlanButtonClasses(plan, isSelected)}`}
                  variant={isSelected ? "default" : "outline"}
                  disabled={createSubscriptionMutation.isPending && selected === plan.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlanSelect(plan.id);
                  }}
                >
                  {createSubscriptionMutation.isPending && selected === plan.id 
                    ? "Procesando..." 
                    : isSelected 
                      ? "Procesando Pago..." 
                      : "Seleccionar Plan"
                  }
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>



      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="dialog-mobile sm:max-w-2xl w-full max-h-[95vh] overflow-y-auto p-3 sm:p-4 lg:p-6">
          <DialogHeader className="space-y-2 pb-2 sm:pb-4">
            <DialogTitle className="text-sm sm:text-base lg:text-lg font-semibold">
              Procesar Pago - {subscriptionData?.plan}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-600">
              Completa tu pago para activar tu suscripción.
              <br />
              <span className="font-medium text-gray-900">Monto: RD${subscriptionData?.amount?.toLocaleString()}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-2 sm:mt-4">
            {subscriptionData && (
              <VerifonePayment
                subscriptionId={subscriptionData.subscriptionId}
                amount={subscriptionData.amount}
                trialEndDate={subscriptionData.trialEndDate}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { plans };