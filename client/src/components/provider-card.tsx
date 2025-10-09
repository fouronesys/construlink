import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  email?: string;
  profileImageUrl?: string;
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

  const getProviderInitials = () => {
    return provider.legalName
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const isTestProvider = provider.email?.toLowerCase().includes('test');
  const provisionalLogo = 'https://via.placeholder.com/100/FF6B35/FFFFFF?text=TEST';
  const logoUrl = isTestProvider ? provisionalLogo : provider.profileImageUrl;

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0" data-testid={`avatar-provider-${provider.id}`}>
              <AvatarImage src={logoUrl} alt={provider.legalName} />
              <AvatarFallback className="bg-orange text-white">
                {getProviderInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
                {provider.legalName}
              </CardTitle>
              <div className="flex items-center mt-2 text-xs sm:text-sm text-gray-600">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 mr-1 flex-shrink-0" />
                RNC: {provider.rnc}
              </div>
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
              className="text-xs text-gray-500 hover:text-orange h-7 px-2 ml-2"
              data-testid={`button-claim-${provider.id}`}
            >
              <Building2 className="w-3 h-3 mr-1" />
              ¿Es tu empresa?
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

        <div className="flex gap-3 mt-4 sm:mt-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewProfile(provider)}
            className="flex-1 h-10 sm:h-11 border-2 border-gray-300 hover:border-primary hover:bg-primary/5 hover:text-primary font-medium transition-all duration-200"
            data-testid={`button-view-${provider.id}`}
          >
            <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span>Ver Perfil</span>
          </Button>
          <Button 
            size="sm" 
            onClick={() => onRequestQuote(provider.id)}
            className="flex-1 h-10 sm:h-11 bg-primary hover:bg-primary/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            data-testid={`button-quote-${provider.id}`}
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span>Cotizar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}