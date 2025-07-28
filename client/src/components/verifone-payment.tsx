import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CreditCard, Shield, CheckCircle } from "lucide-react";

interface VerifonePaymentProps {
  subscriptionId: string;
  amount: number;
  trialEndDate?: Date;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function VerifonePayment({
  subscriptionId,
  amount,
  trialEndDate,
  onSuccess,
  onCancel
}: VerifonePaymentProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/process-verifone-payment", {
        subscriptionId,
        paymentMethod,
        amount
      });
    },
    onSuccess: (data) => {
      toast({
        title: "¡Pago Exitoso!",
        description: "Tu suscripción ha sido activada. Redirigiendo al panel...",
      });
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/supplier-dashboard';
      }, 2000);
    },
    onError: (error: any) => {
      console.error("Payment error:", error);
      
      // Extract error message from response
      let errorMessage = "No se pudo procesar el pago. Por favor, inténtalo de nuevo.";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error en el Pago",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setPaymentMethod(prev => ({
      ...prev,
      [field]: value
    }));
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
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const isFormValid = () => {
    return paymentMethod.cardNumber.replace(/\s/g, '').length >= 13 &&
           paymentMethod.expiryDate.length === 5 &&
           paymentMethod.cvv.length >= 3 &&
           paymentMethod.cardName.trim().length > 0;
  };

  return (
    <div className="w-full space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Payment Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-blue-600 flex-shrink-0" />
            <CardTitle className="text-sm sm:text-base lg:text-lg text-blue-800">Suscripción Mensual</CardTitle>
          </div>
          <CardDescription className="text-blue-700 text-xs sm:text-sm lg:text-base leading-relaxed">
            Se cobrará RD${(amount || 0).toLocaleString()} mensualmente a partir de hoy.
            <br className="hidden sm:block" />
            Puedes cancelar en cualquier momento desde tu panel de control.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader className="px-3 sm:px-4 lg:px-6 pb-2 sm:pb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-blue-600 flex-shrink-0" />
            <CardTitle className="text-sm sm:text-base lg:text-lg">Información de Pago</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm lg:text-base">
            Configurar método de pago para la suscripción mensual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 lg:px-6">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="cardName" className="text-xs sm:text-sm font-medium">Nombre en la Tarjeta</Label>
            <Input
              id="cardName"
              placeholder="Juan Pérez"
              value={paymentMethod.cardName}
              onChange={(e) => handleInputChange('cardName', e.target.value)}
              className="text-xs sm:text-sm lg:text-base h-9 sm:h-10"
            />
          </div>
          
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="cardNumber" className="text-xs sm:text-sm font-medium">Número de Tarjeta</Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={paymentMethod.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
              maxLength={19}
              className="text-xs sm:text-sm lg:text-base h-9 sm:h-10"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="expiryDate" className="text-xs sm:text-sm font-medium">Fecha de Vencimiento</Label>
              <Input
                id="expiryDate"
                placeholder="MM/AA"
                value={paymentMethod.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                maxLength={5}
                className="text-xs sm:text-sm lg:text-base h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="cvv" className="text-xs sm:text-sm font-medium">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                value={paymentMethod.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                maxLength={4}
                className="text-xs sm:text-sm lg:text-base h-9 sm:h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Cards Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-3 sm:pt-4 lg:pt-6 px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-blue-700">
              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="font-medium">Tarjetas de Prueba:</span>
            </div>
            <div className="text-xs text-blue-600 space-y-1">
              <div><strong>Éxito:</strong> 4111 1111 1111 1111</div>
              <div><strong>Declinada:</strong> 4000 0000 0000 0002</div>
              <div><strong>Sin fondos:</strong> 4000 0000 0000 0119</div>
              <div className="text-blue-500">Fecha: cualquier fecha futura, CVV: 123</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="pt-3 sm:pt-4 lg:pt-6 px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="leading-tight">Tus datos están protegidos con encriptación SSL de 256 bits</span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 pt-1 sm:pt-2">
        <Button
          onClick={() => onCancel?.()}
          variant="outline"
          className="w-full sm:flex-1 text-xs sm:text-sm lg:text-base h-9 sm:h-10"
          disabled={paymentMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          onClick={() => paymentMutation.mutate()}
          disabled={!isFormValid() || paymentMutation.isPending}
          className="w-full sm:flex-1 text-xs sm:text-sm lg:text-base h-9 sm:h-10"
        >
          {paymentMutation.isPending ? (
            <>
              <Loader2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CreditCard className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Activar Suscripción
            </>
          )}
        </Button>
      </div>
    </div>
  );
}