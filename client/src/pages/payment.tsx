import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const subscriptionPlans = {
  basic: { name: "Plan Básico", price: 1000 },
  professional: { name: "Plan Profesional", price: 2500 },
  enterprise: { name: "Plan Empresarial", price: 5000 }
};

export default function Payment() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  const urlParams = new URLSearchParams(window.location.search);
  const subscriptionId = urlParams.get('subscriptionId');
  const planId = urlParams.get('planId') as keyof typeof subscriptionPlans;
  
  useEffect(() => {
    if (!user || user.role !== 'supplier' || !subscriptionId || !planId) {
      navigate('/');
    }
  }, [user, navigate, subscriptionId, planId]);

  const plan = subscriptionPlans[planId];
  if (!plan) {
    navigate('/');
    return null;
  }

  const handleInputChange = (field: keyof typeof paymentData, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) { // 16 digits + 3 spaces
      handleInputChange('cardNumber', formatted);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) { // MM/YY
      handleInputChange('expiryDate', formatted);
    }
  };

  const validateForm = () => {
    const { cardNumber, expiryDate, cvv, cardholderName } = paymentData;
    
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      toast({
        title: "Error",
        description: "Número de tarjeta inválido",
        variant: "destructive",
      });
      return false;
    }
    
    if (!expiryDate || expiryDate.length < 5) {
      toast({
        title: "Error",
        description: "Fecha de vencimiento inválida",
        variant: "destructive",
      });
      return false;
    }
    
    if (!cvv || cvv.length < 3) {
      toast({
        title: "Error",
        description: "CVV inválido",
        variant: "destructive",
      });
      return false;
    }
    
    if (!cardholderName.trim()) {
      toast({
        title: "Error",
        description: "Nombre del titular requerido",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/process-verifone-payment", {
        subscriptionId,
        paymentMethod: {
          cardNumber: paymentData.cardNumber.replace(/\s/g, ''),
          expiryDate: paymentData.expiryDate,
          cvv: paymentData.cvv,
          cardName: paymentData.cardholderName,
        },
        amount: plan.price
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "¡Pago exitoso!",
          description: `Tu suscripción al ${plan.name} ha sido activada.`,
        });
        navigate('/supplier-dashboard');
      } else {
        toast({
          title: "Error en el pago",
          description: result.message || "El pago no pudo ser procesado",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: "Error al procesar el pago. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/subscription-selection')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a planes
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Completar Pago
          </h1>
          <p className="text-gray-600">
            Procesar pago para {plan.name} - RD${plan.price.toLocaleString()}/mes
          </p>
        </div>

        <div className="space-y-8">
          {/* Plan Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Resumen del Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <p className="text-gray-600">Facturación mensual</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">RD${plan.price.toLocaleString()}</p>
                  <p className="text-gray-600">por mes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Información de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cardholderName">Nombre del Titular</Label>
                <Input
                  id="cardholderName"
                  placeholder="Nombre completo como aparece en la tarjeta"
                  value={paymentData.cardholderName}
                  onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">Número de Tarjeta</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={paymentData.cardNumber}
                  onChange={handleCardNumberChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Fecha de Vencimiento</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={paymentData.expiryDate}
                    onChange={handleExpiryChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={paymentData.cvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value.length <= 4) {
                        handleInputChange('cvv', value);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <p className="text-blue-800 text-sm font-medium">
                    Pago seguro procesado por Verifone
                  </p>
                </div>
                <p className="text-blue-700 text-xs mt-1">
                  Tu información de pago está protegida con encriptación de nivel bancario.
                </p>
              </div>

              <Button 
                onClick={handlePayment}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? "Procesando pago..." : `Pagar RD$${plan.price.toLocaleString()}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}