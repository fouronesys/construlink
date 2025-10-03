import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { loginSchema, type LoginData } from "@shared/schema";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión exitosamente.",
      });
      
      // Invalidate auth queries to trigger refetch
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        // Check for redirect parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const redirectParam = urlParams.get('redirect');
        
        if (redirectParam === 'subscription-selection' && data.user.role === 'supplier') {
          setLocation('/subscription-selection');
        } else {
          // Default redirect based on user role
          if (data.user.role === 'supplier') {
            setLocation('/supplier-dashboard');
          } else if (data.user.role === 'admin' || data.user.role === 'superadmin') {
            setLocation('/admin-panel');
          } else {
            setLocation('/directory');
          }
        }
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Credenciales inválidas. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <Card>
          <CardHeader className="text-center px-4 sm:px-6">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <LogIn className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
              Iniciar Sesión
            </CardTitle>
            <p className="text-gray-600 text-sm sm:text-base">
              Accede a tu cuenta de Construlink
            </p>
          </CardHeader>
          
          <CardContent className="px-4 sm:px-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="tu@email.com"
                          className="text-sm sm:text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="text-sm sm:text-base pr-10"
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
                              <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
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
                  className="w-full text-sm sm:text-base"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                ¿No tienes una cuenta?{" "}
                <button
                  onClick={() => setLocation("/register")}
                  className="font-medium text-primary hover:text-primary/80"
                >
                  Registrarse
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}