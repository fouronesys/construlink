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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle, 
  MessageSquare,
  Building2,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Flag
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReviews } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import { ReviewForm } from "@/components/review-form";
import { ReviewResponseForm } from "@/components/review-response-form";
import { ReviewReportForm } from "@/components/review-report-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Provider {
  id: string;
  userId?: string | null;
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
  profileImageUrl?: string;
}

interface ProviderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: Provider | null;
  onRequestQuote: (providerId: string) => void;
  onClaimBusiness?: (supplierId: string) => void;
}


export function ProviderProfileModal({ 
  isOpen, 
  onClose, 
  provider, 
  onRequestQuote,
  onClaimBusiness
}: ProviderProfileModalProps) {
  const [canClaim, setCanClaim] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [respondingToReviewId, setRespondingToReviewId] = useState<string | null>(null);
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'rating_high' | 'rating_low'>('recent');
  const [page, setPage] = useState(0);
  const REVIEWS_PER_PAGE = 5;
  
  const { reviews, isLoading: reviewsLoading, refetch: refetchReviews } = useReviews(provider?.id, {
    sortBy,
    limit: REVIEWS_PER_PAGE,
    offset: page * REVIEWS_PER_PAGE
  });
  const { user, isAuthenticated } = useAuth();

  const isProviderOwner = isAuthenticated && user?.id && provider?.userId === user.id;
  const hasMoreReviews = reviews.length === REVIEWS_PER_PAGE;
  const canGoBack = page > 0;
  
  useEffect(() => {
    if (reviews.length === 0 && page > 0 && !reviewsLoading) {
      setPage(p => Math.max(0, p - 1));
    }
  }, [reviews.length, page, reviewsLoading]);

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

  useEffect(() => {
    const checkReviewEligibility = async () => {
      if (!provider?.id) return;
      
      // For authenticated users, check if they can review
      if (isAuthenticated && user?.id) {
        try {
          const response = await fetch(`/api/suppliers/${provider.id}/can-review`);
          if (!response.ok) {
            setCanReview(true);
            return;
          }
          const data = await response.json();
          setCanReview(data.canReview);
        } catch (error) {
          console.error("Error checking review eligibility:", error);
          setCanReview(true);
        }
      } else {
        // For unauthenticated users, always allow them to try
        // Duplicate checks will be performed on submission
        setCanReview(true);
      }
    };

    if (provider?.id) {
      checkReviewEligibility();
    }
  }, [provider?.id, user?.id, isAuthenticated]);

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[96vh] sm:max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0" data-testid={`avatar-provider-modal-${provider.id}`}>
                <AvatarImage src={logoUrl} alt={provider.legalName} />
                <AvatarFallback className="bg-orange text-white text-2xl">
                  {getProviderInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl sm:text-2xl">{provider.legalName}</DialogTitle>
                <DialogDescription className="flex items-center mt-2 text-xs sm:text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                  Proveedor Verificado • RNC: {provider.rnc}
                </DialogDescription>
              </div>
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
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Reseñas de Clientes</h3>
                {canReview && !showReviewForm && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowReviewForm(true)}
                    data-testid="button-write-review"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Escribir Reseña
                  </Button>
                )}
              </div>
              
              {/* Filters and Pagination Controls */}
              {reviews.length > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm text-gray-600">Ordenar por:</span>
                    <Select value={sortBy} onValueChange={(value: 'recent' | 'rating_high' | 'rating_low') => {
                      setSortBy(value);
                      setPage(0);
                    }}>
                      <SelectTrigger className="w-[180px]" data-testid="select-sort-reviews">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Más recientes</SelectItem>
                        <SelectItem value="rating_high">Mejor valoradas</SelectItem>
                        <SelectItem value="rating_low">Menor valoradas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p - 1)}
                      disabled={!canGoBack}
                      data-testid="button-previous-page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600 px-2" data-testid="text-page-number">
                      Página {page + 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={!hasMoreReviews}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && canReview && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg">Deja tu Reseña</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewForm
                    supplierId={provider.id}
                    isAuthenticated={isAuthenticated}
                    userName={isAuthenticated ? `${user?.firstName} ${user?.lastName}` : ''}
                    userEmail={user?.email || ''}
                    onSuccess={() => {
                      setShowReviewForm(false);
                      setCanReview(false);
                      refetchReviews();
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReviewForm(false)}
                    className="mt-2"
                    data-testid="button-cancel-review"
                  >
                    Cancelar
                  </Button>
                </CardContent>
              </Card>
            )}

            {!canReview && !showReviewForm && (
              <p className="text-gray-500 text-sm mb-4">Ya has dejado una reseña para este proveedor.</p>
            )}
            
            {reviewsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">Aún no hay reseñas para este proveedor. ¡Sé el primero en dejar una!</p>
            ) : (
              <div className="space-y-4" data-testid="reviews-list">
                {reviews.map((review) => (
                  <Card key={review.id} data-testid={`review-${review.id}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium" data-testid={`review-author-${review.id}`}>
                            {review.clientName}
                          </p>
                          <div className="flex items-center mt-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < parseFloat(review.rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500" data-testid={`review-date-${review.id}`}>
                            {format(new Date(review.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                          </span>
                          {!isProviderOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReportingReviewId(review.id)}
                              className="h-7 px-2 text-gray-500 hover:text-orange-600"
                              data-testid={`button-report-${review.id}`}
                              title="Reportar reseña"
                            >
                              <Flag className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 text-sm mt-2" data-testid={`review-comment-${review.id}`}>
                          {review.comment}
                        </p>
                      )}
                      {review.isVerified && (
                        <Badge variant="secondary" className="mt-2">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verificada
                        </Badge>
                      )}
                      {review.response && respondingToReviewId !== review.id && (
                        <div className="mt-4 pl-4 border-l-2 border-blue-200 bg-blue-50 p-3 rounded-r" data-testid={`review-response-${review.id}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-blue-900 mb-1">
                                Respuesta del proveedor
                              </p>
                              <p className="text-sm text-gray-700">
                                {review.response.responseText}
                              </p>
                              <span className="text-xs text-gray-500 mt-2 block">
                                {format(new Date(review.response.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                              </span>
                            </div>
                            {isProviderOwner && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRespondingToReviewId(review.id)}
                                data-testid={`button-edit-response-${review.id}`}
                                className="ml-2"
                              >
                                Editar
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {isProviderOwner && !review.response && respondingToReviewId !== review.id && (
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRespondingToReviewId(review.id)}
                            data-testid={`button-respond-${review.id}`}
                          >
                            Responder
                          </Button>
                        </div>
                      )}

                      {isProviderOwner && respondingToReviewId === review.id && (
                        <ReviewResponseForm
                          reviewId={review.id}
                          supplierId={provider.id}
                          existingResponse={review.response}
                          onSuccess={() => {
                            setRespondingToReviewId(null);
                            refetchReviews();
                          }}
                          onCancel={() => setRespondingToReviewId(null)}
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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

        {/* Report Review Modal */}
        <ReviewReportForm
          reviewId={reportingReviewId || ''}
          isOpen={!!reportingReviewId}
          onClose={() => setReportingReviewId(null)}
          isAuthenticated={isAuthenticated}
          userEmail={user?.email}
        />
      </DialogContent>
    </Dialog>
  );
}