import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { ProviderCard } from "@/components/provider-card";
import { QuoteModal } from "@/components/quote-modal";
import { ProviderProfileModal } from "@/components/provider-profile-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  Globe, 
  Building, 
  Users,
  Package,
  CheckCircle,
  Award,
  TrendingUp,
} from "lucide-react";

interface Supplier {
  id: string;
  legalName: string;
  rnc: string;
  location: string;
  description: string;
  specialties: string[];
  averageRating: number;
  totalReviews: number;
  phone: string;
  email: string;
  website?: string;
  profileImageUrl?: string;
  subscription?: {
    plan: string;
    status: string;
  };
  productCount?: number;
  createdAt: string;
}

const specialties = [
  "Construcción General",
  "Materiales de Construcción",
  "Herramientas y Equipos", 
  "Eléctricos y Iluminación",
  "Plomería y Sanitarios",
  "Pinturas y Acabados",
  "Ferretería",
  "Seguridad y Protección",
];

const locations = [
  "Santo Domingo",
  "Santiago", 
  "La Vega",
  "San Pedro de Macorís",
  "La Romana",
  "Puerto Plata",
  "San Francisco de Macorís",
  "Moca",
  "Higüey",
  "Baní",
];

export default function Directory() {
  const [filters, setFilters] = useState({
    specialty: "all",
    location: "all",
    search: "",
    rating: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<Supplier | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [selectedProviderName, setSelectedProviderName] = useState<string>("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: suppliersData, isLoading, error } = useQuery({
    queryKey: ["/api/suppliers", filters, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== "" && value !== "all")
        ),
      });
      
      const response = await fetch(`/api/suppliers?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch suppliers");
      }
      return response.json();
    },
  });

  const suppliers = suppliersData?.suppliers || [];
  const totalPages = suppliersData?.totalPages || 1;
  const totalResults = suppliersData?.total || 0;

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleViewProfile = async (supplierId: string) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}`);
      if (!response.ok) throw new Error("Failed to fetch supplier details");
      const supplier = await response.json();
      setSelectedProvider(supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
    }
  };

  const handleRequestQuote = (supplierId: string, supplierName?: string) => {
    setSelectedProviderId(supplierId);
    setSelectedProviderName(supplierName || "");
    setShowQuoteModal(true);
  };

  const specialties = [
    "Fontanería",
    "Eléctricos", 
    "Concreto",
    "Estructura de Acero",
    "Techado",
    "Pintura",
    "Iluminación",
  ];

  const locations = [
    "Santo Domingo",
    "Santiago", 
    "Puerto Plata",
    "La Romana",
    "San Pedro de Macorís",
    "La Vega",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-1/4 order-2 lg:order-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filtrar Proveedores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Nombre de empresa..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Specialty Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidad
                  </label>
                  <Select
                    value={filters.specialty}
                    onValueChange={(value) => handleFilterChange("specialty", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las especialidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las especialidades</SelectItem>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación
                  </label>
                  <Select
                    value={filters.location}
                    onValueChange={(value) => handleFilterChange("location", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Toda RD" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toda RD</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full"
                  onClick={() => {
                    setFilters({ specialty: "all", location: "all", search: "" });
                    setCurrentPage(1);
                  }}
                  variant="outline"
                >
                  Limpiar Filtros
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Provider Results */}
          <div className="w-full lg:w-3/4 order-1 lg:order-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Proveedores Verificados</h2>
              <span className="text-sm sm:text-base text-gray-600">
                {suppliers?.length || 0} resultados encontrados
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 sm:p-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-red-600">Error al cargar los proveedores</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {suppliers?.map((supplier: Supplier) => (
                    <ProviderCard
                      key={supplier.id}
                      provider={supplier}
                      onViewProfile={() => handleViewProfile(supplier.id)}
                      onRequestQuote={() => handleRequestQuote(supplier.id, supplier.legalName)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center mt-6 sm:mt-8">
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-primary text-primary-foreground text-xs sm:text-sm min-w-[40px]"
                    >
                      {currentPage}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!suppliers || suppliers.length < 12}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quote Modal */}
      <QuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        providerId={selectedProviderId}
        providerName={selectedProviderName}
      />

      {/* Provider Profile Modal */}
      <ProviderProfileModal
        provider={selectedProvider}
        isOpen={!!selectedProvider}
        onClose={() => setSelectedProvider(null)}
        onRequestQuote={(providerId) => {
          const providerName = selectedProvider?.legalName || "";
          setSelectedProvider(null);
          handleRequestQuote(providerId, providerName);
        }}
      />
    </div>
  );
}
