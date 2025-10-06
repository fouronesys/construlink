import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const responseSchema = z.object({
  responseText: z
    .string()
    .min(10, "La respuesta debe tener al menos 10 caracteres")
    .max(1000, "La respuesta no puede exceder 1000 caracteres"),
});

type ResponseFormData = z.infer<typeof responseSchema>;

interface ReviewResponseFormProps {
  reviewId: string;
  supplierId: string;
  existingResponse?: {
    id: string;
    responseText: string;
  } | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewResponseForm({
  reviewId,
  supplierId,
  existingResponse,
  onSuccess,
  onCancel,
}: ReviewResponseFormProps) {
  const { toast } = useToast();

  const form = useForm<ResponseFormData>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      responseText: existingResponse?.responseText || "",
    },
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (data: ResponseFormData) => {
      if (existingResponse) {
        return await apiRequest(
          "PUT",
          `/api/reviews/${reviewId}/response`,
          data
        );
      } else {
        return await apiRequest("POST", `/api/reviews/${reviewId}/response`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            Array.isArray(queryKey) &&
            queryKey[0] === "/api/suppliers" &&
            queryKey[1] === supplierId &&
            queryKey[2] === "reviews"
          );
        }
      });

      toast({
        title: existingResponse ? "Respuesta actualizada" : "Respuesta enviada",
        description: existingResponse
          ? "Tu respuesta ha sido actualizada."
          : "Gracias por responder a la reseña.",
      });

      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la respuesta. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!existingResponse) return;
      return await apiRequest(
        "DELETE",
        `/api/reviews/${reviewId}/response`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            Array.isArray(queryKey) &&
            queryKey[0] === "/api/suppliers" &&
            queryKey[1] === supplierId &&
            queryKey[2] === "reviews"
          );
        }
      });

      toast({
        title: "Respuesta eliminada",
        description: "Tu respuesta ha sido eliminada.",
      });

      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la respuesta.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResponseFormData) => {
    createOrUpdateMutation.mutate(data);
  };

  const handleDelete = () => {
    if (confirm("¿Estás seguro de que quieres eliminar tu respuesta?")) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="responseText"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-blue-900">
                  {existingResponse ? "Editar respuesta" : "Responder como proveedor"}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Escribe tu respuesta a esta reseña..."
                    className="resize-none bg-white"
                    rows={3}
                    {...field}
                    data-testid={`input-response-${reviewId}`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={createOrUpdateMutation.isPending}
              data-testid={`button-submit-response-${reviewId}`}
            >
              {createOrUpdateMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {existingResponse ? "Actualizar" : "Enviar"} Respuesta
            </Button>

            {existingResponse && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                data-testid={`button-delete-response-${reviewId}`}
              >
                {deleteMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Eliminar
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              data-testid={`button-cancel-response-${reviewId}`}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
