import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { 
  Shield, 
  Users, 
  Building, 
  TrendingUp, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Activity
} from "lucide-react";

interface Supplier {
  id: string;
  legalName: string;
  rnc: string;
  phone: string;
  location: string;
  description: string;
  website?: string;
  specialties: string[];
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  createdAt: string;
  approvalDate?: string;
  rejectionReason?: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  subscription?: {
    plan: string;
    status: string;
    monthlyAmount: string;
  };
}

interface AdminStats {
  totalSuppliers: number;
  pendingApprovals: number;
  activeSuppliers: number;
  monthlyRevenue: number;
  totalUsers: number;
}

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch admin stats
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin'),
  });

  // Fetch suppliers with filters
  const { data: suppliers = [], isLoading, refetch } = useQuery<Supplier[]>({
    queryKey: ['/api/admin/suppliers', statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);
      
      const response = await apiRequest("GET", `/api/admin/suppliers?${params}`);
      return response.json();
    },
    enabled: isAuthenticated && (user?.role === 'admin' || user?.role === 'superadmin'),
  });

  // Approve supplier mutation
  const approveSupplierMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const response = await apiRequest("POST", `/api/admin/suppliers/${supplierId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Proveedor Aprobado",
        description: "El proveedor ha sido aprobado exitosamente.",
      });
      refetch();
      setSelectedSupplier(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al aprobar el proveedor.",
        variant: "destructive",
      });
    },
  });

  // Reject supplier mutation
  const rejectSupplierMutation = useMutation({
    mutationFn: async ({ supplierId, reason }: { supplierId: string; reason: string }) => {
      const response = await apiRequest("POST", `/api/admin/suppliers/${supplierId}/reject`, {
        reason,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Proveedor Rechazado",
        description: "El proveedor ha sido rechazado.",
      });
      refetch();
      setSelectedSupplier(null);
      setRejectionReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al rechazar el proveedor.",
        variant: "destructive",
      });
    },
  });

  // Suspend supplier mutation
  const suspendSupplierMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const response = await apiRequest("POST", `/api/admin/suppliers/${supplierId}/suspend`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Proveedor Suspendido",
        description: "El proveedor ha sido suspendido.",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Error al suspender el proveedor.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "yellow", text: "Pendiente", icon: Clock },
      approved: { color: "green", text: "Aprobado", icon: CheckCircle },
      rejected: { color: "red", text: "Rechazado", icon: XCircle },
      suspended: { color: "orange", text: "Suspendido", icon: Shield },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const IconComponent = config.icon;

    return (
      <Badge variant={config.color === "green" ? "default" : "secondary"} className={`
        ${config.color === "yellow" ? "bg-yellow-100 text-yellow-800 border-yellow-200" : ""}
        ${config.color === "green" ? "bg-green-100 text-green-800 border-green-200" : ""}
        ${config.color === "red" ? "bg-red-100 text-red-800 border-red-200" : ""}
        ${config.color === "orange" ? "bg-orange-100 text-orange-800 border-orange-200" : ""}
      `}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const planConfig = {
      basic: { color: "bg-blue-100 text-blue-800 border-blue-200", text: "Básico" },
      premium: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", text: "Premium" },
      enterprise: { color: "bg-purple-100 text-purple-800 border-purple-200", text: "Empresarial" },
    };

    const config = planConfig[plan as keyof typeof planConfig];
    if (!config) return null;

    return (
      <Badge variant="secondary" className={config.color}>
        {config.text}
      </Badge>
    );
  };

  // Show access denied only if user is definitely not an admin (but allow loading states)
  if (user && user.role !== 'admin' && user.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
              <p className="text-gray-600">
                No tienes permisos para acceder al panel administrativo.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Gestionar proveedores y supervisar la plataforma</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Building className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Proveedores</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSuppliers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pendientes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Activos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeSuppliers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-emerald-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Ingresos Mes</p>
                    <p className="text-2xl font-bold text-gray-900">RD${stats.monthlyRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="suppliers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
            <TabsTrigger value="analytics">Análisis</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar por nombre, RNC o email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="sm:w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendientes</SelectItem>
                        <SelectItem value="approved">Aprobados</SelectItem>
                        <SelectItem value="rejected">Rechazados</SelectItem>
                        <SelectItem value="suspended">Suspendidos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suppliers Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Proveedores</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha Registro</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{supplier.legalName}</div>
                              <div className="text-sm text-gray-500">RNC: {supplier.rnc}</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {supplier.specialties.slice(0, 2).map((specialty) => (
                                  <Badge key={specialty} variant="outline" className="text-xs">
                                    {specialty}
                                  </Badge>
                                ))}
                                {supplier.specialties.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{supplier.specialties.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {supplier.user?.email}
                              </div>
                              <div className="flex items-center mt-1">
                                <Phone className="w-3 h-3 mr-1" />
                                {supplier.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {supplier.subscription ? (
                              <div>
                                {getPlanBadge(supplier.subscription.plan)}
                                <div className="text-xs text-gray-500 mt-1">
                                  RD${parseInt(supplier.subscription.monthlyAmount).toLocaleString()}/mes
                                </div>
                              </div>
                            ) : (
                              <Badge variant="secondary">Sin plan</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(supplier.status)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(supplier.createdAt).toLocaleDateString('es-DO')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedSupplier(supplier)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Detalles del Proveedor</DialogTitle>
                                  </DialogHeader>
                                  {selectedSupplier && (
                                    <div className="space-y-6">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-sm font-medium text-gray-600">Nombre Legal</label>
                                          <p className="text-sm">{selectedSupplier.legalName}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-600">RNC</label>
                                          <p className="text-sm">{selectedSupplier.rnc}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-600">Email</label>
                                          <p className="text-sm">{selectedSupplier.user?.email}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-600">Teléfono</label>
                                          <p className="text-sm">{selectedSupplier.phone}</p>
                                        </div>
                                        <div className="col-span-2">
                                          <label className="text-sm font-medium text-gray-600">Ubicación</label>
                                          <p className="text-sm">{selectedSupplier.location}</p>
                                        </div>
                                        {selectedSupplier.website && (
                                          <div className="col-span-2">
                                            <label className="text-sm font-medium text-gray-600">Sitio Web</label>
                                            <p className="text-sm">{selectedSupplier.website}</p>
                                          </div>
                                        )}
                                      </div>

                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Especialidades</label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {selectedSupplier.specialties.map((specialty) => (
                                            <Badge key={specialty} variant="secondary">
                                              {specialty}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>

                                      {selectedSupplier.description && (
                                        <div>
                                          <label className="text-sm font-medium text-gray-600">Descripción</label>
                                          <p className="text-sm mt-1">{selectedSupplier.description}</p>
                                        </div>
                                      )}

                                      <div className="flex items-center justify-between pt-4 border-t">
                                        <div>
                                          <p className="text-sm font-medium">Estado actual:</p>
                                          {getStatusBadge(selectedSupplier.status)}
                                        </div>
                                        
                                        {selectedSupplier.status === 'pending' && (
                                          <div className="flex gap-2">
                                            <Button
                                              onClick={() => approveSupplierMutation.mutate(selectedSupplier.id)}
                                              disabled={approveSupplierMutation.isPending}
                                              className="bg-green-600 hover:bg-green-700"
                                            >
                                              <CheckCircle className="w-4 h-4 mr-2" />
                                              Aprobar
                                            </Button>
                                            <Dialog>
                                              <DialogTrigger asChild>
                                                <Button variant="destructive">
                                                  <XCircle className="w-4 h-4 mr-2" />
                                                  Rechazar
                                                </Button>
                                              </DialogTrigger>
                                              <DialogContent>
                                                <DialogHeader>
                                                  <DialogTitle>Rechazar Proveedor</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                  <div>
                                                    <label className="text-sm font-medium">Motivo del rechazo</label>
                                                    <Textarea
                                                      value={rejectionReason}
                                                      onChange={(e) => setRejectionReason(e.target.value)}
                                                      placeholder="Explica el motivo del rechazo..."
                                                    />
                                                  </div>
                                                  <div className="flex gap-2">
                                                    <Button
                                                      onClick={() => rejectSupplierMutation.mutate({
                                                        supplierId: selectedSupplier.id,
                                                        reason: rejectionReason
                                                      })}
                                                      disabled={!rejectionReason || rejectSupplierMutation.isPending}
                                                      variant="destructive"
                                                    >
                                                      Confirmar Rechazo
                                                    </Button>
                                                  </div>
                                                </div>
                                              </DialogContent>
                                            </Dialog>
                                          </div>
                                        )}

                                        {selectedSupplier.status === 'approved' && (
                                          <Button
                                            onClick={() => suspendSupplierMutation.mutate(selectedSupplier.id)}
                                            disabled={suspendSupplierMutation.isPending}
                                            variant="destructive"
                                          >
                                            <Shield className="w-4 h-4 mr-2" />
                                            Suspender
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
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

          <TabsContent value="analytics">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Análisis en Desarrollo</h3>
                  <p className="text-gray-600">
                    Esta sección estará disponible próximamente con métricas detalladas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Configuración del Sistema</h3>
                  <p className="text-gray-600">
                    Configuraciones administrativas estarán disponibles próximamente.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}