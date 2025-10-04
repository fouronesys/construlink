import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle, 
  MessageSquare,
  Building2,
  FileText
} from "lucide-react";

interface Provider {
  id: string;
  legalName: string;
  rnc: string;
  specialties: string[];
  location: string;
  description: string;
  averageRating: number;
  totalReviews: number;
  phone?: string;
  email?: string;
  website?: string;
}

interface ProviderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: Provider | null;
  onRequestQuote: (providerId: string) => void;
  onClaimBusiness?: (supplierId: string) => void;
}

const mockReviews = [
  {
    id: '1',
    author: 'María González',
    rating: 5,
    comment: 'Excelente trabajo, muy profesionales y puntuales. Recomendado 100%.',
    date: '2024-01-15',
    project: 'Construcción de casa'
  },
  {
    id: '2',
    author: 'Carlos Rodríguez',
    rating: 5,
    comment: 'Trabajo de primera calidad, cumplieron con todos los plazos acordados.',
    date: '2024-01-10',
    project: 'Instalación eléctrica'
  },
  {
    id: '3',
    author: 'Ana Martínez',
    rating: 4,
    comment: 'Buenos profesionales, solo pequeños detalles en la comunicación.',
    date: '2024-01-05',
    project: 'Remodelación baño'
  }
];

export function ProviderProfileModal({ 
  isOpen, 
  onClose, 
  provider, 
  onRequestQuote,
  onClaimBusiness
}: ProviderProfileModalProps) {
  const [canClaim, setCanClaim] = useState(false);

  useEffect(() => {
    const checkClaimStatus = async () => {
      if (!provider?.id || !onClaimBusiness) return;
      
      try {
        const response = await fetch(`/api/suppliers/${provider.id}/claim-status`);
        if (!response.ok) return;
        const data = await response.json();
        setCanClaim(data.canBeClaimed);
      } catch (error) {
        console.error("Error checking claim status:", error);
      }
    };

    if (provider?.id) {
      checkClaimStatus();
    }
  }, [provider?.id, onClaimBusiness]);

  if (!provider) return null;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-xl sm:text-2xl">{provider.legalName}</DialogTitle>
              <DialogDescription className="flex items-center mt-2 text-xs sm:text-sm">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                Proveedor Verificado • RNC: {provider.rnc}
              </DialogDescription>
            </div>
            <Button 
              onClick={() => onRequestQuote(provider.id)}
              className="w-full sm:w-auto text-sm"
              size="sm"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Solicitar Cotización
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating and Location */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {renderStars(Math.floor(provider.averageRating))}
              </div>
              <span className="text-xs sm:text-sm text-gray-600">
                {provider.averageRating} ({provider.totalReviews} reseñas)
              </span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              {provider.location}
            </div>
          </div>

          {/* Specialties */}
          <div>
            <h3 className="font-semibold mb-2">Especialidades</h3>
            <div className="flex flex-wrap gap-2">
              {provider.specialties.map((specialty, index) => (
                <Badge key={index} variant="secondary">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Acerca de la Empresa</h3>
            <p className="text-gray-700 leading-relaxed">{provider.description}</p>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {provider.phone && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-3 text-gray-500" />
                  <span>{provider.phone}</span>
                </div>
              )}
              {provider.email && (
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-3 text-gray-500" />
                  <span>{provider.email}</span>
                </div>
              )}
              {provider.website && (
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-3 text-gray-500" />
                  <a 
                    href={provider.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {provider.website}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          <div>
            <h3 className="font-semibold mb-4">Reseñas de Clientes</h3>
            <div className="space-y-4">
              {mockReviews.slice(0, 3).map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{review.author}</span>
                          <div className="flex items-center">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{review.project}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.date).toLocaleDateString('es-DO')}
                      </span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-4 border-t">
            <div>
              {canClaim && onClaimBusiness && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => onClaimBusiness(provider.id)}
                  className="text-gray-600 hover:text-gray-900 px-0"
                  data-testid="button-claim-business"
                >
                  <Building2 className="w-3.5 h-3.5 mr-1.5" />
                  ¿Es tu empresa?
                </Button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 w-full sm:w-auto">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cerrar
              </Button>
              <Button onClick={() => onRequestQuote(provider.id)} className="w-full sm:w-auto">
                <MessageSquare className="w-4 h-4 mr-2" />
                Solicitar Cotización
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}