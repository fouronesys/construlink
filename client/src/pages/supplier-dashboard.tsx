import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import PlanUsageWidget from "@/components/plan-usage-widget";
import SubscriptionPlans from "@/components/subscription-plans";
import { PREDEFINED_PRODUCTS, PRODUCTS_BY_CATEGORY } from "@shared/predefined-products";
import { 
  insertSupplierPublicationSchema, 
  type SupplierPublication 
} from "@shared/schema";
import {
  BarChart3,
  Eye,
  Star,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Globe,
  Settings,
  Package,
  MessageSquare,
  TrendingUp,
  Users,
  Megaphone,
} from "lucide-react";

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  needsSetup?: boolean;
  subscription?: any;
  supplier?: any;
  message?: string;
}

interface DashboardData {
  supplier: any;
  stats: {
    totalQuotes: number;
    totalViews: number;
    averageRating: number;
    totalProducts?: number;
    totalServices?: number;
    totalSpecialties?: number;
  };
  recentQuotes: any[];
  subscription: any;
}

const productSchema = z.object({
  name: z.string().min(1, "Nombre es requerido"),
  description: z.string().optional(),
  category: z.string().min(1, "Categoría es requerida"),
});

const profileSchema = z.object({
  legalName: z.string().min(1, "Nombre legal es requerido"),
  phone: z.string().min(1, "Teléfono es requerido"),
  location: z.string().min(1, "Ubicación es requerida"),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
});

const publicationSchema = insertSupplierPublicationSchema.omit({
  supplierId: true,
  viewCount: true,
}).extend({
  title: z.string().min(1, "Título es requerido").max(255, "Título muy largo"),
  content: z.string().min(1, "Contenido es requerido"),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;
type ProfileFormData = z.infer<typeof profileSchema>;
type PublicationFormData = z.infer<typeof publicationSchema>;

const categories = [
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

export default function SupplierDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [productModalTab, setProductModalTab] = useState("catalog");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Publication states
  const [showCreatePublicationModal, setShowCreatePublicationModal] = useState(false);
  const [showEditPublicationModal, setShowEditPublicationModal] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState<SupplierPublication | null>(null);
  const [publicationPage, setPublicationPage] = useState(1);
  const publicationsPerPage = 10;

  if (!authLoading && user && user.role !== 'supplier') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
            <p className="text-gray-600">
              Debes ser un proveedor para acceder a esta página.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/supplier/dashboard"],
    enabled: !!user && user.role === 'supplier',
    retry: false,
  });

  // Check if supplier has active subscription
  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/supplier/subscription-status"],
    enabled: !!user && user.role === 'supplier',
    retry: false,
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/supplier/products"],
    enabled: !!user && user.role === 'supplier',
    retry: false,
  });

  const { data: quotes = [] } = useQuery<any[]>({
    queryKey: ["/api/supplier/quotes"],
    enabled: !!user && user.role === 'supplier',
    retry: false,
  });

  // Plan limits and usage data
  const { data: planLimits } = useQuery({
    queryKey: ["/api/supplier/plan-limits"],
    enabled: !!user && user.role === 'supplier',
    retry: false,
  });

  const { data: planUsage } = useQuery({
    queryKey: ["/api/supplier/plan-usage"],
    enabled: !!user && user.role === 'supplier',
    retry: false,
  });

  // Publications data
  const { data: publications = [], isLoading: publicationsLoading } = useQuery<SupplierPublication[]>({
    queryKey: ["/api/supplier/publications"],
    enabled: !!user && user.role === 'supplier',
    retry: false,
  });

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
    },
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      legalName: "",
      phone: "",
      location: "",
      description: "",
      website: "",
    },
  });

  const publicationForm = useForm<PublicationFormData>({
    resolver: zodResolver(publicationSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
      imageUrl: "",
      isActive: true,
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await apiRequest("POST", "/api/supplier/products", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create product");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Producto creado",
        description: "El producto ha sido agregado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/dashboard"] });
      setShowAddProductModal(false);
      productForm.reset();
      setProductModalTab("catalog");
      setSelectedCategory("all");
      setSearchTerm("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message.includes("límite") ? error.message : "Error al crear producto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handlePredefinedProductSelect = (product: typeof PREDEFINED_PRODUCTS[0]) => {
    createProductMutation.mutate({
      name: product.name,
      description: product.description,
      category: product.category,
    });
  };

  const filteredPredefinedProducts = PREDEFINED_PRODUCTS.filter(product => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PATCH", "/api/supplier/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil actualizado",
        description: "Tu perfil ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/dashboard"] });
      setShowProfileModal(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al actualizar perfil.",
        variant: "destructive",
      });
    },
  });

  // Publication mutations
  const createPublicationMutation = useMutation({
    mutationFn: async (data: PublicationFormData) => {
      const response = await apiRequest("POST", "/api/supplier/publications", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create publication");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Publicación creada",
        description: "La publicación ha sido creada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/publications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/plan-usage"] });
      setShowCreatePublicationModal(false);
      publicationForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePublicationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PublicationFormData }) => {
      const response = await apiRequest("PATCH", `/api/supplier/publications/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update publication");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Publicación actualizada",
        description: "La publicación ha sido actualizada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/publications"] });
      setShowEditPublicationModal(false);
      setSelectedPublication(null);
      publicationForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePublicationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/supplier/publications/${id}`, {});
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete publication");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Publicación eliminada",
        description: "La publicación ha sido eliminada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/publications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/plan-usage"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Publication handlers
  const handleEditPublication = (publication: SupplierPublication) => {
    setSelectedPublication(publication);
    publicationForm.reset({
      title: publication.title,
      content: publication.content,
      category: publication.category || "",
      imageUrl: publication.imageUrl || "",
      isActive: publication.isActive,
    });
    setShowEditPublicationModal(true);
  };

  const handleDeletePublication = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta publicación?")) {
      deletePublicationMutation.mutate(id);
    }
  };

  // Pagination for publications
  const paginatedPublications = publications.slice(
    (publicationPage - 1) * publicationsPerPage,
    publicationPage * publicationsPerPage
  );
  const totalPublicationPages = Math.ceil(publications.length / publicationsPerPage);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || user.role !== 'supplier') {
    return null;
  }

  // Check if supplier needs to select a subscription plan
  const needsSubscription = user?.supplier && !user.supplier.hasActiveSubscription;
  
  // If supplier doesn't have active subscription, show plan selection
  if (needsSubscription || (subscriptionStatus && !subscriptionStatus.hasActiveSubscription)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Selecciona tu Plan de Suscripción
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Para acceder a todas las funciones del dashboard de proveedor, 
              necesitas seleccionar y activar un plan de suscripción.
            </p>
          </div>
          <SubscriptionPlans 
            onPlanSelect={() => {}}
            onContinue={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  const supplier = dashboardData?.supplier || user?.supplier;
  const stats = dashboardData?.stats || { 
    totalQuotes: 0, 
    totalViews: 0, 
    averageRating: 0,
    totalProducts: 0,
    totalServices: 0,
    totalSpecialties: 0
  };
  const subscription = dashboardData?.subscription;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Proveedor</h1>
              <p className="text-gray-600 mt-1">{supplier?.legalName || "Cargando..."}</p>
            </div>
            <div className="flex items-center space-x-4">
              {supplier?.status && (
                <Badge className={getStatusColor(supplier.status)}>
                  {supplier.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {supplier.status === 'pending' && <AlertCircle className="w-3 h-3 mr-1" />}
                  {supplier.status === 'approved' ? 'Verificado' : 
                   supplier.status === 'pending' ? 'Pendiente' : 'Suspendido'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-overview">Resumen</TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">Productos</TabsTrigger>
            <TabsTrigger value="publications" data-testid="tab-publications">Publicaciones</TabsTrigger>
            <TabsTrigger value="quotes" data-testid="tab-quotes">Cotizaciones</TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-profile">Perfil</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Plan Usage Widget */}
            {user?.supplier?.id && (
              <PlanUsageWidget supplierId={user.supplier.id} />
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cotizaciones</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalQuotes || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Este mes</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vistas de Perfil</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalViews || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Total acumulado</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Eye className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Calificación</p>
                      <div className="flex items-baseline mt-1">
                        <p className="text-3xl font-bold text-gray-900">{stats.averageRating?.toFixed(1) || "0.0"}</p>
                        <Star className="w-5 h-5 text-yellow-400 ml-1 fill-yellow-400" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Promedio general</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Productos</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalProducts || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">En tu catálogo</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Package className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-orange" />
                  Solicitudes de Cotización Recientes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {quotes.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sin cotizaciones aún</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Cuando los clientes soliciten cotizaciones, aparecerán aquí. 
                      Asegúrate de tener tu perfil completo y productos agregados.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {quotes.slice(0, 5).map((quote: any) => (
                      <div key={quote.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{quote.projectName || "Sin título"}</h4>
                              <Badge variant={quote.status === 'pending' ? 'default' : 'secondary'}>
                                {quote.status === 'pending' ? 'Nueva' : 
                                 quote.status === 'responded' ? 'Respondida' : 'Cerrada'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {quote.clientName}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(quote.createdAt).toLocaleDateString('es-DO')}
                              </span>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setActiveTab("quotes")}
                            data-testid={`button-view-quote-${quote.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Catálogo de Productos</h2>
              <Dialog open={showAddProductModal} onOpenChange={(open) => {
                setShowAddProductModal(open);
                if (!open) {
                  setProductModalTab("catalog");
                  setSelectedCategory("");
                  setSearchTerm("");
                }
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-product">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Producto
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">Agregar Producto</DialogTitle>
                    <DialogDescription>
                      Selecciona un producto de nuestro catálogo o crea uno personalizado
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs value={productModalTab} onValueChange={setProductModalTab} className="flex-1 flex flex-col min-h-0">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="catalog" data-testid="tab-catalog">Catálogo Predefinido</TabsTrigger>
                      <TabsTrigger value="custom" data-testid="tab-custom">Crear Personalizado</TabsTrigger>
                    </TabsList>

                    {/* Predefined Products Catalog */}
                    <TabsContent value="catalog" className="flex-1 overflow-y-auto mt-4 space-y-4">
                      {/* Filters */}
                      <div className="space-y-3 sticky top-0 bg-white pb-3 border-b z-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Buscar</label>
                            <Input
                              placeholder="Buscar producto..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              data-testid="input-search-product"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Categoría</label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                              <SelectTrigger data-testid="select-category-filter">
                                <SelectValue placeholder="Todas las categorías" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todas las categorías</SelectItem>
                                {Object.keys(PRODUCTS_BY_CATEGORY).sort().map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category} ({PRODUCTS_BY_CATEGORY[category].length})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {filteredPredefinedProducts.length} productos disponibles
                        </div>
                      </div>

                      {/* Products List */}
                      <div className="grid grid-cols-1 gap-2 pb-4">
                        {filteredPredefinedProducts.map((product, index) => (
                          <Card 
                            key={index} 
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handlePredefinedProductSelect(product)}
                            data-testid={`card-predefined-product-${index}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm mb-1">{product.name}</h4>
                                  <p className="text-xs text-gray-600 mb-2">{product.description}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {product.category}
                                  </Badge>
                                </div>
                                <Button
                                  size="sm"
                                  disabled={createProductMutation.isPending}
                                  data-testid={`button-select-product-${index}`}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {filteredPredefinedProducts.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No se encontraron productos. Intenta con otros filtros.
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Custom Product Form */}
                    <TabsContent value="custom" className="flex-1 overflow-y-auto mt-4">
                      <Form {...productForm}>
                        <form onSubmit={productForm.handleSubmit((data) => createProductMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={productForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nombre del Producto</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Ej: Cemento Portland" 
                                    {...field} 
                                    data-testid="input-custom-product-name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={productForm.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Categoría</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-custom-product-category">
                                      <SelectValue placeholder="Selecciona una categoría" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {categories.map((category) => (
                                      <SelectItem key={category} value={category}>
                                        {category}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={productForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descripción (Opcional)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe el producto..." 
                                    {...field} 
                                    data-testid="input-custom-product-description"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end space-x-2 pt-4">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setShowAddProductModal(false)}
                              data-testid="button-cancel-custom-product"
                            >
                              Cancelar
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={createProductMutation.isPending}
                              data-testid="button-submit-custom-product"
                            >
                              {createProductMutation.isPending ? "Creando..." : "Crear Producto"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-6">
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-orange/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-10 h-10 text-orange" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos en tu catálogo</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Agrega productos a tu catálogo para que los clientes puedan conocer lo que ofreces. 
                      Puedes seleccionar de nuestro catálogo predefinido o crear productos personalizados.
                    </p>
                    <Button onClick={() => setShowAddProductModal(true)} data-testid="button-add-first-product">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar tu Primer Producto
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4 flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        {products.length} producto{products.length !== 1 ? 's' : ''} en catálogo
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((product: any) => (
                        <Card key={product.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                                <Badge variant="outline" className="text-xs mb-2">
                                  {product.category}
                                </Badge>
                              </div>
                            </div>
                            {product.description && (
                              <p className="text-sm text-gray-600 line-clamp-3 mb-3">{product.description}</p>
                            )}
                            <div className="flex items-center text-xs text-gray-500">
                              <span>Agregado {new Date(product.createdAt).toLocaleDateString('es-DO')}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Publications Tab */}
          <TabsContent value="publications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Publicaciones</h2>
              <Dialog open={showCreatePublicationModal} onOpenChange={setShowCreatePublicationModal}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-publication">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Publicación
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" data-testid="dialog-create-publication">
                  <DialogHeader>
                    <DialogTitle>Crear Publicación</DialogTitle>
                    <DialogDescription>
                      Comparte noticias, actualizaciones o contenido relevante con tus clientes
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...publicationForm}>
                    <form onSubmit={publicationForm.handleSubmit((data) => createPublicationMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={publicationForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Título de la publicación" 
                                data-testid="input-publication-title"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={publicationForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contenido</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Contenido de la publicación" 
                                rows={6}
                                data-testid="textarea-publication-content"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={publicationForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría (opcional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-publication-category">
                                  <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={publicationForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL de Imagen (opcional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="https://ejemplo.com/imagen.jpg" 
                                data-testid="input-publication-image"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowCreatePublicationModal(false)}
                          data-testid="button-cancel-create-publication"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createPublicationMutation.isPending}
                          data-testid="button-submit-create-publication"
                        >
                          {createPublicationMutation.isPending ? "Creando..." : "Crear Publicación"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-6">
                {publicationsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : publications.length === 0 ? (
                  <div className="text-center py-8">
                    <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay publicaciones</h3>
                    <p className="text-gray-600">
                      Crea tu primera publicación para compartir noticias y actualizaciones.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Vistas</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedPublications.map((publication) => (
                          <TableRow key={publication.id} data-testid={`row-publication-${publication.id}`}>
                            <TableCell className="font-medium" data-testid={`text-publication-title-${publication.id}`}>
                              {publication.title}
                            </TableCell>
                            <TableCell data-testid={`text-publication-category-${publication.id}`}>
                              {publication.category || "Sin categoría"}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={publication.isActive ? "default" : "secondary"}
                                data-testid={`badge-publication-status-${publication.id}`}
                              >
                                {publication.isActive ? "Activa" : "Inactiva"}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`text-publication-views-${publication.id}`}>
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4 text-gray-400" />
                                {publication.viewCount}
                              </div>
                            </TableCell>
                            <TableCell data-testid={`text-publication-date-${publication.id}`}>
                              {publication.createdAt ? new Date(publication.createdAt).toLocaleDateString('es-DO') : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditPublication(publication)}
                                  data-testid={`button-edit-publication-${publication.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeletePublication(publication.id)}
                                  disabled={deletePublicationMutation.isPending}
                                  data-testid={`button-delete-publication-${publication.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {/* Pagination */}
                    {totalPublicationPages > 1 && (
                      <div className="flex items-center justify-between pt-4">
                        <p className="text-sm text-gray-600">
                          Mostrando {((publicationPage - 1) * publicationsPerPage) + 1} a {Math.min(publicationPage * publicationsPerPage, publications.length)} de {publications.length} publicaciones
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPublicationPage(p => Math.max(1, p - 1))}
                            disabled={publicationPage === 1}
                            data-testid="button-publications-prev-page"
                          >
                            Anterior
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPublicationPage(p => Math.min(totalPublicationPages, p + 1))}
                            disabled={publicationPage === totalPublicationPages}
                            data-testid="button-publications-next-page"
                          >
                            Siguiente
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Publication Modal */}
            <Dialog open={showEditPublicationModal} onOpenChange={setShowEditPublicationModal}>
              <DialogContent className="max-w-2xl" data-testid="dialog-edit-publication">
                <DialogHeader>
                  <DialogTitle>Editar Publicación</DialogTitle>
                  <DialogDescription>
                    Actualiza la información de tu publicación
                  </DialogDescription>
                </DialogHeader>
                <Form {...publicationForm}>
                  <form onSubmit={publicationForm.handleSubmit((data) => {
                    if (selectedPublication) {
                      updatePublicationMutation.mutate({ id: selectedPublication.id, data });
                    }
                  })} className="space-y-4">
                    <FormField
                      control={publicationForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Título de la publicación" 
                              data-testid="input-edit-publication-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={publicationForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contenido</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Contenido de la publicación" 
                              rows={6}
                              data-testid="textarea-edit-publication-content"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={publicationForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoría (opcional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-edit-publication-category">
                                <SelectValue placeholder="Selecciona una categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={publicationForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL de Imagen (opcional)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="https://ejemplo.com/imagen.jpg" 
                              data-testid="input-edit-publication-image"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={publicationForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={!!field.value}
                              onChange={field.onChange}
                              className="w-4 h-4 rounded border-gray-300"
                              data-testid="checkbox-edit-publication-active"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Publicación activa</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowEditPublicationModal(false);
                          setSelectedPublication(null);
                          publicationForm.reset();
                        }}
                        data-testid="button-cancel-edit-publication"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updatePublicationMutation.isPending}
                        data-testid="button-submit-edit-publication"
                      >
                        {updatePublicationMutation.isPending ? "Actualizando..." : "Actualizar Publicación"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-6">
            <h2 className="text-xl font-semibold">Solicitudes de Cotización</h2>
            
            <Card>
              <CardContent className="p-6">
                {quotes.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cotizaciones</h3>
                    <p className="text-gray-600">
                      Las solicitudes de cotización de los clientes aparecerán aquí.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Proyecto</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotes.map((quote: any) => (
                        <TableRow key={quote.id}>
                          <TableCell className="font-medium">{quote.projectName}</TableCell>
                          <TableCell>{quote.clientName}</TableCell>
                          <TableCell>{new Date(quote.createdAt).toLocaleDateString('es-DO')}</TableCell>
                          <TableCell>
                            <Badge>{quote.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Información del Perfil</h2>
              <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">Editar Perfil</DialogTitle>
                  </DialogHeader>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="legalName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre Legal</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ubicación</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sitio Web</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowProfileModal(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={updateProfileMutation.isPending}>
                          {updateProfileMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Nombre Legal</p>
                        <p className="font-medium">{supplier?.legalName || "No especificado"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Teléfono</p>
                        <p className="font-medium">{supplier?.phone || "No especificado"}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Ubicación</p>
                        <p className="font-medium">{supplier?.location || "No especificado"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{user?.email || "No especificado"}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Globe className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Sitio Web</p>
                        <p className="font-medium">{supplier?.website || "No especificado"}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Miembro desde</p>
                        <p className="font-medium">
                          {supplier?.createdAt ? new Date(supplier.createdAt).toLocaleDateString('es-DO') : "No especificado"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {supplier?.description && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-gray-600 mb-2">Descripción</p>
                    <p className="text-gray-900">{supplier.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}