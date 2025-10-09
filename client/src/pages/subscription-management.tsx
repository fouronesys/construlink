import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertCircle, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  XCircle,
  RefreshCcw,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEndDate: string | null;
  paymentGateway: string;
}

interface Supplier {
  id: string;
  legalName: string;
}

const PLAN_NAMES = {
  basic: 'Plan Básico',
  professional: 'Plan Profesional',
  enterprise: 'Plan Empresarial'
};

const PLAN_PRICES = {
  basic: { monthly: 1000, annual: 9600 },
  professional: { monthly: 2500, annual: 24000 },
  enterprise: { monthly: 5000, annual: 48000 }
};

export default function SubscriptionManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState("");
  const [selectedBillingCycle, setSelectedBillingCycle] = useState("monthly");
  const [prorateCalculation, setProrateCalculation] = useState<any>(null);

  // Fetch supplier and subscription data
  const { data: supplier } = useQuery<Supplier>({
    queryKey: ['/api/supplier'],
    enabled: !!user,
  });

  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: ['/api/subscription', supplier?.id],
    enabled: !!supplier?.id,
  });

  // Calculate prorate mutation
  const calculateProrateMutation = useMutation({
    mutationFn: async ({ newPlan, newBillingCycle }: { newPlan: string; newBillingCycle: string }) => {
      if (!subscription) throw new Error("No subscription found");
      const response = await apiRequest("POST", `/api/subscriptions/${subscription.id}/calculate-prorate`, {
        newPlan,
        newBillingCycle
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setProrateCalculation(data.calculation);
      setShowUpgradeDialog(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo calcular el costo del cambio",
        variant: "destructive",
      });
    },
  });

  // Change plan mutation
  const changePlanMutation = useMutation({
    mutationFn: async ({ newPlan, newBillingCycle }: { newPlan: string; newBillingCycle: string }) => {
      if (!subscription) throw new Error("No subscription found");
      const response = await apiRequest("POST", `/api/subscriptions/${subscription.id}/change-plan`, {
        newPlan,
        newBillingCycle
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
      toast({
        title: "¡Plan actualizado!",
        description: "Tu plan ha sido cambiado exitosamente",
      });
      setShowUpgradeDialog(false);
      setProrateCalculation(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cambiar el plan",
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!subscription) throw new Error("No subscription found");
      const response = await apiRequest("POST", `/api/subscriptions/${subscription.id}/cancel`, {
        immediate: false
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
      toast({
        title: "Suscripción cancelada",
        description: data.message,
      });
      setShowCancelDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cancelar la suscripción",
        variant: "destructive",
      });
    },
  });

  // Reactivate subscription mutation
  const reactivateMutation = useMutation({
    mutationFn: async () => {
      if (!subscription) throw new Error("No subscription found");
      const response = await apiRequest("POST", `/api/subscriptions/${subscription.id}/reactivate`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
      toast({
        title: "¡Suscripción reactivada!",
        description: "Tu suscripción ha sido reactivada exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo reactivar la suscripción",
        variant: "destructive",
      });
    },
  });

  const handleCalculateProrate = () => {
    if (!selectedNewPlan) {
      toast({
        title: "Selecciona un plan",
        description: "Debes seleccionar un plan antes de continuar",
        variant: "destructive",
      });
      return;
    }

    calculateProrateMutation.mutate({ 
      newPlan: selectedNewPlan, 
      newBillingCycle: selectedBillingCycle 
    });
  };

  const handleConfirmPlanChange = () => {
    changePlanMutation.mutate({ 
      newPlan: selectedNewPlan, 
      newBillingCycle: selectedBillingCycle 
    });
  };

  if (!user || user.role !== 'supplier') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No tienes una suscripción activa</CardTitle>
            <CardDescription>Selecciona un plan para comenzar</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/subscription-selection'}
              data-testid="button-select-plan"
            >
              Ver Planes Disponibles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPlan = subscription.plan as keyof typeof PLAN_NAMES;
  const billingCycle = (subscription.billingCycle || 'monthly') as 'monthly' | 'annual';
  const isTrialing = subscription.status === 'trialing';
  const isCancelled = subscription.status === 'cancelled';
  const isActive = subscription.status === 'active';

  const daysRemaining = subscription.trialEndDate 
    ? Math.ceil((new Date(subscription.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8" data-testid="subscription-management-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Suscripción</h1>
          <p className="text-gray-600 mt-2">Administra tu plan y facturación</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Subscription */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {PLAN_NAMES[currentPlan]}
                      {isTrialing && <Badge variant="outline">Período de Prueba</Badge>}
                      {isCancelled && <Badge variant="destructive">Cancelado</Badge>}
                      {isActive && <Badge className="bg-emerald-500">Activo</Badge>}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Ciclo de facturación: {billingCycle === 'annual' ? 'Anual' : 'Mensual'}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">
                      RD${PLAN_PRICES[currentPlan][billingCycle].toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      /{billingCycle === 'annual' ? 'año' : 'mes'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isTrialing && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Período de Prueba Activo</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Te quedan {daysRemaining} días de prueba gratuita. 
                          Después se cobrará automáticamente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Inicio del período</p>
                      <p className="font-medium">
                        {subscription.currentPeriodStart 
                          ? new Date(subscription.currentPeriodStart).toLocaleDateString() 
                          : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Próxima renovación</p>
                      <p className="font-medium">
                        {subscription.currentPeriodEnd 
                          ? new Date(subscription.currentPeriodEnd).toLocaleDateString() 
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  {isCancelled ? (
                    <Button
                      onClick={() => reactivateMutation.mutate()}
                      disabled={reactivateMutation.isPending}
                      className="flex-1"
                      data-testid="button-reactivate"
                    >
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Reactivar Suscripción
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelDialog(true)}
                      className="flex-1"
                      data-testid="button-cancel"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancelar Suscripción
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Change Plan Section */}
            {!isCancelled && (
              <Card>
                <CardHeader>
                  <CardTitle>Cambiar de Plan</CardTitle>
                  <CardDescription>
                    Actualiza o cambia tu plan en cualquier momento. El costo se calculará de forma prorrateada.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Seleccionar Plan</label>
                      <Select value={selectedNewPlan} onValueChange={setSelectedNewPlan}>
                        <SelectTrigger data-testid="select-new-plan">
                          <SelectValue placeholder="Selecciona un plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PLAN_NAMES).map(([key, name]) => (
                            <SelectItem key={key} value={key} disabled={key === currentPlan}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Ciclo de Facturación</label>
                      <Select value={selectedBillingCycle} onValueChange={setSelectedBillingCycle}>
                        <SelectTrigger data-testid="select-billing-cycle">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="annual">Anual (Ahorra 20%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleCalculateProrate}
                    disabled={!selectedNewPlan || calculateProrateMutation.isPending}
                    data-testid="button-calculate-prorate"
                  >
                    {calculateProrateMutation.isPending ? "Calculando..." : "Calcular Costo del Cambio"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información Rápida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estado</span>
                  <Badge 
                    variant={isActive ? "default" : isCancelled ? "destructive" : "outline"}
                    data-testid="badge-status"
                  >
                    {isTrialing ? 'Prueba' : isCancelled ? 'Cancelado' : 'Activo'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Gateway de Pago</span>
                  <span className="text-sm font-medium">
                    {subscription.paymentGateway === 'azul' ? 'Azul' : 'Verifone'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Necesitas Ayuda?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Si tienes preguntas sobre tu suscripción o facturación, nuestro equipo está aquí para ayudarte.
                </p>
                <Button variant="outline" className="w-full" data-testid="button-contact-support">
                  Contactar Soporte
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
            <AlertDialogDescription>
              Tu suscripción se cancelará al final del período actual 
              ({subscription?.currentPeriodEnd 
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString() 
                : '-'}). 
              Podrás continuar usando el servicio hasta entonces.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-dialog-cancel">Mantener Suscripción</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-cancel-dialog-confirm"
            >
              {cancelMutation.isPending ? "Cancelando..." : "Confirmar Cancelación"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade/Downgrade Dialog */}
      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {prorateCalculation?.isUpgrade ? (
                <>
                  <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                  Actualizar a {PLAN_NAMES[selectedNewPlan as keyof typeof PLAN_NAMES]}
                </>
              ) : (
                <>
                  <ArrowDownCircle className="w-5 h-5 text-blue-600" />
                  Cambiar a {PLAN_NAMES[selectedNewPlan as keyof typeof PLAN_NAMES]}
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {prorateCalculation && (
                <div className="space-y-3 mt-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Crédito del plan actual:</span>
                      <span className="font-medium">RD${prorateCalculation.creditAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Costo del nuevo plan (prorrateado):</span>
                      <span className="font-medium">RD${(prorateCalculation.creditAmount + prorateCalculation.amountToPay).toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>{prorateCalculation.isUpgrade ? 'Monto a pagar ahora:' : 'Crédito aplicado:'}</span>
                      <span className={prorateCalculation.isUpgrade ? 'text-emerald-600' : 'text-blue-600'}>
                        RD${prorateCalculation.amountToPay.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    El cambio será efectivo inmediatamente. Tienes {prorateCalculation.daysRemaining} días restantes en tu período actual.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-upgrade-dialog-cancel">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPlanChange}
              disabled={changePlanMutation.isPending}
              data-testid="button-upgrade-dialog-confirm"
            >
              {changePlanMutation.isPending ? "Procesando..." : "Confirmar Cambio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
