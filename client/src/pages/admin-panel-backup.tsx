import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
}

interface QuoteRequest {
  id: string;
  projectName: string;
  clientName: string;
  supplierName: string;
  status: string;
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
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    enabled: !!user && ['admin', 'superadmin'].includes(user.role),
    retry: false,
  });

  // Fetch pending suppliers
  const { data: pendingSuppliers = [] } = useQuery({
    queryKey: ["/api/admin/suppliers/pending"],
    enabled: !!user && ['admin', 'superadmin'].includes(user.role),
    retry: false,
  });

  // Fetch all suppliers
  const { data: allSuppliers = [] } = useQuery({
    queryKey: ["/api/admin/suppliers"],
    enabled: !!user && ['admin', 'superadmin'].includes(user.role),
    retry: false,
  });

  // Fetch quote requests
  const { data: quoteRequests = [] } = useQuery({
    queryKey: ["/api/admin/quote-requests"],
    enabled: !!user && ['admin', 'superadmin'].includes(user.role),
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

  const handleApprovalAction = (supplier: Supplier, action: 'approve' | 'reject') => {
    setSelectedSupplier(supplier);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const confirmApproval = () => {
    if (!selectedSupplier || !approvalAction) return;
    
    approveSupplierMutation.mutate({
      id: selectedSupplier.id,
      action: approvalAction,
      reason: approvalAction === 'reject' ? rejectionReason : undefined,
    });
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="approvals">
              Aprobaciones
              {pendingSuppliers.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">
                  {pendingSuppliers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
            <TabsTrigger value="quotes">Cotizaciones</TabsTrigger>
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
                      <p className="text-2xl font-bold text-gray-900">{stats.totalSuppliers}</p>
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
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
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
                      <p className="text-2xl font-bold text-gray-900">{stats.totalQuotes}</p>
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
                      <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
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
              <Button variant="outline">
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
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprovalAction(supplier, 'reject')}
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
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrar
                </Button>
                <Button variant="outline">
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
                          <Button variant="outline" size="sm">
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

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Solicitudes de Cotización</h2>
              <Button variant="outline">
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
                          <Button variant="outline" size="sm">
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
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowApprovalModal(false)}
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
    </div>
  );
}