import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface PlanLimits {
  plan: string;
  maxProducts: number;
  maxQuotes: number;
  maxSpecialties: number;
  maxProjectPhotos: number;
  hasPriority: boolean;
  hasAnalytics: boolean;
  hasApiAccess: boolean;
}

export interface PlanUsage {
  id: string;
  supplierId: string;
  month: string;
  productsCount: string;
  quotesReceived: string;
  specialtiesCount: string;
  projectPhotos: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LimitCheckResult {
  canPerformAction: boolean;
  message: string;
  limits: PlanLimits;
  currentUsage: PlanUsage | null;
}

export function usePlanLimits(supplierId?: string) {
  return useQuery({
    queryKey: ['/api/suppliers/plan-limits', supplierId],
    queryFn: async (): Promise<PlanLimits> => {
      if (!supplierId) throw new Error("Supplier ID required");
      const response = await fetch(`/api/suppliers/plan-limits/${supplierId}`);
      if (!response.ok) throw new Error("Failed to fetch plan limits");
      return response.json();
    },
    enabled: !!supplierId,
  });
}

export function usePlanUsage(supplierId?: string) {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  return useQuery({
    queryKey: ['/api/plan-usage', supplierId, month],
    queryFn: async (): Promise<PlanUsage | null> => {
      if (!supplierId) return null;
      const response = await fetch(`/api/plan-usage/${supplierId}/${month}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Failed to fetch plan usage");
      return response.json();
    },
    enabled: !!supplierId,
  });
}

export function useCheckPlanLimit() {
  return useMutation({
    mutationFn: async ({ supplierId, type }: { supplierId: string; type: string }): Promise<LimitCheckResult> => {
      const response = await apiRequest("POST", "/api/plan-limits/check", {
        supplierId,
        type,
      });
      if (!response.ok) throw new Error("Failed to check plan limit");
      return response.json();
    },
  });
}

export function useUpdatePlanUsage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      supplierId, 
      type, 
      increment = 1 
    }: { 
      supplierId: string; 
      type: string; 
      increment?: number; 
    }): Promise<PlanUsage> => {
      const response = await apiRequest("POST", "/api/plan-usage/update", {
        supplierId,
        type,
        increment,
      });
      if (!response.ok) throw new Error("Failed to update plan usage");
      return response.json();
    },
    onSuccess: (_, variables) => {
      const month = new Date().toISOString().slice(0, 7);
      queryClient.invalidateQueries({ 
        queryKey: ['/api/plan-usage', variables.supplierId, month] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/suppliers/plan-limits', variables.supplierId] 
      });
    },
  });
}

export function usePlanRestrictions(supplierId?: string) {
  const { data: limits } = usePlanLimits(supplierId);
  const { data: usage } = usePlanUsage(supplierId);

  const getCurrentUsage = (type: string): number => {
    if (!usage) return 0;
    switch (type) {
      case 'products': return parseInt(usage.productsCount || "0");
      case 'quotes': return parseInt(usage.quotesReceived || "0");
      case 'specialties': return parseInt(usage.specialtiesCount || "0");
      case 'photos': return parseInt(usage.projectPhotos || "0");
      default: return 0;
    }
  };

  const getLimit = (type: string): number => {
    if (!limits) return 0;
    switch (type) {
      case 'products': return limits.maxProducts;
      case 'quotes': return limits.maxQuotes;
      case 'specialties': return limits.maxSpecialties;
      case 'photos': return limits.maxProjectPhotos;
      default: return 0;
    }
  };

  const canPerformAction = (type: string): boolean => {
    const limit = getLimit(type);
    if (limit === -1) return true; // unlimited
    return getCurrentUsage(type) < limit;
  };

  const getLimitMessage = (type: string): string => {
    const limit = getLimit(type);
    const current = getCurrentUsage(type);
    const plan = limits?.plan || 'basic';

    if (limit === -1) return "Ilimitado";
    if (current >= limit) {
      return `Límite alcanzado (${current}/${limit}) - Actualiza tu plan para más ${type}`;
    }
    return `${current}/${limit} utilizados`;
  };

  return {
    limits,
    usage,
    getCurrentUsage,
    getLimit,
    canPerformAction,
    getLimitMessage,
    isLoading: !limits,
  };
}