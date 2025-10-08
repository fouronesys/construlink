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

interface SupplierPublication {
  id: string;
  supplierId: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  category?: string | null;
  isActive: boolean;
  viewCount: string;
  createdAt: string;
}

interface PaidAdvertisement {
  id: string;
  supplierId: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string | null;
  displayLocation: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  clickCount: string;
  impressionCount: string;
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
  { name: "Energía renovable", icon: Sun, color: "bg-yellow-100 text-yellow-800" },
  { name: "Sistemas de Seguridad", icon: Camera, color: "bg-red-100 text-red-800" },
  { name: "Puertas y Ventanas", icon: DoorClosed, color: "bg-emerald-100 text-emerald-800" },
  { name: "Servicio de mudanzas", icon: Truck, color: "bg-blue-100 text-blue-800" },
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
  const [viewedAdvertisements, setViewedAdvertisements] = useState<Set<string>>(new Set());
  const [viewedPublications, setViewedPublications] = useState<Set<string>>(new Set());

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

  const { data: publications } = useQuery<SupplierPublication[]>({
    queryKey: ['/api/publications'],
  });

  const { data: advertisements } = useQuery<PaidAdvertisement[]>({
    queryKey: ['/api/advertisements'],
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

  // Track advertisement impression
  const trackAdvertisementImpression = async (adId: string) => {
    if (!adId || viewedAdvertisements.has(adId)) return;
    
    try {
      await fetch(`/api/advertisements/${adId}/impression`, {
        method: 'POST',
      });
      setViewedAdvertisements(prev => new Set(prev).add(adId));
    } catch (error) {
      console.error('Failed to track advertisement impression:', error);
    }
  };

  // Track publication view (optimized to prevent duplicates)
  const trackPublicationView = async (publicationId: string) => {
    if (!publicationId || viewedPublications.has(publicationId)) return;
    
    try {
      await fetch(`/api/publications/${publicationId}/view`, {
        method: 'POST',
      });
      setViewedPublications(prev => new Set(prev).add(publicationId));
    } catch (error) {
      console.error('Failed to track publication view:', error);
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

  // Track advertisement impressions when they come into view
  useEffect(() => {
    if (!advertisements?.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const adId = entry.target.getAttribute('data-ad-id');
            if (adId) {
              trackAdvertisementImpression(adId);
            }
          }
        });
      },
      { threshold: 0.5 } // Track when 50% of the ad is visible
    );

    // Observe all advertisement elements
    const adElements = document.querySelectorAll('[data-ad-id]');
    adElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [advertisements, viewedAdvertisements]);

  const handleBannerClick = async (supplier: FeaturedSupplier) => {
    // Check if this is a valid custom banner or placeholder
    const isValidBannerUrl = (url: string | null | undefined) => {
      if (!url) return false;
      if (url.startsWith('/uploads/')) return false;
      return true;
    };
    
    const hasValidCustomBanner = 
      isValidBannerUrl(supplier.bannerImageUrl) || 
      isValidBannerUrl(supplier.bannerImageUrlTablet) || 
      isValidBannerUrl(supplier.bannerImageUrlMobile);
    
    // If it's a placeholder banner, redirect to registration
    if (!hasValidCustomBanner) {
      setLocation('/register');
      return;
    }
    
    // Otherwise, track click and go to directory
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
    
    // Check if supplier has valid custom banners (not /uploads paths which don't exist)
    const isValidBannerUrl = (url: string | null | undefined) => {
      if (!url) return false;
      // If it's an /uploads path, consider it invalid since uploads folder doesn't exist
      if (url.startsWith('/uploads/')) return false;
      return true;
    };
    
    const hasValidCustomBanner = 
      isValidBannerUrl(supplier.bannerImageUrl) || 
      isValidBannerUrl(supplier.bannerImageUrlTablet) || 
      isValidBannerUrl(supplier.bannerImageUrlMobile);

    if (!hasValidCustomBanner || imageError) {
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
        {isValidBannerUrl(supplier.bannerImageUrlMobile) && (
          <source 
            media="(max-width: 639px)" 
            srcSet={supplier.bannerImageUrlMobile!}
          />
        )}
        {/* Tablet: 1024x300px */}
        {isValidBannerUrl(supplier.bannerImageUrlTablet) && (
          <source 
            media="(min-width: 640px) and (max-width: 1023px)" 
            srcSet={supplier.bannerImageUrlTablet!}
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

      {/* Publicidad Pagada */}
      {advertisements && advertisements.length > 0 && (
        <section className="relative py-20 overflow-hidden">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange via-orange-600 to-red-600 opacity-95">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoNnYtNmgtNnYtNmgtNnY2aC02djZoNnY2aDZ2LTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
          </div>
          
          <div className="container mx-auto px-6 relative z-10">
            {/* Premium Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full mb-6">
                <Sparkles className="w-5 h-5 text-yellow-300 motion-reduce:animate-none animate-pulse" />
                <span className="text-white font-semibold tracking-wider uppercase text-sm">Promociones Exclusivas</span>
                <Sparkles className="w-5 h-5 text-yellow-300 motion-reduce:animate-none animate-pulse" />
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                Ofertas Premium
              </h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                Descubre oportunidades únicas de nuestros proveedores verificados y certificados
              </p>
            </div>

            {/* Premium Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {advertisements.slice(0, 3).map((ad) => (
                <button
                  key={ad.id}
                  className="group relative cursor-pointer text-left w-full focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 focus-visible:ring-offset-4 rounded-2xl transition-all"
                  onClick={async () => {
                    await fetch(`/api/advertisements/${ad.id}/click`, { method: 'POST' });
                    if (ad.linkUrl) {
                      window.open(ad.linkUrl, '_blank');
                    } else {
                      setLocation(`/directory?id=${ad.supplierId}`);
                    }
                  }}
                  data-ad-id={ad.id}
                  data-testid={`advertisement-${ad.id}`}
                  aria-label={`Ver oferta: ${ad.title}`}
                >
                  {/* Glow effect on hover - respects prefers-reduced-motion */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-75 transition-opacity duration-500 motion-reduce:transition-none"></div>
                  
                  <Card className="relative bg-white overflow-hidden rounded-2xl shadow-2xl transition-all duration-500 group-hover:shadow-3xl group-hover:-translate-y-2 motion-reduce:transition-none motion-reduce:group-hover:transform-none border-0">
                    {/* Premium badge ribbon */}
                    <div className="absolute top-4 right-4 z-20">
                      <div className="relative">
                        <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 font-bold px-4 py-1.5 shadow-lg border-2 border-white/50" data-testid={`badge-sponsored-${ad.id}`}>
                          <Star className="w-3 h-3 mr-1 inline fill-current" />
                          PREMIUM
                        </Badge>
                      </div>
                    </div>

                    {/* Image container with overlay effect */}
                    <div className="relative h-64 overflow-hidden bg-gradient-to-br from-orange-50 to-red-50">
                      <img 
                        src={ad.imageUrl} 
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700 ease-out motion-reduce:transition-none motion-reduce:group-hover:transform-none"
                        data-testid={`img-advertisement-${ad.id}`}
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 motion-reduce:transition-none"></div>
                      
                      {/* Animated corner accent */}
                      <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-br from-orange-500 to-transparent opacity-60"></div>
                    </div>

                    <CardContent className="p-8">
                      {/* Title with gradient on hover */}
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-red-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 motion-reduce:transition-none" data-testid={`title-advertisement-${ad.id}`}>
                        {ad.title}
                      </h3>
                      
                      <p className="text-gray-700 mb-6 leading-relaxed line-clamp-3" data-testid={`description-advertisement-${ad.id}`}>
                        {ad.description}
                      </p>

                      {/* Premium CTA styled div */}
                      <div 
                        className="w-full bg-gradient-to-r from-orange to-red-600 group-hover:from-orange-600 group-hover:to-red-700 text-white font-semibold shadow-lg group-hover:shadow-xl transition-all duration-300 motion-reduce:transition-none rounded-md h-10 px-4 py-2" 
                        data-testid={`button-learn-more-${ad.id}`}
                      >
                        <span className="flex items-center justify-center gap-2 h-full">
                          Ver Oferta Exclusiva
                          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300 motion-reduce:transition-none" />
                        </span>
                      </div>
                    </CardContent>

                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange via-orange-500 to-red-600"></div>
                  </Card>
                </button>
              ))}
            </div>

            {/* Premium features badges */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-white">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Shield className="w-5 h-5 text-yellow-300" />
                <span className="text-sm font-medium">Proveedores Verificados</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Award className="w-5 h-5 text-yellow-300" />
                <span className="text-sm font-medium">Ofertas Exclusivas</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Zap className="w-5 h-5 text-yellow-300" />
                <span className="text-sm font-medium">Promociones Limitadas</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Publicaciones de Proveedores */}
      {publications && publications.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Publicaciones de Proveedores
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Mantente al día con las últimas novedades, productos y servicios de nuestros proveedores
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publications.slice(0, 6).map((publication) => (
                <Card 
                  key={publication.id} 
                  className="hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={async () => {
                    await trackPublicationView(publication.id);
                    setLocation(`/directory?id=${publication.supplierId}`);
                  }}
                  data-testid={`publication-${publication.id}`}
                >
                  {publication.imageUrl && (
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img 
                        src={publication.imageUrl} 
                        alt={publication.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        data-testid={`img-publication-${publication.id}`}
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    {publication.category && (
                      <Badge className="mb-3" data-testid={`badge-category-${publication.id}`}>
                        {publication.category}
                      </Badge>
                    )}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors" data-testid={`title-publication-${publication.id}`}>
                      {publication.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3" data-testid={`content-publication-${publication.id}`}>
                      {publication.content}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{new Date(publication.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {publication.viewCount} vistas
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categorías de Productos y Servicios */}
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
            {categories.map((category, index) => (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-2"
                onClick={() => handleQuickSearch(category.name)}
                data-testid={`category-${category.name.toLowerCase().replace(/ /g, '-')}`}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${category.color} group-hover:scale-110 transition-transform duration-300`}>
                    <category.icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-900">{category.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              onClick={() => setLocation('/directory')}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3"
              data-testid="button-view-all-providers"
            >
              Ver Todos los Proveedores
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
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
