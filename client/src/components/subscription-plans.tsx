import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, Shield } from "lucide-react";

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
  trialDays?: number;
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
    trialDays: 7,
    features: [
      { name: "Perfil de empresa verificado", included: true },
      { name: "Listado en directorio público", included: true },
      { name: "Recibir hasta 10 cotizaciones/mes", included: true },
      { name: "Chat directo with clientes", included: true },
      { name: "Verificación RNC incluida", included: true },
      { name: "Soporte por email", included: true },
      { name: "Estadísticas básicas", included: true },
      { name: "Múltiples especialidades", included: false },
      { name: "Prioridad en búsquedas", included: false },
      { name: "Soporte telefónico", included: false },
    ],
  },
  {
    id: "premium",
    name: "Plan Premium",
    price: 2500,
    originalPrice: 3000,
    period: "mes",
    description: "Para proveedores establecidos que buscan más visibilidad",
    popular: true,
    icon: <Star className="w-6 h-6" />,
    color: "emerald",
    trialDays: 14,
    features: [
      { name: "Todo del Plan Básico", included: true },
      { name: "Cotizaciones ilimitadas", included: true },
      { name: "Prioridad en búsquedas", included: true },
      { name: "Badge de 'Proveedor Premium'", included: true },
      { name: "Hasta 5 especialidades", included: true },
      { name: "Galería de fotos expandida", included: true },
      { name: "Estadísticas detalladas", included: true },
      { name: "Soporte telefónico", included: true },
      { name: "API access para integración", included: false },
      { name: "Manager de cuenta dedicado", included: false },
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
    trialDays: 30,
    features: [
      { name: "Todo del Plan Premium", included: true },
      { name: "Múltiples ubicaciones", included: true },
      { name: "API access completo", included: true },
      { name: "Manager de cuenta dedicado", included: true },
      { name: "Integración con CRM", included: true },
      { name: "Reportes personalizados", included: true },
      { name: "Soporte 24/7", included: true },
      { name: "Capacitación personalizada", included: true },
      { name: "SLA garantizado", included: true },
      { name: "Branding personalizado", included: true },
    ],
  },
];

export default function SubscriptionPlans({ selectedPlan, onPlanSelect, onContinue }: SubscriptionPlansProps) {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

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

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Elige tu Plan de Suscripción</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Selecciona el plan que mejor se adapte a las necesidades de tu empresa. 
          Todos los planes incluyen período de prueba gratuito.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const isHovered = hoveredPlan === plan.id;
          
          return (
            <Card
              key={plan.id}
              className={`relative cursor-pointer ${getPlanColorClasses(plan, isSelected, isHovered)}`}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              onClick={() => onPlanSelect(plan.id)}
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
                  
                  {plan.trialDays && (
                    <Badge variant="outline" className="mt-2">
                      {plan.trialDays} días gratis
                    </Badge>
                  )}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlanSelect(plan.id);
                  }}
                >
                  {isSelected ? "Seleccionado" : "Seleccionar Plan"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedPlan && (
        <div className="text-center pt-6 border-t">
          <Button
            size="lg"
            onClick={onContinue}
            className="px-8 py-3"
          >
            Continuar con {plans.find(p => p.id === selectedPlan)?.name}
          </Button>
        </div>
      )}
    </div>
  );
}

export { plans };