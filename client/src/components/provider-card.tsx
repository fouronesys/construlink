import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, MessageSquare, Eye, CheckCircle, Building2 } from "lucide-react";

interface Provider {
  id: string;
  legalName: string;
  rnc: string;
  specialties: string[];
  location: string;
  description: string;
  averageRating: number;
  totalReviews: number;
  isClaimed?: boolean;
}

interface ProviderCardProps {
  provider: Provider;
  onViewProfile: (provider: Provider) => void;
  onRequestQuote: (providerId: string) => void;
  onClaimBusiness?: (providerId: string) => void;
}

export function ProviderCard({ provider, onViewProfile, onRequestQuote, onClaimBusiness }: ProviderCardProps) {
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
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
              {provider.legalName}
            </CardTitle>
            <div className="flex items-center mt-2 text-xs sm:text-sm text-gray-600">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 mr-1 flex-shrink-0" />
              RNC: {provider.rnc}
            </div>
          </div>
          {!provider.isClaimed && onClaimBusiness && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClaimBusiness(provider.id);
              }}
              className="text-xs text-gray-500 hover:text-blue-600 h-7 px-2 ml-2"
              data-testid={`button-claim-${provider.id}`}
            >
              <Building2 className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">¿Es tu empresa?</span>
            </Button>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center mt-3 gap-1 sm:gap-0">
          <div className="flex items-center sm:mr-3">
            {renderStars(Math.floor(provider.averageRating))}
          </div>
          <span className="text-xs sm:text-sm text-gray-600">
            {provider.averageRating} ({provider.totalReviews} reseñas)
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3 sm:space-y-4">
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
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
            <span className="text-xs sm:text-sm line-clamp-1">{provider.location}</span>
          </div>

          <p className="text-gray-700 text-xs sm:text-sm line-clamp-3 leading-relaxed">
            {provider.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewProfile(provider)}
            className="flex-1 text-xs sm:text-sm"
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Ver Perfil</span>
            <span className="sm:hidden">Ver</span>
          </Button>
          <Button 
            size="sm" 
            onClick={() => onRequestQuote(provider.id)}
            className="flex-1 text-xs sm:text-sm"
          >
            <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Cotizar</span>
            <span className="sm:hidden">Cotizar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}