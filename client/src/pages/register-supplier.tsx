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
import SubscriptionPlans from "@/components/subscription-plans";
import VerifonePayment from "@/components/verifone-payment";
import { CreditCard, CheckCircle, Info, ArrowLeft } from "lucide-react";

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
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
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
    mutationFn: async (plan: string) => {
      const response = await apiRequest("POST", "/api/create-subscription", { plan });
      return response.json();
    },
    onSuccess: (data) => {
      setSubscriptionData(data);
      setCurrentStep(4);
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
              <Button onClick={() => setLocation("/login")}>
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Progress Indicator */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm hidden sm:block">Información</span>
              <span className="ml-1 text-xs sm:hidden">Info</span>
            </div>
            <div className="w-2 sm:w-4 h-px bg-gray-300"></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm hidden sm:block">Revisión</span>
              <span className="ml-1 text-xs sm:hidden">Rev</span>
            </div>
            <div className="w-2 sm:w-4 h-px bg-gray-300"></div>
            <div className={`flex items-center ${currentStep >= 3 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep >= 3 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm hidden sm:block">Plan</span>
              <span className="ml-1 text-xs sm:hidden">Plan</span>
            </div>
            <div className="w-2 sm:w-4 h-px bg-gray-300"></div>
            <div className={`flex items-center ${currentStep >= 4 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep >= 4 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                4
              </div>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm hidden sm:block">Pago</span>
              <span className="ml-1 text-xs sm:hidden">Pago</span>
            </div>
            <div className="w-2 sm:w-4 h-px bg-gray-300"></div>
            <div className={`flex items-center ${currentStep >= 5 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${currentStep >= 5 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                5
              </div>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm hidden sm:block">Fin</span>
              <span className="ml-1 text-xs sm:hidden">Fin</span>
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {registerMutation.isPending ? "Registrando..." : "Continuar"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Review Information */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Revisar Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Información de la Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Nombre Legal:</p>
                    <p className="font-medium">{form.getValues("legalName")}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">RNC:</p>
                    <p className="font-medium">{form.getValues("rnc")}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Teléfono:</p>
                    <p className="font-medium">{form.getValues("phone")}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ubicación:</p>
                    <p className="font-medium">{form.getValues("location")}</p>
                  </div>
                  {form.getValues("website") && (
                    <div>
                      <p className="text-gray-600">Sitio Web:</p>
                      <p className="font-medium">{form.getValues("website")}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Especialidades:</p>
                    <p className="font-medium">{form.getValues("specialties").join(", ")}</p>
                  </div>
                </div>
                {form.getValues("description") && (
                  <div className="mt-4">
                    <p className="text-gray-600">Descripción:</p>
                    <p className="font-medium text-sm">{form.getValues("description")}</p>
                  </div>
                )}
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">RNC Validado</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Tu RNC ha sido verificado exitosamente con la DGII
                </p>
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button 
                  onClick={() => setCurrentStep(3)}
                  className="flex-1"
                >
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select Subscription Plan */}
        {currentStep === 3 && (
          <Card>
            <CardContent className="p-8">
              <SubscriptionPlans
                selectedPlan={selectedPlan}
                onPlanSelect={setSelectedPlan}
                onContinue={() => createSubscriptionMutation.mutate(selectedPlan)}
              />
              
              <div className="flex justify-center mt-8">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="mr-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Payment */}
        {currentStep === 4 && subscriptionData && (
          <Card>
            <CardHeader>
              <CardTitle>Configurar Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <VerifonePayment
                subscriptionId={subscriptionData.subscriptionId}
                amount={subscriptionData.amount || 1000}

                onSuccess={() => setCurrentStep(5)}
                onCancel={() => setCurrentStep(3)}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 5: Confirmation */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                ¡Registro Completado!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                Tu solicitud ha sido enviada exitosamente y está siendo revisada por nuestro equipo administrativo.
              </p>
              <p className="text-sm text-gray-500">
                Te notificaremos por email cuando tu cuenta sea aprobada.
              </p>
              <Button 
                onClick={() => setLocation('/dashboard')}
                className="w-full"
              >
                Ir al Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}



export default function RegisterSupplier() {
  return <RegistrationForm />;
}
