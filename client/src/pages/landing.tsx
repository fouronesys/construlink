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
import placeholderBanner from "@assets/generated_images/ConstruLink_supplier_advertising_banner_1a673ba0.png";
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
  MessageSquare,
  Home,
  TreePine,
  Waves,
  Paintbrush,
  Package,
  Grid3x3,
  Gem,
  Cog,
  Sun,
  Camera,
  DoorClosed,
  Lock
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
  bannerImageUrlTablet?: string | null;
  bannerImageUrlMobile?: string | null;
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


const categories = [
  { name: "Construcción General", icon: Building2, color: "bg-blue-100 text-blue-800" },
  { name: "Materiales", icon: Truck, color: "bg-green-100 text-green-800" },
  { name: "Herramientas", icon: Wrench, color: "bg-orange-100 text-orange-800" },
  { name: "Eléctricos", icon: Zap, color: "bg-yellow-100 text-yellow-800" },
  { name: "Plomería", icon: Hammer, color: "bg-purple-100 text-purple-800" },
  { name: "Pinturas", icon: PaintBucket, color: "bg-pink-100 text-pink-800" },
  { name: "Ferretería", icon: ShoppingCart, color: "bg-rose-100 text-rose-800" },
  { name: "Seguridad", icon: Lock, color: "bg-gray-100 text-gray-800" },
  { name: "Ebanistería", icon: Layers, color: "bg-amber-100 text-amber-800" },
  { name: "Pisos", icon: Grid3x3, color: "bg-slate-100 text-slate-800" },
  { name: "Aluminio y PVC", icon: Layers, color: "bg-cyan-100 text-cyan-800" },
  { name: "Vidriería", icon: Eye, color: "bg-indigo-100 text-indigo-800" },
  { name: "Cerrajería", icon: Shield, color: "bg-red-100 text-red-800" },
  { name: "Aire Acondicionado", icon: Filter, color: "bg-sky-100 text-sky-800" },
  { name: "Techado", icon: Home, color: "bg-teal-100 text-teal-800" },
  { name: "Jardinería", icon: TreePine, color: "bg-lime-100 text-lime-800" },
  { name: "Piscinas", icon: Waves, color: "bg-blue-100 text-blue-800" },
  { name: "Acabados", icon: Paintbrush, color: "bg-fuchsia-100 text-fuchsia-800" },
  { name: "Cemento", icon: Package, color: "bg-stone-100 text-stone-800" },
  { name: "Estructuras Metálicas", icon: Grid3x3, color: "bg-zinc-100 text-zinc-800" },
  { name: "Mármol y Granito", icon: Gem, color: "bg-violet-100 text-violet-800" },
  { name: "Maquinaria", icon: Cog, color: "bg-orange-100 text-orange-800" },
  { name: "Instalaciones Solares", icon: Sun, color: "bg-yellow-100 text-yellow-800" },
  { name: "Sistemas de Seguridad", icon: Camera, color: "bg-red-100 text-red-800" },
  { name: "Puertas y Ventanas", icon: DoorClosed, color: "bg-emerald-100 text-emerald-800" },
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
    color: "border-primary ring-2 ring-primary/20"
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

  const { data: exchangeRates } = useQuery<{
    date: string;
    rates: {
      usd_to_dop: number;
      eur_to_dop: number;
    };
  }>({
    queryKey: ['/api/exchange-rates'],
    refetchInterval: 3600000, // Refetch every hour
  });

  const { data: fuelPrices } = useQuery<{
    fecha_vigencia: string;
    precios: {
      gasolina_premium: number;
      gasolina_regular: number;
      gasoil_optimo: number;
      gasoil_regular: number;
      glp: number;
      gas_natural: number;
    };
    moneda: string;
    unidad: string;
  }>({
    queryKey: ['/api/fuel-prices'],
    refetchInterval: 3600000, // Refetch every hour
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

  const BannerImage = ({ supplier }: { supplier: FeaturedSupplier }) => {
    const [imageError, setImageError] = useState(false);
    const hasCustomBanner = supplier.bannerImageUrl || supplier.bannerImageUrlTablet || supplier.bannerImageUrlMobile;

    if (!hasCustomBanner || imageError) {
      return (
        <img
          src={placeholderBanner}
          alt="Anuncia tu empresa aquí - ConstruLink"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          data-testid={`img-banner-placeholder-${supplier.id}`}
        />
      );
    }

    return (
      <picture>
        {/* Mobile: 640x200px */}
        {supplier.bannerImageUrlMobile && (
          <source 
            media="(max-width: 639px)" 
            srcSet={supplier.bannerImageUrlMobile}
          />
        )}
        {/* Tablet: 1024x300px */}
        {supplier.bannerImageUrlTablet && (
          <source 
            media="(min-width: 640px) and (max-width: 1023px)" 
            srcSet={supplier.bannerImageUrlTablet}
          />
        )}
        {/* Desktop: 1920x400px */}
        <img
          src={supplier.bannerImageUrl || supplier.bannerImageUrlTablet || supplier.bannerImageUrlMobile || ''}
          alt={supplier.legalName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
          data-testid={`img-banner-${supplier.id}`}
        />
      </picture>
    );
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
      
      {/* Info Bar - Exchange Rates & Fuel Prices */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-1.5 sm:py-2 sticky top-0 z-40 shadow-md" data-testid="info-bar">
        <div className="container mx-auto px-3 sm:px-4">
          {/* Mobile Layout - Two Rows */}
          <div className="sm:hidden space-y-1">
            {/* Exchange Rates */}
            <div className="flex items-center gap-2 text-xs" data-testid="exchange-rates-section">
              <span className="text-blue-300">💱</span>
              {exchangeRates ? (
                <>
                  <div data-testid="usd-rate">
                    <span className="text-blue-200">USD </span>
                    <span className="text-yellow-300 font-bold">${exchangeRates.rates.usd_to_dop}</span>
                  </div>
                  <span className="text-blue-400">|</span>
                  <div data-testid="eur-rate">
                    <span className="text-blue-200">EUR </span>
                    <span className="text-yellow-300 font-bold">${exchangeRates.rates.eur_to_dop}</span>
                  </div>
                </>
              ) : (
                <span className="text-blue-300">...</span>
              )}
            </div>
            
            {/* Fuel Prices */}
            <div className="flex items-center gap-2 text-xs" data-testid="fuel-prices-section">
              <span className="text-blue-300">⛽</span>
              {fuelPrices ? (
                <>
                  <div data-testid="gasolina-premium">
                    <span className="text-blue-200">Premium </span>
                    <span className="text-green-300 font-bold">{fuelPrices.precios.gasolina_premium}</span>
                  </div>
                  <span className="text-blue-400">|</span>
                  <div data-testid="gasolina-regular">
                    <span className="text-blue-200">Regular </span>
                    <span className="text-green-300 font-bold">{fuelPrices.precios.gasolina_regular}</span>
                  </div>
                  <span className="text-blue-400">|</span>
                  <div data-testid="gasoil-regular">
                    <span className="text-blue-200">Gasoil </span>
                    <span className="text-green-300 font-bold">{fuelPrices.precios.gasoil_regular}</span>
                  </div>
                </>
              ) : (
                <span className="text-blue-300">...</span>
              )}
            </div>
          </div>

          {/* Desktop/Tablet Layout - Single Row */}
          <div className="hidden sm:flex items-center justify-center gap-4 md:gap-6 text-sm">
            {/* Exchange Rates */}
            <div className="flex items-center gap-3" data-testid="exchange-rates-section">
              <span className="font-semibold text-blue-200">Tasas:</span>
              {exchangeRates ? (
                <>
                  <div className="flex items-center gap-1.5" data-testid="usd-rate">
                    <span className="font-medium">USD:</span>
                    <span className="text-yellow-300 font-bold">${exchangeRates.rates.usd_to_dop}</span>
                    <span className="text-blue-200 text-xs">DOP</span>
                  </div>
                  <div className="flex items-center gap-1.5" data-testid="eur-rate">
                    <span className="font-medium">EUR:</span>
                    <span className="text-yellow-300 font-bold">${exchangeRates.rates.eur_to_dop}</span>
                    <span className="text-blue-200 text-xs">DOP</span>
                  </div>
                </>
              ) : (
                <span className="text-blue-300 text-xs">Cargando...</span>
              )}
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-orange"></div>

            {/* Fuel Prices */}
            <div className="flex items-center gap-3" data-testid="fuel-prices-section">
              <span className="font-semibold text-blue-200">Combustibles:</span>
              {fuelPrices ? (
                <>
                  <div className="flex items-center gap-1.5" data-testid="gasolina-premium">
                    <span className="font-medium">Premium:</span>
                    <span className="text-green-300 font-bold">RD${fuelPrices.precios.gasolina_premium}</span>
                  </div>
                  <div className="flex items-center gap-1.5" data-testid="gasolina-regular">
                    <span className="font-medium">Regular:</span>
                    <span className="text-green-300 font-bold">RD${fuelPrices.precios.gasolina_regular}</span>
                  </div>
                  <div className="flex items-center gap-1.5" data-testid="gasoil-regular">
                    <span className="font-medium">Gasoil:</span>
                    <span className="text-green-300 font-bold">RD${fuelPrices.precios.gasoil_regular}</span>
                  </div>
                </>
              ) : (
                <span className="text-blue-300 text-xs">Cargando...</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
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
                    <BannerImage supplier={supplier} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      ) : null}
      
      {/* Search Hero Section */}
      <section className="relative bg-gradient-to-br from-primary to-blue-800 text-white py-16">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Encuentra los Mejores 
              <span className="block text-orange">Productos y Servicios</span>
              de Construcción
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Tu directorio de proveedores de construcción en República Dominicana
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
                    className="bg-orange hover:bg-orange/90 text-white px-8 py-4 rounded-xl font-semibold"
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
                    className="bg-orange/20 text-white px-4 py-2 rounded-full text-sm hover:bg-orange/30 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
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
                  className="group bg-gray-50 hover:bg-blue-50 rounded-2xl p-6 text-center transition-all duration-200 hover:shadow-lg border-2 border-transparent hover:border-primary/20"
                >
                  <div className="w-12 h-12 mx-auto mb-3 bg-white rounded-xl flex items-center justify-center group-hover:bg-orange group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{category.name}</h3>
                </button>
              );
            })}
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              onClick={() => setLocation('/directory')}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3"
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-orange-50 animate-on-scroll">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir ConstruLink?
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




      {/* Quote Modal */}
      <QuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        providerId={selectedProviderId}
        providerName="Proveedor"
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
