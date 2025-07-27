import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, MessageSquare, Eye, CheckCircle } from "lucide-react";

interface Provider {
  id: string;
  legalName: string;
  rnc: string;
  specialties: string[];
  location: string;
  description: string;
  averageRating: number;
  totalReviews: number;
}

interface ProviderCardProps {
  provider: Provider;
  onViewProfile: (provider: Provider) => void;
  onRequestQuote: (providerId: string) => void;
}

export function ProviderCard({ provider, onViewProfile, onRequestQuote }: ProviderCardProps) {
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
    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
              {provider.legalName}
            </CardTitle>
            <div className="flex items-center mt-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
              RNC: {provider.rnc}
            </div>
          </div>
        </div>
        
        <div className="flex items-center mt-3">
          <div className="flex items-center mr-3">
            {renderStars(Math.floor(provider.averageRating))}
          </div>
          <span className="text-sm text-gray-600">
            {provider.averageRating} ({provider.totalReviews} reseñas)
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap gap-1">
              {provider.specialties.slice(0, 3).map((specialty, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {provider.specialties.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{provider.specialties.length - 3} más
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm line-clamp-1">{provider.location}</span>
          </div>

          <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
            {provider.description}
          </p>
        </div>

        <div className="flex gap-2 mt-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewProfile(provider)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Perfil
          </Button>
          <Button 
            size="sm" 
            onClick={() => onRequestQuote(provider.id)}
            className="flex-1"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Cotizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}