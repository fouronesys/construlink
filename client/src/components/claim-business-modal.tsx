import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface ClaimBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: {
    id: string;
    legalName: string;
    rnc: string;
    location?: string;
  } | null;
  onSuccess?: () => void;
}

export function ClaimBusinessModal({ isOpen, onClose, supplier, onSuccess }: ClaimBusinessModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplier) return;

    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu correo electrónico",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "Error",
        description: "Por favor ingresa un correo electrónico válido",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Por favor explica por qué esta empresa te pertenece",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", `/api/suppliers/${supplier.id}/claim`, {
        email: email.trim(),
        message: message.trim(),
        documentUrls: [],
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al enviar la solicitud");
      }

      toast({
        title: "Solicitud Enviada",
        description: "Tu solicitud de reclamación ha sido enviada. Recibirás una respuesta por correo electrónico.",
      });

      setEmail("");
      setMessage("");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la solicitud",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-claim-business">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Reclamar Esta Empresa
          </DialogTitle>
          <DialogDescription>
            Solicita ser el propietario verificado de este perfil empresarial
          </DialogDescription>
        </DialogHeader>

        {supplier && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="font-semibold text-gray-900">{supplier.legalName}</p>
              <p className="text-sm text-gray-600">RNC: {supplier.rnc}</p>
              {supplier.location && (
                <p className="text-sm text-gray-600">{supplier.location}</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Proceso de Verificación</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Tu solicitud será revisada por nuestro equipo</li>
                    <li>Podríamos solicitar documentación adicional</li>
                    <li>Te enviaremos el estado de tu solicitud por correo electrónico</li>
                  </ul>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">
                  Correo Electrónico <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="mt-2"
                  required
                  data-testid="input-claim-email"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usaremos este correo para notificarte sobre el estado de tu solicitud
                </p>
              </div>

              <div>
                <Label htmlFor="message">
                  Explica por qué esta empresa te pertenece <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ej: Soy el dueño/representante legal de esta empresa..."
                  className="mt-2 min-h-[100px]"
                  required
                  data-testid="textarea-claim-message"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Proporciona detalles que ayuden a verificar tu relación con la empresa
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isSubmitting}
                  data-testid="button-cancel-claim"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                  data-testid="button-submit-claim"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Enviar Solicitud
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
