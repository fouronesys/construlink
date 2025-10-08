// Límites de planes para proveedores
export const PLAN_LIMITS = {
  basic: {
    publications: 5,
    products: 10,
    name: 'Básico'
  },
  professional: {
    publications: 20,
    products: 50,
    name: 'Professional'
  },
  enterprise: {
    publications: -1, // Ilimitado
    products: -1, // Ilimitado
    name: 'Empresarial'
  }
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export function getPublicationLimit(plan: PlanType): number {
  return PLAN_LIMITS[plan]?.publications ?? PLAN_LIMITS.basic.publications;
}

export function canCreatePublication(plan: PlanType, currentCount: number): boolean {
  const limit = getPublicationLimit(plan);
  // -1 significa ilimitado
  if (limit === -1) return true;
  return currentCount < limit;
}
