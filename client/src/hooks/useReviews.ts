import { useQuery } from "@tanstack/react-query";

export interface ReviewResponse {
  id: string;
  reviewId: string;
  supplierId: string;
  responseText: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  supplierId: string;
  userId?: string | null;
  clientName: string;
  clientEmail: string;
  rating: string;
  comment?: string | null;
  isVerified: boolean;
  createdAt: Date;
  response?: ReviewResponse | null;
}

export function useReviews(supplierId: string | undefined, options?: {
  sortBy?: 'recent' | 'rating_high' | 'rating_low';
  limit?: number;
  offset?: number;
}) {
  const queryParams = new URLSearchParams();
  if (options?.sortBy) queryParams.append('sortBy', options.sortBy);
  if (options?.limit) queryParams.append('limit', options.limit.toString());
  if (options?.offset) queryParams.append('offset', options.offset.toString());
  
  const queryString = queryParams.toString();
  const endpoint = `/api/suppliers/${supplierId}/reviews${queryString ? `?${queryString}` : ''}`;

  const {
    data: reviews,
    isLoading,
    error,
    refetch
  } = useQuery<Review[]>({
    queryKey: ['/api/suppliers', supplierId, 'reviews', options],
    queryFn: async () => {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
    enabled: !!supplierId,
    staleTime: 30000,
  });

  return {
    reviews: reviews || [],
    isLoading,
    error,
    refetch,
  };
}
