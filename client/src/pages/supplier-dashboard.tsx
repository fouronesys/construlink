import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
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
} from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "Nombre es requerido"),
  description: z.string().optional(),
  category: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function SupplierDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Show access denied if user is definitely not a supplier (but allow loading states)
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

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/supplier/dashboard"],
    enabled: !!user && user.role === 'supplier',
    retry: false,
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ["/api/supplier/products"],
    enabled: !!user && user.role === 'supplier',
    retry: false,
  });

  // Fetch quotes
  const { data: quotes } = useQuery({
    queryKey: ["/api/supplier/quotes"],
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

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await apiRequest("POST", "/api/supplier/products", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Producto creado",
        description: "El producto ha sido agregado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/products"] });
      setShowAddProductModal(false);
      productForm.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Tu sesión ha expirado. Iniciando sesión nuevamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "Error al crear producto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const updateQuoteStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/quote-requests/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Estado actualizado",
        description: "El estado de la cotización ha sido actualizado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier/quotes"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al actualizar estado.",
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

  const supplier = dashboardData?.supplier;
  const stats = dashboardData?.stats || {};
  const recentQuotes = dashboardData?.recentQuotes || [];
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

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'responded':
        return 'bg-emerald-100 text-emerald-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Proveedor</h1>
              <p className="text-gray-600 mt-1">{supplier?.legalName}</p>
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
              {subscription && (
                <div className="text-sm text-gray-600">
                  Próximo pago: {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-DO')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="catalog">Catálogo</TabsTrigger>
            <TabsTrigger value="quotes">Cotizaciones</TabsTrigger>
            <TabsTrigger value="subscription">Suscripción</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Cotizaciones Recibidas</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalQuotes || 0}</p>
                    </div>
                    <div className="text-primary">
                      <FileText className="w-8 h-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Perfil Visto</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalViews || 0}</p>
                    </div>
                    <div className="text-emerald">
                      <Eye className="w-8 h-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Calificación</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.averageRating?.toFixed(1) || '0.0'}</p>
                    </div>
                    <div className="text-yellow-500">
                      <Star className="w-8 h-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Estado Suscripción</p>
                      <p className="text-lg font-bold text-emerald">
                        {subscription?.status === 'active' ? 'Activa' : 'Inactiva'}
                      </p>
                    </div>
                    <div className="text-emerald">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cotizaciones Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentQuotes.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No hay cotizaciones recientes</p>
                    ) : (
                      recentQuotes.map((quote: any) => (
                        <div key={quote.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{quote.projectType}</p>
                            <p className="text-sm text-gray-600">{quote.clientName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(quote.createdAt).toLocaleDateString('es-DO')}
                            </p>
                          </div>
                          <Badge className={getQuoteStatusColor(quote.status)}>
                            {quote.status === 'pending' ? 'Pendiente' : 
                             quote.status === 'responded' ? 'Respondida' : 'Cerrada'}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alertas Importantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {supplier?.status === 'pending' && (
                      <div className="flex items-start p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertCircle className="text-yellow-600 mt-1 mr-3 w-5 h-5" />
                        <div>
                          <p className="font-medium text-yellow-900">Verificación pendiente</p>
                          <p className="text-sm text-yellow-700">
                            Tu perfil está siendo revisado por nuestro equipo administrativo.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {subscription?.status === 'active' && (
                      <div className="flex items-start p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="text-green-600 mt-1 mr-3 w-5 h-5" />
                        <div>
                          <p className="font-medium text-green-900">Suscripción activa</p>
                          <p className="text-sm text-green-700">
                            Tu suscripción está al día y tu perfil es visible en el directorio.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Catalog Tab */}
          <TabsContent value="catalog" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Gestión de Catálogo</CardTitle>
                  <Dialog open={showAddProductModal} onOpenChange={setShowAddProductModal}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Producto
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Agregar Producto</DialogTitle>
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
                                  <Input placeholder="Ej: Concreto Premezclado" {...field} />
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
                                <FormControl>
                                  <Input placeholder="Ej: Concreto" {...field} />
                                </FormControl>
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
                              {createProductMutation.isPending ? "Guardando..." : "Guardar"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!products || products.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No tienes productos registrados</p>
                      <Button className="mt-4" onClick={() => setShowAddProductModal(true)}>
                        Agregar tu primer producto
                      </Button>
                    </div>
                  ) : (
                    products.map((product: any) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <p className="text-sm text-gray-600">{product.description}</p>
                          {product.category && (
                            <Badge variant="secondary" className="mt-1">
                              {product.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes de Cotización</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!quotes || quotes.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No tienes solicitudes de cotización</p>
                  ) : (
                    quotes.map((quote: any) => (
                      <div key={quote.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{quote.projectType}</h4>
                            <p className="text-sm text-gray-600">
                              {quote.clientName} - {quote.company}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(quote.createdAt).toLocaleDateString('es-DO')}
                            </p>
                          </div>
                          <Badge className={getQuoteStatusColor(quote.status)}>
                            {quote.status === 'pending' ? 'Pendiente' : 
                             quote.status === 'responded' ? 'Respondida' : 'Cerrada'}
                          </Badge>
                        </div>
                        
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">Descripción del Proyecto:</h5>
                          <p className="text-gray-700 text-sm">{quote.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          <div>
                            <span className="font-medium">Email:</span> {quote.clientEmail}
                          </div>
                          {quote.clientPhone && (
                            <div>
                              <span className="font-medium">Teléfono:</span> {quote.clientPhone}
                            </div>
                          )}
                          {quote.budget && (
                            <div>
                              <span className="font-medium">Presupuesto:</span> {quote.budget}
                            </div>
                          )}
                          {quote.estimatedStartDate && (
                            <div>
                              <span className="font-medium">Inicio estimado:</span>{" "}
                              {new Date(quote.estimatedStartDate).toLocaleDateString('es-DO')}
                            </div>
                          )}
                        </div>

                        {quote.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button 
                              size="sm"
                              onClick={() => updateQuoteStatusMutation.mutate({ id: quote.id, status: 'responded' })}
                              disabled={updateQuoteStatusMutation.isPending}
                            >
                              Marcar como Respondida
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateQuoteStatusMutation.mutate({ id: quote.id, status: 'closed' })}
                              disabled={updateQuoteStatusMutation.isPending}
                            >
                              Cerrar
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Información de Suscripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Plan:</p>
                        <p className="text-lg font-semibold">Plan Proveedor Verificado</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Estado:</p>
                        <Badge className={subscription.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                          {subscription.status === 'active' ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Período actual:</p>
                        <p>{new Date(subscription.currentPeriodStart).toLocaleDateString('es-DO')} - {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-DO')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Próximo cobro:</p>
                        <p>{new Date(subscription.currentPeriodEnd).toLocaleDateString('es-DO')}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Costo mensual:</h4>
                      <p className="text-2xl font-bold text-gray-900">RD$1,000</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No tienes una suscripción activa</p>
                    <Button>Activar Suscripción</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información del Proveedor</CardTitle>
              </CardHeader>
              <CardContent>
                {supplier && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre Legal
                        </label>
                        <p className="text-gray-900">{supplier.legalName}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          RNC
                        </label>
                        <p className="text-gray-900">{supplier.rnc}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono
                        </label>
                        <p className="text-gray-900 flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          {supplier.phone}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <p className="text-gray-900 flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          {supplier.email}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ubicación
                        </label>
                        <p className="text-gray-900 flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {supplier.location}
                        </p>
                      </div>
                      
                      {supplier.website && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sitio Web
                          </label>
                          <p className="text-gray-900 flex items-center">
                            <Globe className="w-4 h-4 mr-2" />
                            <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {supplier.website}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {supplier.description && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción
                        </label>
                        <p className="text-gray-900">{supplier.description}</p>
                      </div>
                    )}
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
