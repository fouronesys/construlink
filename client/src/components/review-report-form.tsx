import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";

const reportSchema = z.object({
  reason: z.enum(["spam", "inappropriate", "offensive", "fake", "other"], {
    required_error: "Debes seleccionar una razón",
  }),
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  reporterEmail: z.string().email("Email inválido").optional().or(z.literal("")),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReviewReportFormProps {
  reviewId: string;
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  userEmail?: string;
}

const reasonLabels: Record<string, string> = {
  spam: "Spam o publicidad no deseada",
  inappropriate: "Contenido inapropiado",
  offensive: "Lenguaje ofensivo o abusivo",
  fake: "Reseña falsa o fraudulenta",
  other: "Otra razón",
};

export function ReviewReportForm({
  reviewId,
  isOpen,
  onClose,
  isAuthenticated,
  userEmail,
}: ReviewReportFormProps) {
  const { toast } = useToast();

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reason: undefined,
      description: "",
      reporterEmail: userEmail || "",
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      return await apiRequest("POST", `/api/reviews/${reviewId}/reports`, data);
    },
    onSuccess: () => {
      toast({
        title: "Reporte enviado",
        description: "Gracias por ayudarnos a mantener la calidad de las reseñas. Revisaremos tu reporte pronto.",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el reporte. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReportFormData) => {
    reportMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Reportar Reseña
          </DialogTitle>
          <DialogDescription>
            Si crees que esta reseña infringe nuestras políticas, por favor repórtala. Revisaremos tu solicitud lo antes posible.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón del reporte *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-report-reason">
                        <SelectValue placeholder="Selecciona una razón" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(reasonLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Por favor, proporciona más detalles sobre el problema..."
                      className="resize-none"
                      rows={4}
                      {...field}
                      data-testid="input-report-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isAuthenticated && (
              <FormField
                control={form.control}
                name="reporterEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tu email (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        {...field}
                        data-testid="input-reporter-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={reportMutation.isPending}
                data-testid="button-cancel-report"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={reportMutation.isPending}
                data-testid="button-submit-report"
              >
                {reportMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Enviar Reporte
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
