import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { CheckCircle, ArrowRight, Crown, Shield, Star } from "lucide-react";

const subscriptionPlans = [
  {
    id: "basic",
    name: "Plan Básico",
    price: "1,000",
    currency: "DOP",
    period: "mensual",
    description: "Perfecto para proveedores que están comenzando",
    icon: <Shield className="w-8 h-8" />,
    features: [
      "Perfil de empresa verificado",
      "Listado en directorio público",
      "Hasta 10 productos en catálogo",
      "Recibir hasta 5 cotizaciones/mes",
      "1 especialidad",
      "Verificación RNC incluida",
      "Soporte por email",
      "Estadísticas básicas"
    ],
    popular: false,
    color: "border-gray-200"
  },
  {
    id: "professional",
    name: "Plan Profesional",
    price: "2,500",
    originalPrice: "3,000",
    currency: "DOP", 
    period: "mensual",
    description: "Para proveedores establecidos que buscan más visibilidad",
    icon: <Star className="w-8 h-8" />,
    popular: true,
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
    color: "border-blue-500 ring-2 ring-blue-200"
  },
  {
    id: "enterprise",
    name: "Plan Empresarial",
    price: "5,000",
    currency: "DOP",
    period: "mensual", 
    description: "Para grandes empresas con necesidades avanzadas",
    icon: <Crown className="w-8 h-8" />,
    features: [
      "Todo lo del Plan Profesional",
      "Especialidades ilimitadas",
      "Galería ilimitada de proyectos",
      "Analytics avanzados y reportes",
      "API personalizada",
      "Gerente de cuenta dedicado",
      "Soporte 24/7",
      "Badge de 'Proveedor Premium'",
      "Integración con CRM",
      "Promociones destacadas"
    ],
    popular: false,
    color: "border-gray-200"
  }
];

export default function Pricing() {
  const [, setLocation] = useLocation();

  const handleSelectPlan = (planId: string) => {
    setLocation(`/register?plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Planes de Suscripción
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tu negocio y comienza a recibir más clientes
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {subscriptionPlans.map((plan, index) => (
              <Card key={index} className={`relative overflow-hidden ${plan.color} hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}>
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm font-semibold">
                    🔥 Más Popular
                  </div>
                )}
                
                <CardHeader className={`text-center ${plan.popular ? 'pt-12' : 'pt-8'}`}>
                  <div className="flex justify-center mb-4 text-blue-600">
                    {plan.icon}
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-6">
                    <span className="text-2xl font-bold text-gray-900">{plan.currency} </span>
                    <span className="text-4xl font-bold text-blue-600">{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                    {plan.originalPrice && (
                      <div className="text-sm text-gray-500">
                        <span className="line-through">{plan.currency} {plan.originalPrice}</span>
                        <Badge className="ml-2 bg-green-100 text-green-800">Ahorra 17%</Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="px-8 pb-8">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full py-3 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} font-semibold rounded-xl transition-all duration-200`}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    Comenzar con {plan.name}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              ¿Necesitas un plan personalizado para tu empresa?
            </p>
            <Button variant="outline" className="font-semibold">
              Contactar Ventas
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Respuestas a las preguntas más comunes sobre nuestros planes
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  ¿Puedo cambiar de plan en cualquier momento?
                </h3>
                <p className="text-gray-600">
                  Sí, puedes cambiar tu plan en cualquier momento desde tu panel de control. Los cambios se reflejan inmediatamente.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  ¿Hay período de prueba gratuito?
                </h3>
                <p className="text-gray-600">
                  Ofrecemos 7 días de prueba gratuita para todos los planes. No se requiere tarjeta de crédito para comenzar.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  ¿Qué métodos de pago aceptan?
                </h3>
                <p className="text-gray-600">
                  Aceptamos todas las tarjetas de crédito principales y transferencias bancarias locales a través de Verifone.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}