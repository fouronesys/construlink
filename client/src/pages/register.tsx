import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { registerSchema, type RegisterData } from "@shared/schema";
import { Eye, EyeOff, UserPlus, LogIn, Building, CheckCircle, AlertCircle } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rncValidation, setRncValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    companyName?: string;
    error?: string;
  }>({ isValidating: false, isValid: null });

  const form = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: "client",
      rnc: "",
      legalName: "",
      phone: "",
      location: "",
    },
  });

  const validateRncMutation = useMutation({
    mutationFn: async (rnc: string) => {
      const response = await fetch(`https://fouronerncvalidator.onrender.com/validate/${rnc}`);
      if (!response.ok) {
        throw new Error('Error validating RNC');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        setRncValidation({
          isValidating: false,
          isValid: true,
          companyName: data.companyName || data.name,
        });
        // Auto-fill company name if available
        if (data.companyName || data.name) {
          form.setValue('legalName', data.companyName || data.name);
        }
      } else {
        setRncValidation({
          isValidating: false,
          isValid: false,
          error: 'RNC no válido o no encontrado',
        });
      }
    },
    onError: () => {
      setRncValidation({
        isValidating: false,
        isValid: false,
        error: 'Error al validar RNC. Inténtalo de nuevo.',
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      const role = form.getValues("role");
      
      if (role === "supplier") {
        toast({
          title: "¡Registro exitoso!",
          description: "Ahora selecciona tu plan de suscripción.",
        });
        // Redirect to login first, then to subscription selection
        setLocation('/login?redirect=subscription-selection');
      } else {
        toast({
          title: "¡Registro exitoso!",
          description: "Tu cuenta ha sido creada. Ya puedes iniciar sesión.",
        });
        setLocation('/login');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error en el registro",
        description: error.message || "Error al crear tu cuenta. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const validateRnc = (rnc: string) => {
    if (rnc.length >= 9) {
      setRncValidation({ isValidating: true, isValid: null });
      validateRncMutation.mutate(rnc);
    } else {
      setRncValidation({ isValidating: false, isValid: null });
    }
  };

  const onSubmit = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <Card>
          <CardHeader className="text-center px-4 sm:px-6">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
              Crear Cuenta
            </CardTitle>
            <p className="text-gray-600 text-sm sm:text-base">
              Únete a la red de Proveedores RD
            </p>
          </CardHeader>
          
          <CardContent className="px-4 sm:px-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan" className="text-sm sm:text-base" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">Apellido</FormLabel>
                        <FormControl>
                          <Input placeholder="Pérez" className="text-sm sm:text-base" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Supplier-specific fields */}
                {form.watch("role") === "supplier" && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Building className="h-4 w-4" />
                      <span className="font-medium">Información de Empresa</span>
                    </div>

                    <FormField
                      control={form.control}
                      name="rnc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RNC (Registro Nacional de Contribuyentes)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field} 
                                placeholder="Ej: 131789610"
                                onChange={(e) => {
                                  const rnc = e.target.value.replace(/\D/g, '');
                                  field.onChange(rnc);
                                  validateRnc(rnc);
                                }}
                              />
                              {rncValidation.isValidating && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                                </div>
                              )}
                              {rncValidation.isValid === true && (
                                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                              )}
                              {rncValidation.isValid === false && (
                                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </FormControl>
                          {rncValidation.error && (
                            <p className="text-sm text-red-600">{rncValidation.error}</p>
                          )}
                          {rncValidation.isValid === true && (
                            <p className="text-sm text-green-600">RNC válido</p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="legalName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Razón Social</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nombre legal de la empresa" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono de Empresa</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ej: (809) 123-4567" />
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
                          <FormLabel>Ubicación</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona tu provincia" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Santo Domingo">Santo Domingo</SelectItem>
                                <SelectItem value="Santiago">Santiago</SelectItem>
                                <SelectItem value="La Vega">La Vega</SelectItem>
                                <SelectItem value="San Cristóbal">San Cristóbal</SelectItem>
                                <SelectItem value="Puerto Plata">Puerto Plata</SelectItem>
                                <SelectItem value="San Pedro de Macorís">San Pedro de Macorís</SelectItem>
                                <SelectItem value="La Romana">La Romana</SelectItem>
                                <SelectItem value="Barahona">Barahona</SelectItem>
                                <SelectItem value="Moca">Moca</SelectItem>
                                <SelectItem value="Bani">Bani</SelectItem>
                                <SelectItem value="Otra">Otra</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="tu@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cuenta</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo de cuenta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="client">Cliente</SelectItem>
                          <SelectItem value="supplier">Proveedor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes una cuenta?{" "}
                <button
                  onClick={() => setLocation("/login")}
                  className="font-medium text-primary hover:text-primary/80"
                >
                  Iniciar Sesión
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}