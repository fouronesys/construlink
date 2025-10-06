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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

type ProductFormData = z.infer<typeof productSchema>;
type ProfileFormData = z.infer<typeof profileSchema>;

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
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message.includes("límite") ? error.message : "Error al crear producto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="quotes">Cotizaciones</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Plan Usage Widget */}
            {user?.supplier?.id && (
              <PlanUsageWidget supplierId={user.supplier.id} />
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Cotizaciones Recibidas</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalQuotes || 0}</p>
                    </div>
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Vistas del Perfil</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalViews || 0}</p>
                    </div>
                    <Eye className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Calificación Promedio</p>
                      <div className="flex items-center">
                        <p className="text-2xl font-bold text-gray-900">{stats.averageRating || 0}</p>
                        <Star className="w-5 h-5 text-yellow-400 ml-1" />
                      </div>
                    </div>
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                {quotes.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cotizaciones</h3>
                    <p className="text-gray-600">
                      Las nuevas solicitudes de cotización aparecerán aquí.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quotes.slice(0, 5).map((quote: any) => (
                      <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{quote.projectName}</p>
                          <p className="text-sm text-gray-600">{quote.clientName}</p>
                        </div>
                        <Badge>{quote.status}</Badge>
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
              <Dialog open={showAddProductModal} onOpenChange={setShowAddProductModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Producto
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">Nuevo Producto</DialogTitle>
                  </DialogHeader>
                  <Form {...productForm}>
                    <form onSubmit={productForm.handleSubmit((data) => createProductMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={productForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Producto</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Cemento Portland" {...field} />
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
                                <SelectTrigger>
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
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe el producto..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowAddProductModal(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createProductMutation.isPending}>
                          {createProductMutation.isPending ? "Creando..." : "Crear Producto"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-6">
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
                    <p className="text-gray-600 mb-4">
                      Agrega productos a tu catálogo para que los clientes puedan encontrarte.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product: any) => (
                      <Card key={product.id}>
                        <CardContent className="p-4">
                          <h3 className="font-medium mb-2">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                          <p className="text-xs text-gray-500">{product.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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