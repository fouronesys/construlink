import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Shield, Users, Zap, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const subscriptionPlans = [
  {
    id: "basic",
    name: "Plan Básico",
    monthlyPrice: 1000,
    annualPrice: 9600, // 20% descuento (12000 - 20%)
    currency: "DOP",
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
    color: "bg-blue-50 border-blue-200",
    trialDays: 7
  },
  {
    id: "professional",
    name: "Plan Profesional",
    monthlyPrice: 2500,
    annualPrice: 24000, // 20% descuento (30000 - 20%)
    currency: "DOP",
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
    color: "bg-emerald-50 border-emerald-200",
    trialDays: 14
  },
  {
    id: "enterprise",
    name: "Plan Empresarial",
    monthlyPrice: 5000,
    annualPrice: 48000, // 20% descuento (60000 - 20%)
    currency: "DOP",
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
    color: "bg-purple-50 border-purple-200",
    trialDays: 30
  }
];

const faqs = [
  {
    question: "¿Qué incluye el período de prueba gratuito?",
    answer: "Todos los planes incluyen un período de prueba gratuito (7-30 días según el plan). Durante este tiempo, tendrás acceso completo a todas las funcionalidades de tu plan seleccionado sin costo alguno. No se requiere tarjeta de crédito para comenzar."
  },
  {
    question: "¿Puedo cambiar de plan después de suscribirme?",
    answer: "Sí, puedes actualizar o cambiar tu plan en cualquier momento desde tu panel de control. Si actualizas a un plan superior, el cambio es inmediato. Los cambios se calculan de forma prorrateada según el tiempo restante de tu período actual."
  },
  {
    question: "¿Cuál es la diferencia entre pago mensual y anual?",
    answer: "El pago anual te ofrece un 20% de descuento sobre el precio mensual. Pagas por adelantado los 12 meses y ahorras significativamente. El plan mensual se renueva automáticamente cada mes."
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer: "Aceptamos pagos a través de Azul Payment Gateway (Banco Popular), que soporta todas las tarjetas de crédito y débito principales. También procesamos transferencias bancarias para pagos anuales empresariales."
  },
  {
    question: "¿Puedo cancelar mi suscripción en cualquier momento?",
    answer: "Sí, puedes cancelar tu suscripción cuando lo desees desde tu panel de control. No hay penalidades por cancelación. Si cancelas un plan anual, se aplicará un reembolso prorrateado por el tiempo no utilizado."
  },
  {
    question: "¿Qué sucede al finalizar el período de prueba?",
    answer: "Al finalizar tu período de prueba, se procesará automáticamente el primer pago según el plan y frecuencia seleccionados. Te enviaremos recordatorios por email 3 días antes de que finalice tu prueba gratuita."
  }
];

export default function SubscriptionSelection() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [isAnnual, setIsAnnual] = useState(false);
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

      const amount = isAnnual ? plan.annualPrice : plan.monthlyPrice;

      // Create subscription with selected plan
      const response = await apiRequest("POST", "/api/create-subscription", {
        planId: plan.id,
        planName: plan.name,
        monthlyAmount: plan.monthlyPrice,
        billingCycle: isAnnual ? "annual" : "monthly"
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to payment with Azul
        window.location.href = `/payment?subscriptionId=${data.subscriptionId}&planId=${planId}&amount=${amount}&billingCycle=${isAnnual ? 'annual' : 'monthly'}`;
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

  const calculateAnnualSavings = (monthlyPrice: number, annualPrice: number) => {
    const annualCostMonthly = monthlyPrice * 12;
    return annualCostMonthly - annualPrice;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12" data-testid="subscription-selection-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Selecciona tu Plan de Suscripción
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-2">
            Elige el plan que mejor se adapte a tu negocio. Todos los planes incluyen acceso completo 
            al directorio de proveedores verificados.
          </p>

          {/* Billing Toggle */}
          <div className="mt-6 sm:mt-8 flex justify-center items-center gap-4">
            <span className={`text-sm sm:text-base font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Mensual
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                isAnnual ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
              data-testid="toggle-billing-cycle"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm sm:text-base font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Anual
            </span>
            {isAnnual && (
              <Badge className="bg-emerald-500 text-white" data-testid="badge-annual-savings">
                Ahorra 20%
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {subscriptionPlans.map((plan) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const savings = calculateAnnualSavings(plan.monthlyPrice, plan.annualPrice);
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.color} ${plan.popular ? 'ring-2 ring-emerald-500' : ''}`}
                data-testid={`card-plan-${plan.id}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white px-4 py-1" data-testid="badge-popular">
                      <Star className="w-3 h-3 mr-1" />
                      Más Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6">
                  <div className="flex justify-center mb-3 sm:mb-4">
                    {plan.id === 'basic' && <Users className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-600" />}
                    {plan.id === 'professional' && <Shield className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-emerald-600" />}
                    {plan.id === 'enterprise' && <Zap className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-purple-600" />}
                  </div>
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold">{plan.name}</CardTitle>
                  <p className="text-gray-600 mt-2 text-sm sm:text-base">{plan.description}</p>
                  
                  <div className="mt-3 sm:mt-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-bold" data-testid={`text-price-${plan.id}`}>
                        RD${price.toLocaleString()}
                      </span>
                      <span className="text-gray-600 text-sm sm:text-base">
                        /{isAnnual ? 'año' : 'mes'}
                      </span>
                    </div>
                    
                    {isAnnual && (
                      <div className="mt-2">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Ahorras RD${savings.toLocaleString()} al año
                        </Badge>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">
                      Prueba gratis por {plan.trialDays} días
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Incluye:</h4>
                    <ul className="space-y-1.5 sm:space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.limitations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Limitaciones:</h4>
                      <ul className="space-y-1.5 sm:space-y-2">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0">×</span>
                            <span className="text-xs sm:text-sm text-gray-600">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    className="w-full text-sm sm:text-base"
                    size="lg"
                    onClick={() => handlePlanSelection(plan.id)}
                    disabled={loading}
                    variant={plan.popular ? "default" : "outline"}
                    data-testid={`button-select-${plan.id}`}
                  >
                    {loading ? "Procesando..." : "Comenzar Prueba Gratis"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQs Section */}
        <div className="mt-12 sm:mt-16 bg-white rounded-lg p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3">
              <HelpCircle className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Preguntas Frecuentes
            </h2>
            <p className="text-gray-600">
              Encuentra respuestas a las dudas más comunes sobre nuestros planes
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto" data-testid="accordion-faqs">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-sm sm:text-base font-medium" data-testid={`accordion-trigger-${index}`}>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-gray-600" data-testid={`accordion-content-${index}`}>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Help Section */}
        <div className="mt-8 sm:mt-12 text-center">
          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-sm">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              ¿Necesitas ayuda para elegir?
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              Nuestro equipo puede ayudarte a seleccionar el plan perfecto para tu negocio.
            </p>
            <Button variant="outline" className="text-sm sm:text-base" data-testid="button-contact-support">
              Contactar Soporte
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
