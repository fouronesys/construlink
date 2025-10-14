import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImageUrl?: string;
  supplier?: {
    id?: string;
    hasActiveSubscription?: boolean;
    needsSetup?: boolean;
    [key: string]: any;
  };
}

export function useAuth() {
  const {
    data: user,
    isLoading,
    refetch,
    error
  } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: 1,
    staleTime: 0,
  });

  return {
    user,
    isAuthenticated: !!user && !error,
    isLoading,
    refetch,
  };
}