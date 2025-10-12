import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { ProviderCard } from "@/components/provider-card";
import { QuoteModal } from "@/components/quote-modal";
import { ProviderProfileModal } from "@/components/provider-profile-modal";
import { ClaimBusinessModal } from "@/components/claim-business-modal";
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
  "Ebanistería y Carpintería",
  "Pisos y Revestimientos",
  "Aluminio y PVC",
  "Vidriería y Cristalería",
  "Cerrajería y Herrería",
  "Aire Acondicionado y Ventilación",
  "Techado e Impermeabilización",
  "Jardinería y Paisajismo",
  "Piscinas y Spas",
  "Acabados y Decoración",
  "Cemento y Concreto",
  "Estructuras Metálicas",
  "Mármol y Granito",
  "Equipos Pesados y Maquinaria",
  "Energía renovable",
  "Sistemas de Seguridad",
  "Puertas y Ventanas",
  "Servicio de mudanzas",
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
  const [sortBy, setSortBy] = useState<string>("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<Supplier | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [selectedProviderName, setSelectedProviderName] = useState<string>("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedClaimSupplier, setSelectedClaimSupplier] = useState<{
    id: string;
    legalName: string;
    rnc: string;
    location?: string;
  } | null>(null);

  // Parse URL parameters for search, category, and supplier id
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const categoryParam = urlParams.get('category');
    const idParam = urlParams.get('id');
    
    if (searchParam) {
      setFilters(prev => ({ ...prev, search: searchParam }));
    }
    if (categoryParam) {
      setFilters(prev => ({ ...prev, specialty: categoryParam }));
    }
    if (idParam) {
      handleViewProfile(idParam);
    }
  }, []);

  const { data: suppliersData, isLoading, error } = useQuery({
    queryKey: ["/api/suppliers", filters, currentPage, sortBy],
    queryFn: async () => {
      // Si hay un término de búsqueda, usar búsqueda semántica con embeddings
      if (filters.search && filters.search.trim().length >= 2) {
        const response = await fetch("/api/search/semantic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: filters.search }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to perform semantic search");
        }
        
        const data = await response.json();
        let results = data.results || [];
        
        // Aplicar filtros adicionales a los resultados semánticos
        if (filters.specialty !== "all") {
          results = results.filter((supplier: Supplier) => 
            supplier.specialties?.some(s => s === filters.specialty)
          );
        }
        
        if (filters.location !== "all") {
          results = results.filter((supplier: Supplier) => 
            supplier.location?.toLowerCase().includes(filters.location.toLowerCase())
          );
        }
        
        // Aplicar ordenamiento
        switch (sortBy) {
          case "rating":
            results.sort((a: Supplier, b: Supplier) => (b.averageRating || 0) - (a.averageRating || 0));
            break;
          case "reviews":
            results.sort((a: Supplier, b: Supplier) => (b.totalReviews || 0) - (a.totalReviews || 0));
            break;
          case "name":
            results.sort((a: Supplier, b: Supplier) => a.legalName.localeCompare(b.legalName));
            break;
          case "newest":
            results.sort((a: Supplier, b: Supplier) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            break;
          // 'featured' ya viene ordenado por similarity del embedding
        }
        
        // Paginación manual para resultados semánticos
        const pageSize = 50;
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedResults = results.slice(startIndex, endIndex);
        
        return {
          suppliers: paginatedResults,
          total: results.length,
          totalPages: Math.ceil(results.length / pageSize),
        };
      } else {
        // Sin búsqueda semántica, usar endpoint tradicional
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: "50",
          sortBy: sortBy,
          ...Object.fromEntries(
            Object.entries(filters).filter(([key, value]) => 
              key !== 'search' && value !== "" && value !== "all"
            )
          ),
        });
        
        const response = await fetch(`/api/suppliers?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch suppliers");
        }
        return response.json();
      }
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

  const handleClaimBusiness = async (supplierId: string) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}`);
      if (!response.ok) throw new Error("Failed to fetch supplier details");
      const supplier = await response.json();
      setSelectedClaimSupplier({
        id: supplier.id,
        legalName: supplier.legalName,
        rnc: supplier.rnc,
        location: supplier.location,
      });
      setShowClaimModal(true);
    } catch (error) {
      console.error("Error fetching supplier for claim:", error);
    }
  };

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
                      placeholder="Ej: 'electricista certificado', 'materiales de construcción'..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
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
                    setFilters({ specialty: "all", location: "all", search: "", rating: "all" });
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
            {/* Header con información y ordenamiento */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Proveedores Verificados</h2>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-primary">{totalResults}</span> proveedores disponibles
                    {currentPage > 1 && <span> - Página {currentPage}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Ordenar por:</label>
                  <Select value={sortBy} onValueChange={(value) => {
                    setSortBy(value);
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Destacados</SelectItem>
                      <SelectItem value="rating">Mejor calificados</SelectItem>
                      <SelectItem value="reviews">Más reseñas</SelectItem>
                      <SelectItem value="newest">Más recientes</SelectItem>
                      <SelectItem value="name">Nombre A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
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
            ) : suppliers.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron proveedores</h3>
                  <p className="text-gray-600 mb-4">Intenta ajustar tus filtros de búsqueda</p>
                  <Button 
                    onClick={() => {
                      setFilters({ specialty: "all", location: "all", search: "", rating: "all" });
                      setCurrentPage(1);
                    }}
                    variant="outline"
                  >
                    Limpiar filtros
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                  {suppliers?.map((supplier: Supplier) => (
                    <ProviderCard
                      key={supplier.id}
                      provider={supplier}
                      onViewProfile={() => handleViewProfile(supplier.id)}
                      onRequestQuote={() => handleRequestQuote(supplier.id, supplier.legalName)}
                      onClaimBusiness={handleClaimBusiness}
                    />
                  ))}
                </div>

                {/* Paginación mejorada */}
                {totalPages > 1 && (
                  <div className="bg-white rounded-lg shadow-sm p-4 mt-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-600">
                        Mostrando <span className="font-semibold">{((currentPage - 1) * 50) + 1}</span> - <span className="font-semibold">{Math.min(currentPage * 50, totalResults)}</span> de <span className="font-semibold">{totalResults}</span> proveedores
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="font-medium"
                        >
                          ← Anterior
                        </Button>
                        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-md">
                          <span className="text-sm font-semibold text-primary">Página {currentPage} de {totalPages}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          disabled={currentPage >= totalPages}
                          className="font-medium"
                        >
                          Siguiente →
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
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
        onClaimBusiness={handleClaimBusiness}
      />

      {/* Claim Business Modal */}
      <ClaimBusinessModal
        isOpen={showClaimModal}
        onClose={() => {
          setShowClaimModal(false);
          setSelectedClaimSupplier(null);
        }}
        supplier={selectedClaimSupplier}
      />
    </div>
  );
}
