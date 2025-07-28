import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { QuoteModal } from "@/components/quote-modal";
import { ProviderProfileModal } from "@/components/provider-profile-modal";
import { 
  Shield, 
  Star, 
  Handshake, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle,
  Search,
  ArrowRight,
  Building2,
  Truck,
  Wrench,
  Zap,
  Hammer,
  PaintBucket,
  Users,
  Calendar,
  Award,
  TrendingUp,
  Filter,
  Play,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  Target,
  Clock,
  ShoppingCart,
  Layers
} from "lucide-react";

interface Provider {
  id: string;
  legalName: string;
  rnc: string;
  specialties: string[];
  location: string;
  description: string;
  averageRating: number;
  totalReviews: number;
}

const sampleProviders: Provider[] = [
  {
    id: "1",
    legalName: "Constructora Dominicana S.R.L.",
    rnc: "1-31-85420-1",
    specialties: ["Concreto", "Estructura", "Techado"],
    location: "Santo Domingo, Distrito Nacional",
    description: "Empresa líder en construcción de edificios residenciales y comerciales con más de 15 años de experiencia en el mercado dominicano.",
    averageRating: 4.9,
    totalReviews: 127,
  },
  {
    id: "2",
    legalName: "Instalaciones Eléctricas Pro",
    rnc: "1-01-50123-8",
    specialties: ["Eléctricos", "Iluminación"],
    location: "Santiago, Santiago",
    description: "Especialistas en instalaciones eléctricas residenciales e industriales. Certificados por la Comisión Nacional de Energía.",
    averageRating: 4.7,
    totalReviews: 89,
  },
  {
    id: "3",
    legalName: "PlomRD Expertos",
    rnc: "1-25-67890-3",
    specialties: ["Plomería", "Sanitarios"],
    location: "La Vega, La Vega",
    description: "Especialistas en sistemas de plomería residencial y comercial. Servicio 24/7 con garantía extendida.",
    averageRating: 4.8,
    totalReviews: 156,
  },
];

const categories = [
  { name: "Construcción General", icon: Building2, count: 245, color: "bg-blue-100 text-blue-800" },
  { name: "Materiales", icon: Truck, count: 189, color: "bg-green-100 text-green-800" },
  { name: "Herramientas", icon: Wrench, count: 134, color: "bg-orange-100 text-orange-800" },
  { name: "Eléctricos", icon: Zap, count: 98, color: "bg-yellow-100 text-yellow-800" },
  { name: "Plomería", icon: Hammer, count: 76, color: "bg-purple-100 text-purple-800" },
  { name: "Pinturas", icon: PaintBucket, count: 63, color: "bg-pink-100 text-pink-800" },
];

const subscriptionPlans = [
  {
    name: "Básico",
    price: "1,000",
    currency: "DOP",
    period: "mensual",
    features: [
      "Perfil en directorio público",
      "Recepción de cotizaciones",
      "Soporte básico por email",
      "Validación RNC automática",
      "Hasta 10 productos/servicios"
    ],
    popular: false,
    color: "border-gray-200"
  },
  {
    name: "Premium",
    price: "2,500",
    currency: "DOP", 
    period: "mensual",
    features: [
      "Todo lo del plan Básico",
      "Perfil destacado en búsquedas",
      "Galería de proyectos ilimitada",
      "Estadísticas detalladas",
      "Soporte prioritario",
      "Badge de proveedor verificado"
    ],
    popular: true,
    color: "border-blue-500 ring-2 ring-blue-200"
  },
  {
    name: "Empresarial",
    price: "5,000",
    currency: "DOP",
    period: "mensual", 
    features: [
      "Todo lo del plan Premium",
      "Múltiples ubicaciones",
      "API para integración",
      "Gestor de cuenta dedicado",
      "Reportes personalizados",
      "Promociones destacadas"
    ],
    popular: false,
    color: "border-gray-200"
  }
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const handleViewProfile = (provider: Provider) => {
    setSelectedProvider(provider);
  };

  const handleRequestQuote = (providerId: string) => {
    setSelectedProviderId(providerId);
    setShowQuoteModal(true);
  };

  const handleSupplierRegister = () => {
    setLocation('/register-supplier');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Navigation />
      
      {/* Modern Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-blue-400/5"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-on-scroll fade-in-left">
              <div className="mb-6">
                <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-sm font-medium">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Plataforma #1 en República Dominicana
                </Badge>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent leading-tight">
                Conectamos
                <span className="block text-blue-600">Constructores</span>
                con Proveedores
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                La plataforma B2B más confiable de República Dominicana para encontrar 
                proveedores verificados de materiales y servicios de construcción.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 group"
                  onClick={handleSupplierRegister}
                >
                  Registrarse como Proveedor
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-gray-300 hover:border-gray-400 px-8 py-4 text-lg font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                  onClick={() => setLocation('/directory')}
                >
                  Explorar Directorio
                  <Search className="ml-2 w-5 h-5" />
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">500+</div>
                  <div className="text-sm text-gray-600">Proveedores Verificados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">1,200+</div>
                  <div className="text-sm text-gray-600">Proyectos Completados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">98%</div>
                  <div className="text-sm text-gray-600">Satisfacción</div>
                </div>
              </div>
            </div>

            <div className="animate-on-scroll fade-in-right">
              <div className="relative">
                <div className="bg-white rounded-3xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Constructora Elite</h3>
                          <p className="text-sm text-gray-600">Santo Domingo</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Verificado</Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      {renderStars(4.9)}
                      <span className="text-sm text-gray-600">(4.9) 127 reseñas</span>
                    </div>
                    
                    <p className="text-gray-700 mb-4">
                      Especialistas en construcción residencial y comercial con materiales de primera calidad.
                    </p>
                    
                    <div className="flex gap-2 mb-4">
                      <Badge variant="secondary">Concreto</Badge>
                      <Badge variant="secondary">Estructura</Badge>
                    </div>
                    
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Solicitar Cotización
                    </Button>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <Award className="w-8 h-8 text-yellow-800" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle className="w-6 h-6 text-green-800" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white animate-on-scroll">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Explora por Categorías
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Encuentra exactamente lo que necesitas para tu proyecto de construcción
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-2">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${category.color} group-hover:scale-110 transition-transform duration-300`}>
                    <category.icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.count} proveedores</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100 animate-on-scroll">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir Proveedores RD?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              La plataforma más confiable para conectar con los mejores proveedores
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">Verificación RNC</h3>
                <p className="text-gray-600 leading-relaxed">
                  Validación automática con DGII para garantizar que todos los proveedores 
                  sean empresas legalmente constituidas y activas.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Handshake className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">Conexiones Directas</h3>
                <p className="text-gray-600 leading-relaxed">
                  Plataforma que facilita el contacto directo entre clientes y proveedores 
                  para negociaciones transparentes y eficientes.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Star className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">Sistema de Reseñas</h3>
                <p className="text-gray-600 leading-relaxed">
                  Calificaciones y comentarios reales de clientes para ayudarte a 
                  tomar decisiones informadas sobre tus proveedores.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Subscription Plans Section */}
      <section className="py-20 bg-white animate-on-scroll">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Planes de Suscripción para Proveedores
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Elige el plan que mejor se adapte a tu negocio y comienza a recibir más clientes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {subscriptionPlans.map((plan, index) => (
              <Card key={index} className={`relative overflow-hidden ${plan.color} hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}>
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm font-semibold">
                    🔥 Más Popular
                  </div>
                )}
                
                <CardHeader className={`text-center ${plan.popular ? 'pt-12' : 'pt-8'}`}>
                  <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.currency}</span>
                    <span className="text-5xl font-bold text-blue-600">{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="px-8 pb-8">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full py-3 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} font-semibold rounded-xl transition-all duration-200`}
                    onClick={handleSupplierRegister}
                  >
                    Comenzar con {plan.name}
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

      {/* Featured Providers Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 animate-on-scroll">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Proveedores Destacados
            </h2>
            <p className="text-xl text-gray-600">
              Conoce algunos de nuestros proveedores verificados más confiables
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {sampleProviders.map((provider, index) => (
              <Card key={provider.id} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 group-hover:from-blue-100 group-hover:to-indigo-200 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{provider.legalName}</h3>
                          <p className="text-sm text-gray-600 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {provider.location}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 shadow-sm">
                        <Shield className="w-3 h-3 mr-1" />
                        Verificado
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center">
                        {renderStars(provider.averageRating)}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        ({provider.averageRating}) {provider.totalReviews} reseñas
                      </span>
                    </div>

                    <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                      {provider.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {provider.specialties.slice(0, 2).map((specialty, i) => (
                        <Badge key={i} className="bg-white/80 text-gray-700 hover:bg-white text-xs px-3 py-1">
                          {specialty}
                        </Badge>
                      ))}
                      {provider.specialties.length > 2 && (
                        <Badge className="bg-white/80 text-gray-700 text-xs px-3 py-1">
                          +{provider.specialties.length - 2} más
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 font-medium"
                        onClick={() => handleViewProfile(provider)}
                      >
                        Ver Perfil
                      </Button>
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg"
                        onClick={() => handleRequestQuote(provider.id)}
                      >
                        Cotizar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-16">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-gray-300 hover:border-gray-400 px-8 py-4 text-lg font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
              onClick={() => setLocation("/directory")}
            >
              Ver Todos los Proveedores
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Quote Modal */}
      <QuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        providerId={selectedProviderId}
        providerName={sampleProviders.find(p => p.id === selectedProviderId)?.legalName || "Proveedor"}
      />

      {/* Provider Profile Modal */}
      <ProviderProfileModal
        provider={selectedProvider}
        isOpen={!!selectedProvider}
        onClose={() => setSelectedProvider(null)}
        onRequestQuote={(providerId) => {
          setSelectedProvider(null);
          handleRequestQuote(providerId);
        }}
      />

      <Footer />
    </div>
  );
}
