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
  onRequestQuote 
}: ProviderProfileModalProps) {
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{provider.legalName}</DialogTitle>
              <DialogDescription className="flex items-center mt-2">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                Proveedor Verificado • RNC: {provider.rnc}
              </DialogDescription>
            </div>
            <Button onClick={() => onRequestQuote(provider.id)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Solicitar Cotización
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating and Location */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {renderStars(Math.floor(provider.averageRating))}
              </div>
              <span className="text-sm text-gray-600">
                {provider.averageRating} ({provider.totalReviews} reseñas)
              </span>
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
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
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button onClick={() => onRequestQuote(provider.id)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Solicitar Cotización
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}