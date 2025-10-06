import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const reviewSchema = z.object({
  rating: z.number().min(1, "Debes seleccionar una calificación").max(5),
  comment: z.string().max(500, "El comentario no puede exceder 500 caracteres").optional(),
  clientName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  clientEmail: z.string().email("Email inválido"),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  supplierId: string;
  onSuccess?: () => void;
  isAuthenticated: boolean;
  userName?: string;
  userEmail?: string;
}

export function ReviewForm({
  supplierId,
  onSuccess,
  isAuthenticated,
  userName,
  userEmail,
}: ReviewFormProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const { toast } = useToast();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
      clientName: userName || "",
      clientEmail: userEmail || "",
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      return await apiRequest("POST", `/api/suppliers/${supplierId}/reviews`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", supplierId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      
      toast({
        title: "¡Reseña enviada!",
        description: "Gracias por compartir tu opinión.",
      });
      
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la reseña. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReviewFormData) => {
    createReviewMutation.mutate(data);
  };

  const rating = form.watch("rating");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-review">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Calificación *</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => field.onChange(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
                      data-testid={`star-${star}`}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isAuthenticated && (
          <>
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Tu nombre completo"
                      data-testid="input-clientName"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="tu@email.com"
                      data-testid="input-clientEmail"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comentario (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Comparte tu experiencia con este proveedor..."
                  rows={4}
                  maxLength={500}
                  data-testid="input-comment"
                />
              </FormControl>
              <div className="text-xs text-gray-500 text-right">
                {field.value?.length || 0}/500
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={createReviewMutation.isPending}
          className="w-full"
          data-testid="button-submit-review"
        >
          {createReviewMutation.isPending ? "Enviando..." : "Enviar Reseña"}
        </Button>
      </form>
    </Form>
  );
}
