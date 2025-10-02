import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Autoplay from "embla-carousel-autoplay";
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
  Layers,
  Eye,
  MessageSquare
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

interface FeaturedSupplier {
  id: string;
  legalName: string;
  location: string;
  description: string;
  bannerImageUrl: string | null;
  specialties: string[];
  bannerId?: string;
}

interface SupplierBanner {
  id: string;
  supplierId: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  imageUrl: string;
  title?: string;
  description?: string;
  linkUrl?: string;
  displayOrder: number;
  isActive: boolean;
  clickCount: number;
  impressionCount: number;
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
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const [viewedBanners, setViewedBanners] = useState<Set<string>>(new Set());

  const { data: featuredSuppliers, isLoading: isFeaturedLoading } = useQuery<FeaturedSupplier[]>({
    queryKey: ['/api/suppliers/featured'],
  });

  // Track banner impression
  const trackImpression = async (bannerId: string) => {
    if (!bannerId || viewedBanners.has(bannerId)) return;
    
    try {
      await fetch(`/api/banners/${bannerId}/impression`, {
        method: 'POST',
      });
      setViewedBanners(prev => new Set(prev).add(bannerId));
    } catch (error) {
      console.error('Failed to track impression:', error);
    }
  };

  // Track banner click
  const trackClick = async (bannerId: string) => {
    if (!bannerId) return;
    
    try {
      await fetch(`/api/banners/${bannerId}/click`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  };

  // Track impressions when carousel slides change
  useEffect(() => {
    if (!carouselApi || !featuredSuppliers?.length) return;

    const onSelect = () => {
      const currentIndex = carouselApi.selectedScrollSnap();
      const supplier = featuredSuppliers[currentIndex];
      if (supplier?.bannerId) {
        trackImpression(supplier.bannerId);
      }
    };

    // Track first banner on mount
    if (featuredSuppliers[0]?.bannerId) {
      trackImpression(featuredSuppliers[0].bannerId);
    }

    carouselApi.on('select', onSelect);
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi, featuredSuppliers]);

  const handleBannerClick = async (supplier: FeaturedSupplier) => {
    if (supplier.bannerId) {
      await trackClick(supplier.bannerId);
    }
    setLocation(`/directory?id=${supplier.id}`);
  };

  const handleViewProfile = (provider: Provider) => {
    setSelectedProvider(provider);
  };

  const handleRequestQuote = (providerId: string) => {
    setSelectedProviderId(providerId);
    setShowQuoteModal(true);
  };

  const handleSupplierRegister = () => {
    setLocation('/register');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/directory?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      setLocation('/directory');
    }
  };

  const handleQuickSearch = (category: string) => {
    setLocation(`/directory?category=${encodeURIComponent(category)}`);
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
      
      {/* Horizontal Banner Carousel */}
      {isFeaturedLoading ? (
        <div className="w-full bg-gray-100">
          <Skeleton className="w-full h-24 sm:h-32 md:h-40" data-testid="skeleton-featured-carousel" />
        </div>
      ) : featuredSuppliers && featuredSuppliers.length > 0 ? (
        <div className="w-full bg-white border-b border-gray-200">
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 4000,
              }),
            ]}
            setApi={setCarouselApi}
            className="w-full"
            data-testid="carousel-featured-suppliers"
          >
            <CarouselContent>
              {featuredSuppliers.map((supplier) => (
                <CarouselItem key={supplier.id} data-testid={`carousel-item-${supplier.id}`}>
                  <div 
                    className="relative w-full h-24 sm:h-32 md:h-40 cursor-pointer overflow-hidden group"
                    onClick={() => handleBannerClick(supplier)}
                    data-testid={`banner-click-${supplier.id}`}
                  >
                    {supplier.bannerImageUrl ? (
                      <img
                        src={supplier.bannerImageUrl}
                        alt={supplier.legalName}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        data-testid={`img-banner-${supplier.id}`}
                      />
                    ) : (
                      <div 
                        className="w-full h-full bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700"
                        data-testid={`bg-gradient-${supplier.id}`}
                      />
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      ) : null}
      
      {/* Search Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Encuentra los Mejores 
              <span className="block text-blue-200">Productos y Servicios</span>
              de Construcción
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Conecta con más de 500 proveedores verificados en República Dominicana
            </p>

            {/* Prominent Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="bg-white rounded-2xl p-2 shadow-2xl">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Input 
                      placeholder="¿Qué necesitas? (ej: cemento, hierro, plomería...)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 text-lg py-4 px-6 text-gray-900 placeholder-gray-500 focus:ring-0"
                    />
                  </div>
                  <Button 
                    size="lg" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold"
                    onClick={handleSearch}
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Buscar
                  </Button>
                </div>
              </div>
              
              {/* Quick search tags */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {['Cemento', 'Hierro', 'Plomería', 'Eléctricos', 'Pinturas', 'Herramientas'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleQuickSearch(tag)}
                    className="bg-blue-500/20 text-blue-100 px-4 py-2 rounded-full text-sm hover:bg-blue-500/30 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-sm text-blue-200">Proveedores Verificados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">2,500+</div>
                <div className="text-sm text-blue-200">Productos Disponibles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">1,200+</div>
                <div className="text-sm text-blue-200">Proyectos Completados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">98%</div>
                <div className="text-sm text-blue-200">Satisfacción</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Productos y Servicios Destacados
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Descubre los productos más solicitados y servicios de mayor calidad de nuestros proveedores verificados
            </p>
          </div>

          {/* Product categories grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleQuickSearch(category.name)}
                  className="group bg-gray-50 hover:bg-blue-50 rounded-2xl p-6 text-center transition-all duration-200 hover:shadow-lg border-2 border-transparent hover:border-blue-100"
                >
                  <div className="w-12 h-12 mx-auto mb-3 bg-white rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{category.name}</h3>
                  <p className="text-xs text-gray-500">{category.count} productos</p>
                </button>
              );
            })}
          </div>

          {/* Featured Providers */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Proveedores Verificados Destacados
            </h3>
            <p className="text-gray-600">
              Conecta directamente con los mejores proveedores de República Dominicana
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {sampleProviders.map((provider) => (
              <div key={provider.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-gray-900 mb-1">
                      {provider.legalName}
                    </h4>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                      RNC: {provider.rnc}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      {provider.location}
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Verificado</Badge>
                </div>

                <div className="flex items-center mb-3">
                  {renderStars(Math.floor(provider.averageRating))}
                  <span className="text-sm text-gray-600 ml-2">
                    {provider.averageRating} ({provider.totalReviews} reseñas)
                  </span>
                </div>

                <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                  {provider.description}
                </p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {provider.specialties.slice(0, 3).map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {provider.specialties.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{provider.specialties.length - 3} más
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewProfile(provider)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Perfil
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleRequestQuote(provider.id)}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Cotizar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              onClick={() => setLocation('/directory')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              Ver Todos los Proveedores
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Busca por Categoría
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
