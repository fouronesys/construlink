import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Building,
  Clock,
  DollarSign,
  CheckCircle,
  Users,
  AlertTriangle,
  Check,
  X,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";

export default function AdminPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [approvalComments, setApprovalComments] = useState("");

  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (!authLoading && (!user || !['admin', 'superadmin'].includes(user.role || ''))) {
      toast({
        title: "Acceso denegado",
        description: "Debes ser administrador para acceder a esta página.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [user, authLoading, toast]);

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!user && ['admin', 'superadmin'].includes(user.role || ''),
    retry: false,
  });

  // Fetch pending approvals
  const { data: pendingSuppliers, isLoading: approvalsLoading } = useQuery({
    queryKey: ["/api/admin/approvals"],
    enabled: !!user && ['admin', 'superadmin'].includes(user.role || ''),
    retry: false,
  });

  const updateSupplierStatusMutation = useMutation({
    mutationFn: async ({ id, status, comments }: { id: string; status: string; comments: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/suppliers/${id}/status`, { status, comments });
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Estado actualizado",
        description: `Proveedor ${variables.status === 'approved' ? 'aprobado' : 'rechazado'} exitosamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedSupplier(null);
      setApprovalComments("");
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
        description: "Error al actualizar estado del proveedor.",
        variant: "destructive",
      });
    },
  });

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !['admin', 'superadmin'].includes(user.role || '')) {
    return null;
  }

  const handleApproval = (supplier: any, status: 'approved' | 'rejected') => {
    setSelectedSupplier({ ...supplier, pendingStatus: status });
  };

  const confirmApproval = () => {
    if (selectedSupplier) {
      updateSupplierStatusMutation.mutate({
        id: selectedSupplier.id,
        status: selectedSupplier.pendingStatus,
        comments: approvalComments,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-600 mt-1">Gestiona proveedores y supervisa la plataforma</p>
            </div>
            <div className="flex items-center space-x-4">
              {pendingSuppliers && pendingSuppliers.length > 0 && (
                <Badge className="bg-red-100 text-red-800">
                  {pendingSuppliers.length} Pendientes de Aprobación
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="approvals">Aprobaciones</TabsTrigger>
            <TabsTrigger value="providers">Proveedores</TabsTrigger>
            <TabsTrigger value="reports">Reportes</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Proveedores Activos</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalSuppliers || 0}</p>
                    </div>
                    <div className="text-emerald">
                      <Building className="w-8 h-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Pendientes Aprobación</p>
                      <p className="text-2xl font-bold text-red-600">{stats?.pendingApprovals || 0}</p>
                    </div>
                    <div className="text-red-600">
                      <Clock className="w-8 h-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Suscripciones Activas</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.activeSubscriptions || 0}</p>
                    </div>
                    <div className="text-primary">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                      <p className="text-2xl font-bold text-gray-900">
                        RD${((stats?.monthlyRevenue || 0) / 100).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-emerald">
                      <DollarSign className="w-8 h-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("approvals")}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Revisar Aprobaciones Pendientes ({stats?.pendingApprovals || 0})
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("providers")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Gestionar Proveedores
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("reports")}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Ver Reportes
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay actividad reciente</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Proveedores Pendientes de Aprobación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {approvalsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    </div>
                  ) : !pendingSuppliers || pendingSuppliers.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-emerald mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay aprobaciones pendientes</h3>
                      <p className="text-gray-600">Todos los proveedores han sido revisados.</p>
                    </div>
                  ) : (
                    pendingSuppliers.map((supplier: any) => (
                      <div key={supplier.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{supplier.legalName}</h4>
                            <p className="text-sm text-gray-600">RNC: {supplier.rnc}</p>
                            <p className="text-sm text-gray-600">Email: {supplier.email}</p>
                            <p className="text-sm text-gray-600">
                              Registrado: {new Date(supplier.createdAt).toLocaleDateString('es-DO')}
                            </p>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Pendiente
                          </Badge>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Especialidades:</p>
                          <div className="flex gap-2 flex-wrap">
                            {supplier.specialties?.map((specialty: string) => (
                              <Badge key={specialty} variant="secondary">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Ubicación:</p>
                          <p className="text-sm text-gray-600">{supplier.location}</p>
                        </div>

                        {supplier.description && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Descripción:</p>
                            <p className="text-sm text-gray-600">{supplier.description}</p>
                          </div>
                        )}

                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Estado RNC:</p>
                          <Badge className="bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Validado con DGII
                          </Badge>
                        </div>

                        <div className="flex justify-end space-x-3">
                          <Button
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                            onClick={() => handleApproval(supplier, 'rejected')}
                            disabled={updateSupplierStatusMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Rechazar
                          </Button>
                          <Button
                            className="bg-emerald text-emerald-foreground hover:bg-emerald/90"
                            onClick={() => handleApproval(supplier, 'approved')}
                            disabled={updateSupplierStatusMutation.isPending}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Aprobar
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Proveedores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Gestión de Proveedores</h3>
                  <p className="text-gray-600">Esta funcionalidad estará disponible próximamente.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reportes y Análisis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Reportes y Análisis</h3>
                  <p className="text-gray-600">Los reportes detallados estarán disponibles próximamente.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Approval Confirmation Dialog */}
      <Dialog open={!!selectedSupplier} onOpenChange={() => setSelectedSupplier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSupplier?.pendingStatus === 'approved' ? 'Aprobar Proveedor' : 'Rechazar Proveedor'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                {selectedSupplier?.pendingStatus === 'approved' 
                  ? `¿Estás seguro que deseas aprobar a ${selectedSupplier?.legalName}?`
                  : `¿Estás seguro que deseas rechazar a ${selectedSupplier?.legalName}?`
                }
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p><strong>RNC:</strong> {selectedSupplier?.rnc}</p>
                <p><strong>Email:</strong> {selectedSupplier?.email}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentarios {selectedSupplier?.pendingStatus === 'rejected' ? '(requerido)' : '(opcional)'}
              </label>
              <Textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                placeholder={
                  selectedSupplier?.pendingStatus === 'approved' 
                    ? "Comentarios adicionales sobre la aprobación..."
                    : "Explica el motivo del rechazo..."
                }
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSelectedSupplier(null)}>
                Cancelar
              </Button>
              <Button
                onClick={confirmApproval}
                disabled={updateSupplierStatusMutation.isPending || (selectedSupplier?.pendingStatus === 'rejected' && !approvalComments.trim())}
                className={selectedSupplier?.pendingStatus === 'approved' 
                  ? "bg-emerald text-emerald-foreground hover:bg-emerald/90" 
                  : "bg-red-600 hover:bg-red-700"
                }
              >
                {updateSupplierStatusMutation.isPending ? "Procesando..." : 
                 selectedSupplier?.pendingStatus === 'approved' ? "Aprobar" : "Rechazar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
