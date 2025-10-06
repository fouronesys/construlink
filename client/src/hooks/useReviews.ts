import { useQuery } from "@tanstack/react-query";

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
}

export function useReviews(supplierId: string | undefined) {
  const {
    data: reviews,
    isLoading,
    error,
    refetch
  } = useQuery<Review[]>({
    queryKey: ['/api/suppliers', supplierId, 'reviews'],
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
