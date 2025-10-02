import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  FileText,
  TrendingUp,
  DollarSign,
  Package,
  Search,
  Filter,
  Download,
  Settings,
  Shield,
  Activity,
  Calendar,
  BarChart3,
  Star,
  Image as ImageIcon,
  Upload,
  Trash2,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";

interface Supplier {
  id: string;
  legalName: string;
  rnc: string;
  email: string;
  phone: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  createdAt: string;
  approvalDate?: string;
  planType: string;
  isFeatured?: boolean;
}

interface QuoteRequest {
  id: string;
  projectName: string;
  clientName: string;
  supplierName: string;
  status: string;
  createdAt: string;
}

interface Banner {
  id: string;
  supplierId: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  imageUrl: string;
  title?: string;
  description?: string;
  linkUrl?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Banner management states
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [selectedBannerSupplier, setSelectedBannerSupplier] = useState<Supplier | null>(null);
  const [bannerDeviceType, setBannerDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerDescription, setBannerDescription] = useState("");
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Access control
  if (!authLoading && user && !['admin', 'superadmin'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
            <p className="text-gray-600">
              No tienes permisos para acceder al panel de administración.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch admin dashboard data
  const { data: dashboardData, isLoading } = useQuery<{ stats: { totalSuppliers: number; pendingApprovals: number; totalQuotes: number; activeSubscriptions: number; } }>({
    queryKey: ["/api/admin/dashboard"],
    enabled: !!user && ['admin', 'superadmin'].includes(user.role),
    retry: false,
  });

  // Fetch pending suppliers
  const { data: pendingSuppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/admin/suppliers/pending"],
    enabled: !!user && ['admin', 'superadmin'].includes(user.role),
    retry: false,
  });

  // Fetch all suppliers
  const { data: allSuppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/admin/suppliers"],
    enabled: !!user && ['admin', 'superadmin'].includes(user.role),
    retry: false,
  });

  // Fetch quote requests
  const { data: quoteRequests = [] } = useQuery<QuoteRequest[]>({
    queryKey: ["/api/admin/quote-requests"],
    enabled: !!user && ['admin', 'superadmin'].includes(user.role),
    retry: false,
  });

  // Fetch featured suppliers
  const { data: featuredSuppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/admin/suppliers/featured"],
    enabled: !!user && ['admin', 'superadmin'].includes(user.role),
    retry: false,
  });

  // Fetch banners for selected supplier
  const { data: supplierBanners = [] } = useQuery<Banner[]>({
    queryKey: ["/api/admin/suppliers", selectedBannerSupplier?.id, "banners"],
    enabled: !!selectedBannerSupplier?.id,
    retry: false,
  });

  // Supplier approval mutation
  const approveSupplierMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: 'approve' | 'reject'; reason?: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/suppliers/${id}/status`, {
        status: action === 'approve' ? 'approved' : 'rejected',
        reason,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.action === 'approve' ? "Proveedor Aprobado" : "Proveedor Rechazado",
        description: `El proveedor ha sido ${variables.action === 'approve' ? 'aprobado' : 'rechazado'} exitosamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      setShowApprovalModal(false);
      setSelectedSupplier(null);
      setRejectionReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al procesar la solicitud.",
        variant: "destructive",
      });
    },
  });

  // Subscription management mutation
  const manageSubscriptionMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: 'suspend' | 'reactivate'; reason?: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/suppliers/${id}/subscription`, {
        action,
        reason
      });
      if (!response.ok) throw new Error("Failed to update subscription status");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers"] });
      toast({
        title: "Éxito",
        description: `Suscripción ${variables.action === 'suspend' ? 'suspendida' : 'reactivada'} correctamente`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la suscripción",
        variant: "destructive",
      });
    },
  });

  // Toggle featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
      const response = await apiRequest("POST", `/api/admin/suppliers/${id}/featured`, {
        isFeatured,
      });
      if (!response.ok) throw new Error("Failed to update featured status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers/featured"] });
      toast({
        title: "Éxito",
        description: "Estado de proveedor destacado actualizado",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    },
  });

  // Upload banner mutation
  const uploadBannerMutation = useMutation({
    mutationFn: async ({ supplierId, file, deviceType, title, description }: { 
      supplierId: string; 
      file: File; 
      deviceType: string;
      title: string;
      description: string;
    }) => {
      // First upload the image
      const formData = new FormData();
      formData.append('banner', file);
      
      const uploadResponse = await apiRequest("POST", "/api/admin/upload/banner", formData);
      if (!uploadResponse.ok) throw new Error("Failed to upload image");
      const { imageUrl } = await uploadResponse.json();

      // Then create the banner record
      const bannerResponse = await apiRequest("POST", `/api/admin/suppliers/${supplierId}/banner`, {
        deviceType,
        imageUrl,
        title,
        description,
      });
      if (!bannerResponse.ok) throw new Error("Failed to create banner");
      return { supplierId, data: await bannerResponse.json() };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers", result.supplierId, "banners"] });
      toast({
        title: "Éxito",
        description: "Banner subido exitosamente",
      });
      resetBannerForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo subir el banner",
        variant: "destructive",
      });
    },
  });

  // Delete banner mutation
  const deleteBannerMutation = useMutation({
    mutationFn: async ({ supplierId, bannerId }: { supplierId: string; bannerId: string }) => {
      const response = await apiRequest("DELETE", `/api/admin/suppliers/${supplierId}/banner/${bannerId}`);
      if (!response.ok) throw new Error("Failed to delete banner");
      return { supplierId, data: await response.json() };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/suppliers", result.supplierId, "banners"] });
      toast({
        title: "Éxito",
        description: "Banner eliminado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el banner",
        variant: "destructive",
      });
    },
  });

  const handleApprovalAction = (supplier: Supplier, action: 'approve' | 'reject') => {
    setSelectedSupplier(supplier);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const handleSubscriptionAction = (supplier: Supplier, action: 'suspend' | 'reactivate') => {
    const reason = `Subscription ${action}d by admin for supplier: ${supplier.legalName}`;
    manageSubscriptionMutation.mutate({
      id: supplier.id,
      action,
      reason
    });
  };

  const confirmApproval = () => {
    if (!selectedSupplier || !approvalAction) return;
    
    approveSupplierMutation.mutate({
      id: selectedSupplier.id,
      action: approvalAction,
      reason: approvalAction === 'reject' ? rejectionReason : undefined,
    });
  };

  const handleToggleFeatured = (supplier: Supplier) => {
    toggleFeaturedMutation.mutate({
      id: supplier.id,
      isFeatured: !supplier.isFeatured,
    });
  };

  const handleManageBanner = (supplier: Supplier) => {
    setSelectedBannerSupplier(supplier);
    setShowBannerModal(true);
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo no debe superar 5MB",
          variant: "destructive",
        });
        return;
      }
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadBanner = () => {
    if (!selectedBannerSupplier || !bannerFile) return;

    uploadBannerMutation.mutate({
      supplierId: selectedBannerSupplier.id,
      file: bannerFile,
      deviceType: bannerDeviceType,
      title: bannerTitle,
      description: bannerDescription,
    });
  };

  const handleDeleteBanner = (bannerId: string) => {
    if (!selectedBannerSupplier) return;
    
    if (confirm("¿Estás seguro de eliminar este banner?")) {
      deleteBannerMutation.mutate({
        supplierId: selectedBannerSupplier.id,
        bannerId,
      });
    }
  };

  const resetBannerForm = () => {
    setBannerFile(null);
    setBannerPreview(null);
    setBannerTitle("");
    setBannerDescription("");
    setBannerDeviceType('desktop');
    setShowBannerModal(false);
    setSelectedBannerSupplier(null);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    totalSuppliers: 0,
    pendingApprovals: 0,
    totalQuotes: 0,
    activeSubscriptions: 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'suspended':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop':
        return <Monitor className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const approvedSuppliers = allSuppliers.filter((s: Supplier) => s.status === 'approved');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-600 mt-1">Gestión de proveedores y plataforma</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-blue-600">
                <Shield className="w-3 h-3 mr-1" />
                {user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="approvals" data-testid="tab-approvals">
              Aprobaciones
              {pendingSuppliers.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">
                  {pendingSuppliers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="suppliers" data-testid="tab-suppliers">Proveedores</TabsTrigger>
            <TabsTrigger value="featured" data-testid="tab-featured">
              <Star className="w-4 h-4 mr-1" />
              Destacados
            </TabsTrigger>
            <TabsTrigger value="quotes" data-testid="tab-quotes">Cotizaciones</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Proveedores</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-suppliers">{stats.totalSuppliers}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Pendientes de Aprobación</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="stat-pending-approvals">{stats.pendingApprovals}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Cotizaciones Totales</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-quotes">{stats.totalQuotes}</p>
                    </div>
                    <FileText className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Suscripciones Activas</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="stat-active-subscriptions">{stats.activeSubscriptions}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingSuppliers.slice(0, 5).map((supplier: Supplier) => (
                    <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{supplier.legalName}</p>
                          <p className="text-sm text-gray-600">Nuevo registro - {supplier.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(supplier.status)}>
                          {getStatusIcon(supplier.status)}
                          <span className="ml-1">Pendiente</span>
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprovalAction(supplier, 'approve')}
                          data-testid={`button-review-${supplier.id}`}
                        >
                          Revisar
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {pendingSuppliers.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <p className="text-gray-600">No hay solicitudes pendientes</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Solicitudes de Aprobación</h2>
              <Button variant="outline" data-testid="button-export-approvals">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                {pendingSuppliers.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay solicitudes pendientes
                    </h3>
                    <p className="text-gray-600">
                      Todas las solicitudes de proveedores han sido procesadas.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>RNC</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingSuppliers.map((supplier: Supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.legalName}</TableCell>
                          <TableCell>{supplier.rnc}</TableCell>
                          <TableCell>{supplier.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{supplier.planType}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(supplier.createdAt).toLocaleDateString('es-DO')}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprovalAction(supplier, 'approve')}
                                data-testid={`button-approve-${supplier.id}`}
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprovalAction(supplier, 'reject')}
                                data-testid={`button-reject-${supplier.id}`}
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Todos los Proveedores</h2>
              <div className="flex space-x-2">
                <Button variant="outline" data-testid="button-filter-suppliers">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrar
                </Button>
                <Button variant="outline" data-testid="button-export-suppliers">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha de Registro</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSuppliers.map((supplier: Supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.legalName}</TableCell>
                        <TableCell>{supplier.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{supplier.planType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(supplier.status)}>
                            {getStatusIcon(supplier.status)}
                            <span className="ml-1 capitalize">{supplier.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(supplier.createdAt).toLocaleDateString('es-DO')}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" title="Ver detalles" data-testid={`button-view-${supplier.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {supplier.status === 'approved' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSubscriptionAction(supplier, 'suspend')}
                                className="text-red-600 hover:text-red-700"
                                title="Suspender suscripción"
                                data-testid={`button-suspend-${supplier.id}`}
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </Button>
                            )}
                            {supplier.status === 'suspended' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSubscriptionAction(supplier, 'reactivate')}
                                className="text-green-600 hover:text-green-700"
                                title="Reactivar suscripción"
                                data-testid={`button-reactivate-${supplier.id}`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Featured Suppliers Tab */}
          <TabsContent value="featured" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Proveedores Destacados</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Gestiona qué proveedores aparecen en el carrusel de la homepage
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Proveedores Aprobados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>RNC</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Estado Featured</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedSuppliers.map((supplier: Supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.legalName}</TableCell>
                        <TableCell>{supplier.rnc}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{supplier.planType}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={supplier.isFeatured || false}
                              onCheckedChange={() => handleToggleFeatured(supplier)}
                              data-testid={`switch-featured-${supplier.id}`}
                            />
                            <span className="text-sm">
                              {supplier.isFeatured ? (
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  <Star className="w-3 h-3 mr-1" />
                                  Destacado
                                </Badge>
                              ) : (
                                <span className="text-gray-500">No destacado</span>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManageBanner(supplier)}
                            disabled={!supplier.isFeatured}
                            data-testid={`button-manage-banner-${supplier.id}`}
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Gestionar Banner
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Solicitudes de Cotización</h2>
              <Button variant="outline" data-testid="button-analytics-quotes">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analíticas
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quoteRequests.map((quote: QuoteRequest) => (
                      <TableRow key={quote.id}>
                        <TableCell className="font-medium">{quote.projectName}</TableCell>
                        <TableCell>{quote.clientName}</TableCell>
                        <TableCell>{quote.supplierName}</TableCell>
                        <TableCell>
                          <Badge>{quote.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(quote.createdAt).toLocaleDateString('es-DO')}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" data-testid={`button-view-quote-${quote.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Approval Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Aprobar Proveedor' : 'Rechazar Proveedor'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSupplier && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-2">{selectedSupplier.legalName}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">RNC:</span> {selectedSupplier.rnc}
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span> {selectedSupplier.email}
                  </div>
                  <div>
                    <span className="text-gray-600">Teléfono:</span> {selectedSupplier.phone}
                  </div>
                  <div>
                    <span className="text-gray-600">Plan:</span> {selectedSupplier.planType}
                  </div>
                </div>
              </div>

              {approvalAction === 'reject' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Razón del rechazo
                  </label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Describe la razón del rechazo..."
                    rows={3}
                    data-testid="textarea-rejection-reason"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowApprovalModal(false)}
                  data-testid="button-cancel-approval"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmApproval}
                  disabled={approveSupplierMutation.isPending || (approvalAction === 'reject' && !rejectionReason.trim())}
                  className={
                    approvalAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }
                  data-testid="button-confirm-approval"
                >
                  {approveSupplierMutation.isPending
                    ? 'Procesando...'
                    : approvalAction === 'approve'
                    ? 'Aprobar'
                    : 'Rechazar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Banner Management Modal */}
      <Dialog open={showBannerModal} onOpenChange={(open) => {
        if (!open) resetBannerForm();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Gestionar Banners - {selectedBannerSupplier?.legalName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Existing Banners */}
            {supplierBanners.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Banners Existentes</h3>
                <div className="space-y-3">
                  {supplierBanners.map((banner) => (
                    <div key={banner.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden">
                          <img
                            src={banner.imageUrl}
                            alt={banner.title || 'Banner'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            {getDeviceIcon(banner.deviceType)}
                            <span className="font-medium capitalize">{banner.deviceType}</span>
                          </div>
                          {banner.title && <p className="text-sm text-gray-600">{banner.title}</p>}
                          <Badge className={banner.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {banner.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="text-red-600"
                        data-testid={`button-delete-banner-${banner.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Banner */}
            <div className="border-t pt-6">
              <h3 className="font-medium mb-4">Subir Nuevo Banner</h3>
              
              <div className="space-y-4">
                {/* Device Type Selection */}
                <div>
                  <Label>Tipo de Dispositivo</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {(['desktop', 'tablet', 'mobile'] as const).map((device) => (
                      <button
                        key={device}
                        onClick={() => setBannerDeviceType(device)}
                        className={`p-3 border rounded-lg flex flex-col items-center space-y-2 ${
                          bannerDeviceType === device
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        data-testid={`button-device-${device}`}
                      >
                        {getDeviceIcon(device)}
                        <span className="text-sm capitalize">{device}</span>
                        <span className="text-xs text-gray-500">
                          {device === 'desktop' && '1920x400'}
                          {device === 'tablet' && '1024x300'}
                          {device === 'mobile' && '640x200'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <Label>Imagen del Banner</Label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleBannerFileChange}
                      data-testid="input-banner-file"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Máximo 5MB. Formatos: JPG, PNG, WebP
                    </p>
                  </div>
                </div>

                {/* Preview */}
                {bannerPreview && (
                  <div>
                    <Label>Vista Previa</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <img
                        src={bannerPreview}
                        alt="Preview"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                )}

                {/* Title and Description */}
                <div>
                  <Label>Título (Opcional)</Label>
                  <Input
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="Título del banner"
                    data-testid="input-banner-title"
                  />
                </div>

                <div>
                  <Label>Descripción (Opcional)</Label>
                  <Textarea
                    value={bannerDescription}
                    onChange={(e) => setBannerDescription(e.target.value)}
                    placeholder="Descripción del banner"
                    rows={2}
                    data-testid="textarea-banner-description"
                  />
                </div>

                {/* Upload Button */}
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={resetBannerForm}
                    data-testid="button-cancel-banner"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUploadBanner}
                    disabled={!bannerFile || uploadBannerMutation.isPending}
                    data-testid="button-upload-banner"
                  >
                    {uploadBannerMutation.isPending ? (
                      <>
                        <Upload className="w-4 h-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Subir Banner
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
