import { useState, useEffect } from "react";
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
  TrendingDown,
  MousePointerClick,
  Receipt,
  RefreshCw,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
  clickCount?: number;
  impressionCount?: number;
}

interface BannerStats {
  totalBanners: number;
  totalClicks: number;
  totalImpressions: number;
  averageCTR: number;
  bannerDetails: Array<{
    id: string;
    supplierId: string;
    supplierName: string;
    deviceType: string;
    clicks: number;
    impressions: number;
    ctr: number;
  }>;
}

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: 'client' | 'supplier' | 'moderator' | 'support' | 'admin' | 'superadmin';
  isActive: boolean;
  createdAt: string;
}

interface AdminAction {
  id: string;
  adminId: string;
  adminEmail?: string;
  actionType: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  createdAt: string;
}

interface Payment {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  planType: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  transactionId?: string;
  createdAt: string;
}

interface PaymentStats {
  totalRevenue: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  averageAmount: number;
  revenueByPlan: Array<{
    planType: string;
    totalRevenue: number;
    count: number;
  }>;
}

interface PlatformConfig {
  configKey: string;
  configValue: any;
  description?: string;
  updatedBy?: string;
  updatedAt: string;
}

interface Refund {
  id: string;
  paymentId: string;
  amount: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  verifoneRefundId?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
  payment?: {
    id: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    planType: string;
    amount: string;
    currency: string;
  };
}

interface Invoice {
  id: string;
  paymentId: string;
  supplierId: string;
  invoiceNumber: string;
  ncf?: string;
  ncfSequence?: string;
  subtotal: string;
  itbis: string;
  total: string;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  paidDate?: string;
  notes?: string;
  createdAt: string;
  payment?: {
    id: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    planType: string;
  };
  supplier?: {
    id: string;
    legalName: string;
    rnc: string;
  };
}

interface Subscription {
  id: string;
  supplierId: string;
  plan: 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'trialing';
  verifoneSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialEndDate?: string;
  monthlyAmount: string;
  createdAt: string;
  updatedAt: string;
  supplier?: {
    id: string;
    legalName: string;
    rnc: string;
    email: string;
  };
  payments?: Payment[];
  totalPayments?: number;
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

  // Log filters
  const [logSearch, setLogSearch] = useState("");
  const [logActionFilter, setLogActionFilter] = useState("all");
  const [logEntityFilter, setLogEntityFilter] = useState("all");

  // Payment filters
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentPlanFilter, setPaymentPlanFilter] = useState("all");
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentLimit, setPaymentLimit] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setPaymentPage(1);
  }, [paymentSearch, paymentStatusFilter, paymentPlanFilter, paymentLimit]);

  // Refund filters and states
  const [refundSearch, setRefundSearch] = useState("");
  const [refundStatusFilter, setRefundStatusFilter] = useState("all");
  const [refundPage, setRefundPage] = useState(1);
  const [refundLimit, setRefundLimit] = useState(10);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState<Payment | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // Invoice filters and states
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");
  const [invoiceSupplierFilter, setInvoiceSupplierFilter] = useState("all");
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceLimit, setInvoiceLimit] = useState(10);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedPaymentForInvoice, setSelectedPaymentForInvoice] = useState<Payment | null>(null);
  const [invoiceNcfSequence, setInvoiceNcfSequence] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");

  // Subscription filters and states
  const [subscriptionSearch, setSubscriptionSearch] = useState("");
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState("all");
  const [subscriptionPlanFilter, setSubscriptionPlanFilter] = useState("all");
  const [subscriptionPage, setSubscriptionPage] = useState(1);
  const [subscriptionLimit, setSubscriptionLimit] = useState(10);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showSubscriptionDetailsModal, setShowSubscriptionDetailsModal] = useState(false);

  // Reset pages when filters change
  useEffect(() => {
    setRefundPage(1);
  }, [refundSearch, refundStatusFilter, refundLimit]);

  useEffect(() => {
    setInvoicePage(1);
  }, [invoiceSearch, invoiceStatusFilter, invoiceSupplierFilter, invoiceLimit]);

  useEffect(() => {
    setSubscriptionPage(1);
  }, [subscriptionSearch, subscriptionStatusFilter, subscriptionPlanFilter, subscriptionLimit]);

  // Plan configuration states
  const [basicPrice, setBasicPrice] = useState(1000);
  const [basicProducts, setBasicProducts] = useState(10);
  const [basicImages, setBasicImages] = useState(50);
  const [professionalPrice, setProfessionalPrice] = useState(2500);
  const [professionalProducts, setProfessionalProducts] = useState(50);
  const [professionalImages, setProfessionalImages] = useState(200);
  const [enterprisePrice, setEnterprisePrice] = useState(5000);
  const [enterpriseProducts, setEnterpriseProducts] = useState(-1);
  const [enterpriseImages, setEnterpriseImages] = useState(-1);

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

  // Fetch banner statistics
  const { data: bannerStats } = useQuery<BannerStats>({
    queryKey: ["/api/admin/banners/stats"],
    enabled: !!user && ['admin', 'superadmin'].includes(user.role),
    retry: false,
  });

  // Fetch all users for role management (superadmin only)
  const { data: adminUsers = [] } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/all-users"],
    enabled: !!user && user.role === 'superadmin',
    retry: false,
  });

  // Fetch admin action logs (superadmin only)
  const { data: adminActions = [] } = useQuery<AdminAction[]>({
    queryKey: ["/api/admin/actions"],
    enabled: !!user && user.role === 'superadmin',
    retry: false,
  });

  // Fetch payments
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery<{ payments: Payment[]; total: number }>({
    queryKey: [`/api/admin/payments?page=${paymentPage}&limit=${paymentLimit}&status=${paymentStatusFilter}&plan=${paymentPlanFilter}&search=${paymentSearch}`],
    enabled: !!user && ['admin', 'superadmin'].includes(user.role),
    retry: false,
  });

  // Fetch payment statistics
  const { data: paymentStats } = useQuery<PaymentStats>({
    queryKey: ["/api/admin/payments/stats"],
    enabled: !!user && ['admin', 'superadmin'].includes(user.role),
    retry: false,
  });

  // Fetch refunds
  const { data: refundsData, isLoading: refundsLoading } = useQuery<{ refunds: Refund[]; total: number }>({
    queryKey: [`/api/admin/refunds?page=${refundPage}&limit=${refundLimit}&status=${refundStatusFilter}&search=${refundSearch}`],
    enabled: !!user && ['admin', 'superadmin'].includes(user.role),
    retry: false,
  });

  // Fetch invoices
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery<{ invoices: Invoice[]; total: number }>({
    queryKey: [`/api/admin/invoices?page=${invoicePage}&limit=${invoiceLimit}&status=${invoiceStatusFilter}&supplierId=${invoiceSupplierFilter}&search=${invoiceSearch}`],
    enabled: !!user && ['admin', 'superadmin'].includes(user.role),
    retry: false,
  });

  // Fetch subscriptions
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useQuery<{ subscriptions: Subscription[]; total: number }>({
    queryKey: ['/api/admin/subscriptions', { page: subscriptionPage, limit: subscriptionLimit, status: subscriptionStatusFilter, plan: subscriptionPlanFilter, search: subscriptionSearch }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: subscriptionPage.toString(),
        limit: subscriptionLimit.toString(),
        status: subscriptionStatusFilter,
        plan: subscriptionPlanFilter,
        search: subscriptionSearch,
      });
      const response = await fetch(`/api/admin/subscriptions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      return response.json();
    },
    enabled: !!user && ['admin', 'superadmin'].includes(user.role),
    retry: false,
  });

  // Fetch platform configurations (superadmin only)
  const { data: platformConfigs = [] } = useQuery<PlatformConfig[]>({
    queryKey: ["/api/admin/config"],
    enabled: !!user && user.role === 'superadmin',
    retry: false,
  });

  // Load platform configurations into state when data is fetched
  useEffect(() => {
    if (platformConfigs && platformConfigs.length > 0) {
      platformConfigs.forEach((config) => {
        // Parse value safely - handle numbers, strings that can be numbers, and defaults
        let value: number;
        if (typeof config.configValue === 'number') {
          value = config.configValue;
        } else if (typeof config.configValue === 'string' && !isNaN(Number(config.configValue))) {
          value = Number(config.configValue);
        } else {
          // If it's not a valid number, skip this config
          return;
        }
        
        switch (config.configKey) {
          case 'plan_basic_price':
            setBasicPrice(value);
            break;
          case 'plan_basic_products':
            setBasicProducts(value);
            break;
          case 'plan_basic_images':
            setBasicImages(value);
            break;
          case 'plan_professional_price':
            setProfessionalPrice(value);
            break;
          case 'plan_professional_products':
            setProfessionalProducts(value);
            break;
          case 'plan_professional_images':
            setProfessionalImages(value);
            break;
          case 'plan_enterprise_price':
            setEnterprisePrice(value);
            break;
          case 'plan_enterprise_products':
            setEnterpriseProducts(value);
            break;
          case 'plan_enterprise_images':
            setEnterpriseImages(value);
            break;
        }
      });
    }
  }, [platformConfigs]);

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

  // Update user role mutation (superadmin only)
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      if (!response.ok) throw new Error("Failed to update user role");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Éxito",
        description: "Rol de usuario actualizado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el rol del usuario",
        variant: "destructive",
      });
    },
  });

  // Update user status mutation (superadmin only)
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/status`, { isActive });
      if (!response.ok) throw new Error("Failed to update user status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Éxito",
        description: "Estado de usuario actualizado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado del usuario",
        variant: "destructive",
      });
    },
  });

  // Update platform configuration mutation (superadmin only)
  const updatePlatformConfigMutation = useMutation({
    mutationFn: async ({ key, configValue, description }: { key: string; configValue: any; description?: string }) => {
      const response = await apiRequest("PUT", `/api/admin/config/${key}`, { configValue, description });
      if (!response.ok) throw new Error("Failed to update configuration");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      toast({
        title: "Éxito",
        description: "Configuración actualizada correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    },
  });

  // Create refund mutation
  const createRefundMutation = useMutation({
    mutationFn: async ({ paymentId, amount, reason }: { paymentId: string; amount: number; reason: string }) => {
      const response = await apiRequest("POST", "/api/admin/refunds", { paymentId, amount, reason });
      if (!response.ok) throw new Error("Failed to create refund");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/refunds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      setShowRefundModal(false);
      setSelectedPaymentForRefund(null);
      setRefundAmount("");
      setRefundReason("");
      toast({
        title: "Éxito",
        description: "Reembolso creado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el reembolso",
        variant: "destructive",
      });
    },
  });

  // Process refund mutation (approve/reject)
  const processRefundMutation = useMutation({
    mutationFn: async ({ id, status, verifoneRefundId }: { id: string; status: 'approved' | 'rejected'; verifoneRefundId?: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/refunds/${id}`, { status, verifoneRefundId });
      if (!response.ok) throw new Error("Failed to process refund");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/refunds"] });
      toast({
        title: "Éxito",
        description: "Reembolso procesado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar el reembolso",
        variant: "destructive",
      });
    },
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async ({ paymentId, supplierId, ncfSequence, notes }: { paymentId: string; supplierId: string; ncfSequence?: string; notes?: string }) => {
      const response = await apiRequest("POST", "/api/admin/invoices", { paymentId, supplierId, ncfSequence, notes });
      if (!response.ok) throw new Error("Failed to create invoice");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      setShowInvoiceModal(false);
      setSelectedPaymentForInvoice(null);
      setInvoiceNcfSequence("");
      setInvoiceNotes("");
      toast({
        title: "Éxito",
        description: "Factura creada correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la factura",
        variant: "destructive",
      });
    },
  });

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, status, paidDate }: { id: string; status: string; paidDate?: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/invoices/${id}`, { status, paidDate });
      if (!response.ok) throw new Error("Failed to update invoice");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({
        title: "Éxito",
        description: "Factura actualizada correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la factura",
        variant: "destructive",
      });
    },
  });

  // Update subscription status mutation
  const updateSubscriptionStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'inactive' | 'cancelled' | 'trialing' }) => {
      const response = await apiRequest("PATCH", `/api/admin/subscriptions/${id}/status`, { status });
      if (!response.ok) throw new Error("Failed to update subscription status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      setShowSubscriptionDetailsModal(false);
      setSelectedSubscription(null);
      toast({
        title: "Éxito",
        description: "Estado de suscripción actualizado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la suscripción",
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

  const handleSavePlatformConfig = async () => {
    try {
      // Save all plan configurations
      await Promise.all([
        // Basic plan
        updatePlatformConfigMutation.mutateAsync({
          key: 'plan_basic_price',
          configValue: basicPrice,
          description: 'Precio mensual del plan Basic en RD$'
        }),
        updatePlatformConfigMutation.mutateAsync({
          key: 'plan_basic_products',
          configValue: basicProducts,
          description: 'Límite de productos del plan Basic'
        }),
        updatePlatformConfigMutation.mutateAsync({
          key: 'plan_basic_images',
          configValue: basicImages,
          description: 'Límite de imágenes del plan Basic'
        }),
        // Professional plan
        updatePlatformConfigMutation.mutateAsync({
          key: 'plan_professional_price',
          configValue: professionalPrice,
          description: 'Precio mensual del plan Professional en RD$'
        }),
        updatePlatformConfigMutation.mutateAsync({
          key: 'plan_professional_products',
          configValue: professionalProducts,
          description: 'Límite de productos del plan Professional'
        }),
        updatePlatformConfigMutation.mutateAsync({
          key: 'plan_professional_images',
          configValue: professionalImages,
          description: 'Límite de imágenes del plan Professional'
        }),
        // Enterprise plan
        updatePlatformConfigMutation.mutateAsync({
          key: 'plan_enterprise_price',
          configValue: enterprisePrice,
          description: 'Precio mensual del plan Enterprise en RD$'
        }),
        updatePlatformConfigMutation.mutateAsync({
          key: 'plan_enterprise_products',
          configValue: enterpriseProducts,
          description: 'Límite de productos del plan Enterprise (-1 = ilimitado)'
        }),
        updatePlatformConfigMutation.mutateAsync({
          key: 'plan_enterprise_images',
          configValue: enterpriseImages,
          description: 'Límite de imágenes del plan Enterprise (-1 = ilimitado)'
        }),
      ]);
      
      toast({
        title: "Configuración Guardada",
        description: "Todas las configuraciones de planes se han actualizado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al guardar las configuraciones",
        variant: "destructive",
      });
    }
  };

  // CSV Export Functions
  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const value = row[h] ?? '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPayments = async () => {
    try {
      const params = new URLSearchParams({
        status: paymentStatusFilter,
        plan: paymentPlanFilter,
        search: paymentSearch,
      });
      const response = await fetch(`/api/admin/payments/export?${params}`);
      if (!response.ok) throw new Error('Failed to export payments');
      const data = await response.json();
      
      if (!data.payments || data.payments.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay pagos para exportar",
          variant: "destructive",
        });
        return;
      }

      const exportData = data.payments.map((payment: Payment) => ({
        Fecha: new Date(payment.createdAt).toLocaleString('es-DO'),
        Usuario: payment.userName ?? 'N/A',
        Email: payment.userEmail,
        Plan: payment.planType,
        Monto: payment.amount,
        Moneda: payment.currency,
        Estado: payment.status,
        Metodo: payment.paymentMethod,
        TransaccionID: payment.transactionId ?? 'N/A',
      }));

      exportToCSV(exportData, 'pagos', ['Fecha', 'Usuario', 'Email', 'Plan', 'Monto', 'Moneda', 'Estado', 'Metodo', 'TransaccionID']);
      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${data.payments.length} pagos correctamente`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron exportar los pagos",
        variant: "destructive",
      });
    }
  };

  const handleExportInvoices = async () => {
    try {
      const params = new URLSearchParams({
        status: invoiceStatusFilter,
        supplierId: invoiceSupplierFilter,
        search: invoiceSearch,
      });
      const response = await fetch(`/api/admin/invoices/export?${params}`);
      if (!response.ok) throw new Error('Failed to export invoices');
      const data = await response.json();
      
      if (!data.invoices || data.invoices.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay facturas para exportar",
          variant: "destructive",
        });
        return;
      }

      const exportData = data.invoices.map((invoice: Invoice) => ({
        NumeroFactura: invoice.invoiceNumber,
        NCF: invoice.ncf ?? 'N/A',
        Proveedor: invoice.supplier?.legalName ?? 'N/A',
        RNC: invoice.supplier?.rnc ?? 'N/A',
        Subtotal: invoice.subtotal,
        ITBIS: invoice.itbis,
        Total: invoice.total,
        Moneda: invoice.currency,
        Estado: invoice.status,
        Fecha: new Date(invoice.createdAt).toLocaleDateString('es-DO'),
        FechaPago: invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString('es-DO') : 'N/A',
        Notas: invoice.notes ?? '',
      }));

      exportToCSV(exportData, 'facturas_fiscales', ['NumeroFactura', 'NCF', 'Proveedor', 'RNC', 'Subtotal', 'ITBIS', 'Total', 'Moneda', 'Estado', 'Fecha', 'FechaPago', 'Notas']);
      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${data.invoices.length} facturas correctamente`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron exportar las facturas",
        variant: "destructive",
      });
    }
  };

  const handleExportSubscriptions = async () => {
    try {
      const params = new URLSearchParams({
        status: subscriptionStatusFilter,
        plan: subscriptionPlanFilter,
        search: subscriptionSearch,
      });
      const response = await fetch(`/api/admin/subscriptions/export?${params}`);
      if (!response.ok) throw new Error('Failed to export subscriptions');
      const data = await response.json();
      
      if (!data.subscriptions || data.subscriptions.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay suscripciones para exportar",
          variant: "destructive",
        });
        return;
      }

      const exportData = data.subscriptions.map((subscription: Subscription) => ({
        Proveedor: subscription.supplier?.legalName ?? 'N/A',
        RNC: subscription.supplier?.rnc ?? 'N/A',
        Email: subscription.supplier?.email ?? 'N/A',
        Plan: subscription.plan,
        Estado: subscription.status,
        MontoMensual: subscription.monthlyAmount,
        PeriodoInicio: subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart).toLocaleDateString('es-DO') : 'N/A',
        PeriodoFin: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('es-DO') : 'N/A',
        TotalPagos: subscription.totalPayments ?? 0,
        FechaCreacion: new Date(subscription.createdAt).toLocaleDateString('es-DO'),
      }));

      exportToCSV(exportData, 'suscripciones', ['Proveedor', 'RNC', 'Email', 'Plan', 'Estado', 'MontoMensual', 'PeriodoInicio', 'PeriodoFin', 'TotalPagos', 'FechaCreacion']);
      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${data.subscriptions.length} suscripciones correctamente`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron exportar las suscripciones",
        variant: "destructive",
      });
    }
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
          <TabsList className="grid w-full grid-cols-12">
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
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-1" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="quotes" data-testid="tab-quotes">Cotizaciones</TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">
              <DollarSign className="w-4 h-4 mr-1" />
              Pagos
            </TabsTrigger>
            <TabsTrigger value="refunds" data-testid="tab-refunds">
              <RefreshCw className="w-4 h-4 mr-1" />
              Reembolsos
            </TabsTrigger>
            <TabsTrigger value="invoices" data-testid="tab-invoices">
              <Receipt className="w-4 h-4 mr-1" />
              Facturas
            </TabsTrigger>
            {user?.role === 'superadmin' && (
              <>
                <TabsTrigger value="config" data-testid="tab-config">
                  <Settings className="w-4 h-4 mr-1" />
                  Config
                </TabsTrigger>
                <TabsTrigger value="admins" data-testid="tab-admins">
                  <Shield className="w-4 h-4 mr-1" />
                  Administradores
                </TabsTrigger>
                <TabsTrigger value="logs" data-testid="tab-logs">
                  <Activity className="w-4 h-4 mr-1" />
                  Logs
                </TabsTrigger>
              </>
            )}
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Analytics de Banners</h2>
              <Button
                variant="outline"
                onClick={() => {
                  if (!bannerStats || !bannerStats.bannerDetails.length) {
                    toast({
                      title: "No hay datos",
                      description: "No hay estadísticas de banners para exportar",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  const csvContent = [
                    ['Proveedor', 'Dispositivo', 'Clicks', 'Impresiones', 'CTR (%)'].join(','),
                    ...bannerStats.bannerDetails.map(banner => 
                      [
                        banner.supplierName,
                        banner.deviceType,
                        banner.clicks,
                        banner.impressions,
                        banner.ctr.toFixed(2)
                      ].join(',')
                    )
                  ].join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `banner-stats-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  
                  toast({
                    title: "Exportado",
                    description: "Estadísticas exportadas exitosamente",
                  });
                }}
                data-testid="button-export-banner-stats"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Banners</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-banners">
                        {bannerStats?.totalBanners || 0}
                      </p>
                    </div>
                    <ImageIcon className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-clicks">
                        {bannerStats?.totalClicks || 0}
                      </p>
                    </div>
                    <MousePointerClick className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Impresiones</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-impressions">
                        {bannerStats?.totalImpressions || 0}
                      </p>
                    </div>
                    <Eye className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">CTR Promedio</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="stat-average-ctr">
                        {bannerStats?.averageCTR ? `${bannerStats.averageCTR.toFixed(2)}%` : '0%'}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            {bannerStats && bannerStats.bannerDetails.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Clicks Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Clicks por Banner</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={bannerStats.bannerDetails}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="supplierName"
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="clicks" fill="#3b82f6" name="Clicks" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Impressions Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Impresiones por Banner</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={bannerStats.bannerDetails}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="supplierName"
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="impressions" fill="#10b981" name="Impresiones" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* CTR Chart */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>CTR por Banner (%)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={bannerStats.bannerDetails}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="supplierName"
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="ctr" fill="#f59e0b" name="CTR (%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detalles por Banner</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Proveedor</TableHead>
                          <TableHead>Dispositivo</TableHead>
                          <TableHead className="text-right">Clicks</TableHead>
                          <TableHead className="text-right">Impresiones</TableHead>
                          <TableHead className="text-right">CTR (%)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bannerStats.bannerDetails.map((banner) => (
                          <TableRow key={banner.id}>
                            <TableCell className="font-medium">{banner.supplierName}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getDeviceIcon(banner.deviceType)}
                                <span className="capitalize">{banner.deviceType}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right" data-testid={`banner-clicks-${banner.id}`}>
                              {banner.clicks}
                            </TableCell>
                            <TableCell className="text-right" data-testid={`banner-impressions-${banner.id}`}>
                              {banner.impressions}
                            </TableCell>
                            <TableCell className="text-right" data-testid={`banner-ctr-${banner.id}`}>
                              <Badge variant={banner.ctr > 5 ? "default" : "secondary"}>
                                {banner.ctr.toFixed(2)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay datos de analytics
                    </h3>
                    <p className="text-gray-600">
                      Crea y activa banners para comenzar a ver estadísticas de rendimiento.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
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

          {/* Admin Users Management Tab (Superadmin Only) */}
          {user?.role === 'superadmin' && (
            <TabsContent value="admins" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold" data-testid="heading-admin-management">Gestión de Administradores</h2>
                  <p className="text-sm text-gray-600 mt-1" data-testid="text-admin-description">Administrar roles y permisos de usuarios</p>
                </div>
              </div>

              <Card>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha de Registro</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            No hay usuarios registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        adminUsers.map((adminUser: AdminUser) => (
                          <TableRow key={adminUser.id}>
                            <TableCell className="font-medium" data-testid={`text-email-${adminUser.id}`}>
                              {adminUser.email}
                            </TableCell>
                            <TableCell data-testid={`text-name-${adminUser.id}`}>
                              {adminUser.name || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <select
                                value={adminUser.role}
                                onChange={(e) => {
                                  if (adminUser.id === user.id) {
                                    toast({
                                      title: "Acción no permitida",
                                      description: "No puedes cambiar tu propio rol",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  if (confirm(`¿Cambiar rol de ${adminUser.email} a ${e.target.value}?`)) {
                                    updateUserRoleMutation.mutate({
                                      userId: adminUser.id,
                                      role: e.target.value,
                                    });
                                  }
                                }}
                                disabled={adminUser.id === user.id}
                                className="border rounded px-2 py-1 text-sm"
                                data-testid={`select-role-${adminUser.id}`}
                              >
                                <option value="client" data-testid={`option-role-client-${adminUser.id}`}>Cliente</option>
                                <option value="supplier" data-testid={`option-role-supplier-${adminUser.id}`}>Proveedor</option>
                                <option value="moderator" data-testid={`option-role-moderator-${adminUser.id}`}>Moderador</option>
                                <option value="support" data-testid={`option-role-support-${adminUser.id}`}>Soporte</option>
                                <option value="admin" data-testid={`option-role-admin-${adminUser.id}`}>Admin</option>
                                <option value="superadmin" data-testid={`option-role-superadmin-${adminUser.id}`}>Superadmin</option>
                              </select>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={adminUser.isActive}
                                  onCheckedChange={(checked) => {
                                    if (adminUser.id === user.id) {
                                      toast({
                                        title: "Acción no permitida",
                                        description: "No puedes desactivar tu propia cuenta",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    const action = checked ? 'activar' : 'desactivar';
                                    if (confirm(`¿Estás seguro de ${action} la cuenta de ${adminUser.email}?`)) {
                                      updateUserStatusMutation.mutate({
                                        userId: adminUser.id,
                                        isActive: checked,
                                      });
                                    }
                                  }}
                                  disabled={adminUser.id === user.id}
                                  data-testid={`switch-status-${adminUser.id}`}
                                />
                                <span className="text-sm" data-testid={`text-status-${adminUser.id}`}>
                                  {adminUser.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell data-testid={`text-date-${adminUser.id}`}>
                              {new Date(adminUser.createdAt).toLocaleDateString('es-DO')}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={adminUser.role === 'superadmin' ? 'default' : adminUser.role === 'admin' ? 'secondary' : 'outline'}
                                data-testid={`badge-role-${adminUser.id}`}
                              >
                                {adminUser.role === 'superadmin' && <Shield className="w-3 h-3 mr-1" />}
                                {adminUser.role === 'moderator' ? 'Moderador' : 
                                 adminUser.role === 'support' ? 'Soporte' : 
                                 adminUser.role === 'admin' ? 'Admin' : 
                                 adminUser.role === 'superadmin' ? 'Superadmin' : 
                                 adminUser.role === 'supplier' ? 'Proveedor' : 'Cliente'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200" data-testid="card-permissions-info">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900" data-testid="heading-permissions">Permisos por Rol</h4>
                      <ul className="text-sm text-blue-800 mt-2 space-y-1" data-testid="list-permissions">
                        <li data-testid="text-permission-superadmin"><strong>Superadmin:</strong> Control total de la plataforma</li>
                        <li data-testid="text-permission-admin"><strong>Admin:</strong> Gestión de proveedores y contenido</li>
                        <li data-testid="text-permission-moderator"><strong>Moderador:</strong> Aprobaciones y gestión de cotizaciones</li>
                        <li data-testid="text-permission-support"><strong>Soporte:</strong> Solo lectura para asistencia</li>
                        <li data-testid="text-permission-supplier"><strong>Proveedor:</strong> Gestión de productos y cotizaciones</li>
                        <li data-testid="text-permission-client"><strong>Cliente:</strong> Acceso básico a la plataforma</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Admin Action Logs Tab (Superadmin Only) */}
          {user?.role === 'superadmin' && (
            <TabsContent value="logs" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold" data-testid="heading-admin-logs">Registro de Acciones Administrativas</h2>
                  <p className="text-sm text-gray-600 mt-1" data-testid="text-logs-description">Historial completo de acciones realizadas por administradores</p>
                </div>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="log-search">Buscar</Label>
                      <Input
                        id="log-search"
                        placeholder="Buscar por email o entidad..."
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        data-testid="input-log-search"
                      />
                    </div>
                    <div>
                      <Label htmlFor="action-filter">Tipo de Acción</Label>
                      <select
                        id="action-filter"
                        value={logActionFilter}
                        onChange={(e) => setLogActionFilter(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                        data-testid="select-action-filter"
                      >
                        <option value="all">Todas</option>
                        <option value="update_user_role">Cambio de Rol</option>
                        <option value="update_user_status">Cambio de Estado</option>
                        <option value="approve_supplier">Aprobar Proveedor</option>
                        <option value="reject_supplier">Rechazar Proveedor</option>
                        <option value="suspend_subscription">Suspender Suscripción</option>
                        <option value="reactivate_subscription">Reactivar Suscripción</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="entity-filter">Tipo de Entidad</Label>
                      <select
                        id="entity-filter"
                        value={logEntityFilter}
                        onChange={(e) => setLogEntityFilter(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                        data-testid="select-entity-filter"
                      >
                        <option value="all">Todas</option>
                        <option value="user">Usuario</option>
                        <option value="supplier">Proveedor</option>
                        <option value="subscription">Suscripción</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Logs Table */}
              <Card>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Acción</TableHead>
                        <TableHead>Entidad</TableHead>
                        <TableHead>Detalles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminActions
                        .filter((action) => {
                          const matchesSearch = !logSearch || 
                            action.adminEmail?.toLowerCase().includes(logSearch.toLowerCase()) ||
                            action.entityId?.toLowerCase().includes(logSearch.toLowerCase());
                          const matchesAction = logActionFilter === 'all' || action.actionType === logActionFilter;
                          const matchesEntity = logEntityFilter === 'all' || action.entityType === logEntityFilter;
                          return matchesSearch && matchesAction && matchesEntity;
                        })
                        .slice(0, 50)
                        .map((action: AdminAction) => (
                          <TableRow key={action.id} data-testid={`row-log-${action.id}`}>
                            <TableCell data-testid={`text-log-date-${action.id}`}>
                              {new Date(action.createdAt).toLocaleString('es-DO', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </TableCell>
                            <TableCell data-testid={`text-log-admin-${action.id}`}>
                              {action.adminEmail || 'N/A'}
                            </TableCell>
                            <TableCell data-testid={`text-log-action-${action.id}`}>
                              <Badge variant="outline">
                                {action.actionType.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`text-log-entity-${action.id}`}>
                              {action.entityType ? (
                                <span className="text-sm">
                                  {action.entityType}
                                  {action.entityId && (
                                    <span className="text-gray-500 ml-1">
                                      ({action.entityId.substring(0, 8)}...)
                                    </span>
                                  )}
                                </span>
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                            <TableCell data-testid={`text-log-details-${action.id}`}>
                              {action.details ? (
                                <pre className="text-xs bg-gray-50 p-2 rounded max-w-md overflow-x-auto">
                                  {JSON.stringify(action.details, null, 2)}
                                </pre>
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      {adminActions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8" data-testid="text-no-logs">
                            No hay acciones registradas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border-gray-200" data-testid="card-logs-info">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Activity className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900" data-testid="heading-logs-info">Información del Registro</h4>
                      <p className="text-sm text-gray-700 mt-1" data-testid="text-logs-info">
                        Este registro muestra las últimas 50 acciones administrativas realizadas en la plataforma. 
                        Todas las acciones críticas como cambios de rol, aprobaciones de proveedores y modificaciones 
                        de suscripciones quedan registradas para auditoría.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold" data-testid="heading-payments">Gestión de Pagos</h2>
                <p className="text-sm text-gray-600 mt-1" data-testid="text-payments-description">Administra y monitorea todos los pagos de la plataforma</p>
              </div>
              <Button
                onClick={handleExportPayments}
                variant="outline"
                data-testid="button-export-payments"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Pagos CSV
              </Button>
            </div>

            {/* Payment Statistics */}
            {paymentStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                        <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-revenue">
                          RD${paymentStats.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Pagos Exitosos</p>
                        <p className="text-2xl font-bold text-gray-900" data-testid="stat-successful-payments">
                          {paymentStats.successfulPayments}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Pagos Fallidos</p>
                        <p className="text-2xl font-bold text-gray-900" data-testid="stat-failed-payments">
                          {paymentStats.failedPayments}
                        </p>
                      </div>
                      <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Monto Promedio</p>
                        <p className="text-2xl font-bold text-gray-900" data-testid="stat-average-amount">
                          RD${paymentStats.averageAmount.toLocaleString()}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Revenue by Plan Chart */}
            {paymentStats && paymentStats.revenueByPlan.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle data-testid="heading-revenue-chart">Ingresos por Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={paymentStats.revenueByPlan}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="planType" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalRevenue" name="Ingresos" fill="#3b82f6" />
                      <Bar dataKey="count" name="Cantidad" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="payment-search">Buscar</Label>
                    <Input
                      id="payment-search"
                      placeholder="Buscar por nombre, email, ID..."
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      data-testid="input-payment-search"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status-filter">Estado</Label>
                    <select
                      id="status-filter"
                      value={paymentStatusFilter}
                      onChange={(e) => setPaymentStatusFilter(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm"
                      data-testid="select-status-filter"
                    >
                      <option value="all">Todos</option>
                      <option value="completed">Completado</option>
                      <option value="failed">Fallido</option>
                      <option value="pending">Pendiente</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="plan-filter">Plan</Label>
                    <select
                      id="plan-filter"
                      value={paymentPlanFilter}
                      onChange={(e) => setPaymentPlanFilter(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm"
                      data-testid="select-plan-filter"
                    >
                      <option value="all">Todos</option>
                      <option value="basic">Basic</option>
                      <option value="professional">Professional</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="limit">Resultados por página</Label>
                    <select
                      id="limit"
                      value={paymentLimit}
                      onChange={(e) => setPaymentLimit(Number(e.target.value))}
                      className="w-full border rounded px-3 py-2 text-sm"
                      data-testid="select-limit"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payments Table */}
            <Card>
              <CardContent className="p-6">
                {paymentsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>ID Transacción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentsData?.payments.map((payment: Payment) => (
                          <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                            <TableCell data-testid={`text-payment-date-${payment.id}`}>
                              {new Date(payment.createdAt).toLocaleString('es-DO', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </TableCell>
                            <TableCell data-testid={`text-payment-user-${payment.id}`}>
                              <div>
                                <p className="font-medium">{payment.userName || 'N/A'}</p>
                                <p className="text-sm text-gray-500">{payment.userEmail}</p>
                              </div>
                            </TableCell>
                            <TableCell data-testid={`text-payment-plan-${payment.id}`}>
                              <Badge variant="outline">{payment.planType}</Badge>
                            </TableCell>
                            <TableCell data-testid={`text-payment-amount-${payment.id}`}>
                              <span className="font-medium">
                                {payment.currency} ${payment.amount.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell data-testid={`text-payment-method-${payment.id}`}>
                              {payment.paymentMethod}
                            </TableCell>
                            <TableCell data-testid={`text-payment-status-${payment.id}`}>
                              <Badge className={
                                payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }>
                                {payment.status === 'completed' ? 'Completado' :
                                 payment.status === 'failed' ? 'Fallido' : 'Pendiente'}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`text-payment-transaction-${payment.id}`}>
                              <span className="text-sm font-mono text-gray-600">
                                {payment.transactionId || 'N/A'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!paymentsData || paymentsData.payments.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-gray-500 py-8" data-testid="text-no-payments">
                              No hay pagos registrados
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {paymentsData && paymentsData.total > 0 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-gray-600" data-testid="text-payment-count">
                          Mostrando {paymentsData.payments.length} de {paymentsData.total} pagos
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaymentPage(Math.max(1, paymentPage - 1))}
                            disabled={paymentPage === 1}
                            data-testid="button-prev-page"
                          >
                            Anterior
                          </Button>
                          <span className="px-3 py-2 text-sm" data-testid="text-current-page">
                            Página {paymentPage}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaymentPage(paymentPage + 1)}
                            disabled={paymentsData.payments.length < paymentLimit}
                            data-testid="button-next-page"
                          >
                            Siguiente
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Subscriptions Management Section */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold" data-testid="heading-subscriptions">Gestión de Suscripciones</h3>
                  <p className="text-sm text-gray-600 mt-1">Administra las suscripciones de proveedores y su historial de pagos</p>
                </div>
                <Button
                  onClick={handleExportSubscriptions}
                  variant="outline"
                  size="sm"
                  data-testid="button-export-subscriptions"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Suscripciones CSV
                </Button>
              </div>

              {/* Subscription Filters */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="subscription-search">Buscar</Label>
                      <Input
                        id="subscription-search"
                        placeholder="Buscar por proveedor, RNC..."
                        value={subscriptionSearch}
                        onChange={(e) => setSubscriptionSearch(e.target.value)}
                        data-testid="input-subscription-search"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subscription-status-filter">Estado</Label>
                      <select
                        id="subscription-status-filter"
                        value={subscriptionStatusFilter}
                        onChange={(e) => setSubscriptionStatusFilter(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                        data-testid="select-subscription-status-filter"
                      >
                        <option value="all">Todos</option>
                        <option value="active">Activa</option>
                        <option value="inactive">Inactiva</option>
                        <option value="cancelled">Cancelada</option>
                        <option value="trialing">En prueba</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="subscription-plan-filter">Plan</Label>
                      <select
                        id="subscription-plan-filter"
                        value={subscriptionPlanFilter}
                        onChange={(e) => setSubscriptionPlanFilter(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                        data-testid="select-subscription-plan-filter"
                      >
                        <option value="all">Todos</option>
                        <option value="basic">Basic</option>
                        <option value="professional">Professional</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="subscription-limit">Resultados por página</Label>
                      <select
                        id="subscription-limit"
                        value={subscriptionLimit}
                        onChange={(e) => setSubscriptionLimit(Number(e.target.value))}
                        className="w-full border rounded px-3 py-2 text-sm"
                        data-testid="select-subscription-limit"
                      >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscriptions Table */}
              <Card>
                <CardContent className="p-6">
                  {subscriptionsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Monto Mensual</TableHead>
                            <TableHead>Período Actual</TableHead>
                            <TableHead>Total Pagos</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subscriptionsData?.subscriptions.map((subscription: Subscription) => (
                            <TableRow key={subscription.id} data-testid={`row-subscription-${subscription.id}`}>
                              <TableCell data-testid={`text-subscription-supplier-${subscription.id}`}>
                                <div>
                                  <p className="font-medium">{subscription.supplier?.legalName || 'N/A'}</p>
                                  <p className="text-sm text-gray-500">{subscription.supplier?.rnc || 'N/A'}</p>
                                </div>
                              </TableCell>
                              <TableCell data-testid={`text-subscription-plan-${subscription.id}`}>
                                <Badge variant="outline" className="capitalize">
                                  {subscription.plan}
                                </Badge>
                              </TableCell>
                              <TableCell data-testid={`text-subscription-status-${subscription.id}`}>
                                <Badge className={
                                  subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                                  subscription.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  subscription.status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }>
                                  {subscription.status === 'active' ? 'Activa' :
                                   subscription.status === 'inactive' ? 'Inactiva' :
                                   subscription.status === 'cancelled' ? 'Cancelada' : 'En prueba'}
                                </Badge>
                              </TableCell>
                              <TableCell data-testid={`text-subscription-amount-${subscription.id}`}>
                                <span className="font-medium">
                                  RD${Number(subscription.monthlyAmount).toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell data-testid={`text-subscription-period-${subscription.id}`}>
                                {subscription.currentPeriodStart && subscription.currentPeriodEnd ? (
                                  <div className="text-sm">
                                    <p>{new Date(subscription.currentPeriodStart).toLocaleDateString('es-DO')}</p>
                                    <p className="text-gray-500">hasta {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-DO')}</p>
                                  </div>
                                ) : (
                                  'N/A'
                                )}
                              </TableCell>
                              <TableCell data-testid={`text-subscription-payments-${subscription.id}`}>
                                <span className="font-medium">
                                  {subscription.totalPayments || 0}
                                </span>
                              </TableCell>
                              <TableCell data-testid={`actions-subscription-${subscription.id}`}>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSubscription(subscription);
                                      setShowSubscriptionDetailsModal(true);
                                    }}
                                    data-testid={`button-view-subscription-${subscription.id}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {subscription.status === 'active' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateSubscriptionStatusMutation.mutate({ id: subscription.id, status: 'inactive' })}
                                      data-testid={`button-deactivate-subscription-${subscription.id}`}
                                    >
                                      Desactivar
                                    </Button>
                                  )}
                                  {subscription.status === 'inactive' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateSubscriptionStatusMutation.mutate({ id: subscription.id, status: 'active' })}
                                      data-testid={`button-activate-subscription-${subscription.id}`}
                                    >
                                      Activar
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!subscriptionsData || subscriptionsData.subscriptions.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-gray-500 py-8" data-testid="text-no-subscriptions">
                                No hay suscripciones registradas
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>

                      {/* Pagination */}
                      {subscriptionsData && subscriptionsData.total > 0 && (
                        <div className="flex items-center justify-between mt-4">
                          <p className="text-sm text-gray-600" data-testid="text-subscription-count">
                            Mostrando {subscriptionsData.subscriptions.length} de {subscriptionsData.total} suscripciones
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSubscriptionPage(Math.max(1, subscriptionPage - 1))}
                              disabled={subscriptionPage === 1}
                              data-testid="button-subscription-prev-page"
                            >
                              Anterior
                            </Button>
                            <span className="px-3 py-2 text-sm" data-testid="text-subscription-current-page">
                              Página {subscriptionPage}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSubscriptionPage(subscriptionPage + 1)}
                              disabled={subscriptionsData.subscriptions.length < subscriptionLimit}
                              data-testid="button-subscription-next-page"
                            >
                              Siguiente
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Subscription Details Modal */}
            {selectedSubscription && (
              <Dialog open={showSubscriptionDetailsModal} onOpenChange={setShowSubscriptionDetailsModal}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle data-testid="heading-subscription-details">Detalles de Suscripción</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">Proveedor</Label>
                        <p className="font-medium" data-testid="text-modal-supplier-name">{selectedSubscription.supplier?.legalName || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">RNC</Label>
                        <p className="font-medium" data-testid="text-modal-supplier-rnc">{selectedSubscription.supplier?.rnc || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Plan</Label>
                        <Badge variant="outline" className="capitalize" data-testid="text-modal-plan">{selectedSubscription.plan}</Badge>
                      </div>
                      <div>
                        <Label className="text-gray-600">Estado</Label>
                        <Badge className={
                          selectedSubscription.status === 'active' ? 'bg-green-100 text-green-800' :
                          selectedSubscription.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          selectedSubscription.status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        } data-testid="text-modal-status">
                          {selectedSubscription.status}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-gray-600">Monto Mensual</Label>
                        <p className="font-medium" data-testid="text-modal-amount">RD${Number(selectedSubscription.monthlyAmount).toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">ID Verifone</Label>
                        <p className="text-sm font-mono text-gray-600" data-testid="text-modal-verifone-id">{selectedSubscription.verifoneSubscriptionId || 'N/A'}</p>
                      </div>
                    </div>

                    {selectedSubscription.currentPeriodStart && selectedSubscription.currentPeriodEnd && (
                      <div>
                        <Label className="text-gray-600">Período Actual</Label>
                        <p className="font-medium" data-testid="text-modal-period">
                          {new Date(selectedSubscription.currentPeriodStart).toLocaleDateString('es-DO')} - {new Date(selectedSubscription.currentPeriodEnd).toLocaleDateString('es-DO')}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowSubscriptionDetailsModal(false)}
                        data-testid="button-close-modal"
                      >
                        Cerrar
                      </Button>
                      {selectedSubscription.status !== 'cancelled' && (
                        <>
                          {selectedSubscription.status === 'active' ? (
                            <Button
                              variant="destructive"
                              onClick={() => updateSubscriptionStatusMutation.mutate({ id: selectedSubscription.id, status: 'cancelled' })}
                              data-testid="button-cancel-subscription-modal"
                            >
                              Cancelar Suscripción
                            </Button>
                          ) : (
                            <Button
                              onClick={() => updateSubscriptionStatusMutation.mutate({ id: selectedSubscription.id, status: 'active' })}
                              data-testid="button-activate-subscription-modal"
                            >
                              Activar Suscripción
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* Refunds Tab */}
          <TabsContent value="refunds" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold" data-testid="heading-refunds">Gestión de Reembolsos</h2>
                <p className="text-sm text-gray-600 mt-1">Administra las solicitudes de reembolso de pagos</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle data-testid="heading-refunds-list">Lista de Reembolsos</CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Buscar por ID de pago..."
                      value={refundSearch}
                      onChange={(e) => setRefundSearch(e.target.value)}
                      className="sm:w-64"
                      data-testid="input-refund-search"
                    />
                    <select
                      value={refundStatusFilter}
                      onChange={(e) => setRefundStatusFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                      data-testid="select-refund-status-filter"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="pending">Pendiente</option>
                      <option value="approved">Aprobado</option>
                      <option value="rejected">Rechazado</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {refundsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : refundsData?.refunds && refundsData.refunds.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Pago</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Razón</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {refundsData.refunds.map((refund) => (
                          <TableRow key={refund.id} data-testid={`row-refund-${refund.id}`}>
                            <TableCell data-testid={`text-refund-id-${refund.id}`}>
                              {refund.id.substring(0, 8)}
                            </TableCell>
                            <TableCell data-testid={`text-refund-payment-${refund.id}`}>
                              {refund.paymentId.substring(0, 8)}
                            </TableCell>
                            <TableCell data-testid={`text-refund-user-${refund.id}`}>
                              <div>
                                <div>{refund.payment?.userName || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{refund.payment?.userEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell data-testid={`text-refund-amount-${refund.id}`}>
                              {refund.payment?.currency} {Number(refund.amount).toLocaleString()}
                            </TableCell>
                            <TableCell data-testid={`text-refund-reason-${refund.id}`}>
                              <div className="max-w-xs truncate">{refund.reason}</div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(refund.status)} data-testid={`status-refund-${refund.id}`}>
                                {refund.status}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`text-refund-date-${refund.id}`}>
                              {new Date(refund.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {refund.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => processRefundMutation.mutate({ 
                                      id: refund.id, 
                                      status: 'approved',
                                      verifoneRefundId: `VRF-${Date.now()}`
                                    })}
                                    data-testid={`button-approve-refund-${refund.id}`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Aprobar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => processRefundMutation.mutate({ 
                                      id: refund.id, 
                                      status: 'rejected' 
                                    })}
                                    data-testid={`button-reject-refund-${refund.id}`}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Rechazar
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {((refundPage - 1) * refundLimit) + 1} - {Math.min(refundPage * refundLimit, refundsData.total)} de {refundsData.total} reembolsos
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={refundPage === 1}
                          onClick={() => setRefundPage(p => p - 1)}
                          data-testid="button-refund-prev-page"
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={refundPage * refundLimit >= refundsData.total}
                          onClick={() => setRefundPage(p => p + 1)}
                          data-testid="button-refund-next-page"
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay reembolsos registrados
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold" data-testid="heading-invoices">Gestión de Facturas</h2>
                <p className="text-sm text-gray-600 mt-1">Administra las facturas con NCF para República Dominicana</p>
              </div>
              <Button
                onClick={handleExportInvoices}
                variant="outline"
                data-testid="button-export-invoices"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Facturas CSV
              </Button>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle data-testid="heading-invoices-list">Lista de Facturas</CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Buscar por número o NCF..."
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      className="sm:w-64"
                      data-testid="input-invoice-search"
                    />
                    <select
                      value={invoiceStatusFilter}
                      onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                      data-testid="select-invoice-status-filter"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="draft">Borrador</option>
                      <option value="sent">Enviada</option>
                      <option value="paid">Pagada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : invoicesData?.invoices && invoicesData.invoices.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>NCF</TableHead>
                          <TableHead>Proveedor</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead>ITBIS (18%)</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoicesData.invoices.map((invoice) => (
                          <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                            <TableCell data-testid={`text-invoice-number-${invoice.id}`}>
                              {invoice.invoiceNumber}
                            </TableCell>
                            <TableCell data-testid={`text-invoice-ncf-${invoice.id}`}>
                              {invoice.ncf || 'N/A'}
                            </TableCell>
                            <TableCell data-testid={`text-invoice-supplier-${invoice.id}`}>
                              <div>
                                <div>{invoice.supplier?.legalName || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{invoice.supplier?.rnc}</div>
                              </div>
                            </TableCell>
                            <TableCell data-testid={`text-invoice-subtotal-${invoice.id}`}>
                              {invoice.currency} {Number(invoice.subtotal).toLocaleString()}
                            </TableCell>
                            <TableCell data-testid={`text-invoice-itbis-${invoice.id}`}>
                              {invoice.currency} {Number(invoice.itbis).toLocaleString()}
                            </TableCell>
                            <TableCell data-testid={`text-invoice-total-${invoice.id}`}>
                              <strong>{invoice.currency} {Number(invoice.total).toLocaleString()}</strong>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(invoice.status)} data-testid={`status-invoice-${invoice.id}`}>
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <select
                                value={invoice.status}
                                onChange={(e) => updateInvoiceMutation.mutate({
                                  id: invoice.id,
                                  status: e.target.value,
                                  paidDate: e.target.value === 'paid' ? new Date().toISOString() : undefined
                                })}
                                className="px-2 py-1 border rounded text-sm"
                                data-testid={`select-invoice-status-${invoice.id}`}
                              >
                                <option value="draft">Borrador</option>
                                <option value="sent">Enviada</option>
                                <option value="paid">Pagada</option>
                                <option value="cancelled">Cancelada</option>
                              </select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {((invoicePage - 1) * invoiceLimit) + 1} - {Math.min(invoicePage * invoiceLimit, invoicesData.total)} de {invoicesData.total} facturas
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={invoicePage === 1}
                          onClick={() => setInvoicePage(p => p - 1)}
                          data-testid="button-invoice-prev-page"
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={invoicePage * invoiceLimit >= invoicesData.total}
                          onClick={() => setInvoicePage(p => p + 1)}
                          data-testid="button-invoice-next-page"
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay facturas registradas
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Configuration Tab (Superadmin Only) */}
          {user?.role === 'superadmin' && (
            <TabsContent value="config" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold" data-testid="heading-config">Configuración de Plataforma</h2>
                  <p className="text-sm text-gray-600 mt-1" data-testid="text-config-description">Administra los planes de suscripción y límites de la plataforma</p>
                </div>
              </div>

              {/* Plan Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle data-testid="heading-plan-config">Configuración de Planes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Basic Plan */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Plan Basic</h3>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="basic-price">Precio Mensual (RD$)</Label>
                            <Input
                              id="basic-price"
                              type="number"
                              value={basicPrice}
                              onChange={(e) => setBasicPrice(Number(e.target.value))}
                              data-testid="input-basic-price"
                            />
                          </div>
                          <div>
                            <Label htmlFor="basic-products">Límite de Productos</Label>
                            <Input
                              id="basic-products"
                              type="number"
                              value={basicProducts}
                              onChange={(e) => setBasicProducts(Number(e.target.value))}
                              data-testid="input-basic-products"
                            />
                          </div>
                          <div>
                            <Label htmlFor="basic-images">Límite de Imágenes</Label>
                            <Input
                              id="basic-images"
                              type="number"
                              value={basicImages}
                              onChange={(e) => setBasicImages(Number(e.target.value))}
                              data-testid="input-basic-images"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Professional Plan */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Plan Professional</h3>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="professional-price">Precio Mensual (RD$)</Label>
                            <Input
                              id="professional-price"
                              type="number"
                              value={professionalPrice}
                              onChange={(e) => setProfessionalPrice(Number(e.target.value))}
                              data-testid="input-professional-price"
                            />
                          </div>
                          <div>
                            <Label htmlFor="professional-products">Límite de Productos</Label>
                            <Input
                              id="professional-products"
                              type="number"
                              value={professionalProducts}
                              onChange={(e) => setProfessionalProducts(Number(e.target.value))}
                              data-testid="input-professional-products"
                            />
                          </div>
                          <div>
                            <Label htmlFor="professional-images">Límite de Imágenes</Label>
                            <Input
                              id="professional-images"
                              type="number"
                              value={professionalImages}
                              onChange={(e) => setProfessionalImages(Number(e.target.value))}
                              data-testid="input-professional-images"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enterprise Plan */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Plan Enterprise</h3>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="enterprise-price">Precio Mensual (RD$)</Label>
                            <Input
                              id="enterprise-price"
                              type="number"
                              value={enterprisePrice}
                              onChange={(e) => setEnterprisePrice(Number(e.target.value))}
                              data-testid="input-enterprise-price"
                            />
                          </div>
                          <div>
                            <Label htmlFor="enterprise-products">Límite de Productos</Label>
                            <Input
                              id="enterprise-products"
                              type="number"
                              value={enterpriseProducts}
                              onChange={(e) => setEnterpriseProducts(Number(e.target.value))}
                              placeholder="Ilimitado"
                              data-testid="input-enterprise-products"
                            />
                          </div>
                          <div>
                            <Label htmlFor="enterprise-images">Límite de Imágenes</Label>
                            <Input
                              id="enterprise-images"
                              type="number"
                              value={enterpriseImages}
                              onChange={(e) => setEnterpriseImages(Number(e.target.value))}
                              placeholder="Ilimitado"
                              data-testid="input-enterprise-images"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSavePlatformConfig}
                      disabled={updatePlatformConfigMutation.isPending}
                      data-testid="button-save-config"
                    >
                      {updatePlatformConfigMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Settings className="w-4 h-4 mr-2" />
                          Guardar Configuración
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200" data-testid="card-config-warning">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900" data-testid="heading-config-warning">Precaución</h4>
                      <p className="text-sm text-yellow-800 mt-1" data-testid="text-config-warning">
                        Los cambios en la configuración de planes afectarán a todos los proveedores actuales y futuros. 
                        Asegúrate de revisar cuidadosamente antes de guardar.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
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
