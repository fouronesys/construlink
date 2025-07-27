import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/navigation";
import { CreditCard, CheckCircle, Info } from "lucide-react";
// Removed Stripe imports as we're now using Verifone

const supplierSchema = z.object({
  legalName: z.string().min(1, "Nombre legal es requerido"),
  rnc: z.string().min(1, "RNC es requerido"),
  phone: z.string().min(1, "Teléfono es requerido"),
  location: z.string().min(1, "Ubicación es requerida"),
  description: z.string().optional(),
  website: z.string().optional(),
  specialties: z.array(z.string()).min(1, "Selecciona al menos una especialidad").max(3, "Máximo 3 especialidades"),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

const specialties = [
  "Fontanería",
  "Eléctricos", 
  "Concreto",
  "Estructura de Acero",
  "Techado",
  "Pintura",
];

function RegistrationForm() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [rncValidation, setRncValidation] = useState<{ valid: boolean; message: string } | null>(null);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      legalName: "",
      rnc: "",
      phone: "",
      location: "",
      description: "",
      website: "",
      specialties: [],
    },
  });

  const validateRncMutation = useMutation({
    mutationFn: async (rnc: string) => {
      const response = await apiRequest("POST", "/api/validate-rnc", { rnc });
      return response.json();
    },
    onSuccess: (data) => {
      setRncValidation({
        valid: data.valid || false,
        message: data.message || (data.valid ? "RNC válido" : "RNC no válido"),
      });
    },
    onError: (error) => {
      setRncValidation({
        valid: false,
        message: "Error al validar RNC",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const response = await apiRequest("POST", "/api/suppliers/register", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registro exitoso",
        description: "Tu solicitud ha sido enviada para revisión administrativa.",
      });
      setCurrentStep(2);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Debes iniciar sesión para registrarte como proveedor.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "Error al registrar proveedor. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/create-subscription");
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentStep(3);
      // Store client secret for payment
      sessionStorage.setItem('clientSecret', data.clientSecret);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al crear suscripción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleRncValidation = async () => {
    const rnc = form.getValues("rnc");
    if (rnc) {
      validateRncMutation.mutate(rnc);
    }
  };

  const onSubmit = async (data: SupplierFormData) => {
    if (!rncValidation?.valid) {
      toast({
        title: "RNC no válido",
        description: "Por favor valida tu RNC antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate(data);
  };

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    const currentSpecialties = form.getValues("specialties");
    if (checked) {
      if (currentSpecialties.length < 3) {
        form.setValue("specialties", [...currentSpecialties, specialty]);
      }
    } else {
      form.setValue("specialties", currentSpecialties.filter(s => s !== specialty));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Inicia Sesión Requerido</h2>
              <p className="text-gray-600 mb-6">
                Debes iniciar sesión para registrarte como proveedor.
              </p>
              <Button onClick={() => window.location.href = "/api/login"}>
                Iniciar Sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 hidden sm:block">Información Básica</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 hidden sm:block">Suscripción</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className={`flex items-center ${currentStep >= 3 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 hidden sm:block">Pago</span>
            </div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Registro de Proveedor</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="legalName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Legal de la Empresa *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Constructora ABC S.R.L." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rnc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RNC *</FormLabel>
                          <FormControl>
                            <div className="flex space-x-2">
                              <Input placeholder="1-31-85420-1" {...field} />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleRncValidation}
                                disabled={validateRncMutation.isPending || !field.value}
                              >
                                {validateRncMutation.isPending ? "Validando..." : "Validar"}
                              </Button>
                            </div>
                          </FormControl>
                          {rncValidation && (
                            <p className={`text-sm ${rncValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                              {rncValidation.message}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono Corporativo *</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (809) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ubicación *</FormLabel>
                          <FormControl>
                            <Input placeholder="Santo Domingo, DN" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sitio Web</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción de la Empresa</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe tu empresa, experiencia y servicios..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialties"
                    render={() => (
                      <FormItem>
                        <FormLabel>Especialidades (máx. 3) *</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {specialties.map((specialty) => (
                            <FormItem key={specialty} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={form.getValues("specialties").includes(specialty)}
                                  onCheckedChange={(checked) => handleSpecialtyChange(specialty, checked as boolean)}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {specialty}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={registerMutation.isPending || !rncValidation?.valid}
                  >
                    {registerMutation.isPending ? "Registrando..." : "Continuar al Pago"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Subscription */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Suscripción Mensual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium text-gray-900">Plan Proveedor Verificado</h5>
                    <p className="text-sm text-gray-600">Acceso completo a la plataforma</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">RD$1,000</div>
                    <div className="text-sm text-gray-600">por mes</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex">
                  <Info className="text-blue-400 mt-0.5 mr-3" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Período de prueba de 7 días gratis</p>
                    <p>No se cobrará hasta después del período de prueba. Puedes cancelar en cualquier momento.</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => createSubscriptionMutation.mutate()}
                disabled={createSubscriptionMutation.isPending}
                className="w-full"
              >
                {createSubscriptionMutation.isPending ? "Creando suscripción..." : "Proceder al Pago"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Payment */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Información de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ 
                clientSecret: sessionStorage.getItem('clientSecret') || '' 
              }}>
                <PaymentForm />
              </Elements>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/dashboard',
      },
    });

    if (error) {
      toast({
        title: "Error en el pago",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "¡Registro completado!",
        description: "Tu solicitud está siendo revisada por nuestro equipo.",
      });
      setLocation('/dashboard');
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border border-gray-300 rounded-md">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-emerald text-emerald-foreground hover:bg-emerald/90"
      >
        {isProcessing ? "Procesando..." : "Completar Pago"}
      </Button>
    </form>
  );
}

export default function RegisterSupplier() {
  return (
    <Elements stripe={stripePromise}>
      <RegistrationForm />
    </Elements>
  );
}
