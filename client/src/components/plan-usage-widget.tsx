import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface PlanLimits {
  plan: string;
  maxProducts: number;
  maxQuotes: number;
  maxSpecialties: number;
  maxProjectPhotos: number;
  hasApiAccess: boolean;
}

interface PlanUsage {
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

interface PlanUsageWidgetProps {
  supplierId: string;
}

export default function PlanUsageWidget({ supplierId }: PlanUsageWidgetProps) {
  const { data: planLimits } = useQuery<PlanLimits>({
    queryKey: ["/api/supplier/plan-limits"],
    retry: false,
  });

  const { data: planUsage } = useQuery<PlanUsage>({
    queryKey: ["/api/supplier/plan-usage"],
    retry: false,
  });

  if (!planLimits || !planUsage) {
    return null;
  }

  const getProgressColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const getProgressPercentage = (current: number, max: number) => {
    if (max === -1) return 0; // Unlimited
    return Math.min(100, (current / max) * 100);
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-blue-600" />
          Plan {planLimits.plan.charAt(0).toUpperCase() + planLimits.plan.slice(1)} - Uso del Mes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Products Usage */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Productos</p>
            <div className="space-y-1">
              <p className="text-lg font-bold">
                {planUsage.productsCount || 0}
                {planLimits.maxProducts !== -1 ? ` / ${planLimits.maxProducts}` : ' / ∞'}
              </p>
              {planLimits.maxProducts !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${getProgressColor(
                      parseInt(planUsage.productsCount || "0"), 
                      planLimits.maxProducts
                    )}`}
                    style={{ 
                      width: `${getProgressPercentage(
                        parseInt(planUsage.productsCount || "0"), 
                        planLimits.maxProducts
                      )}%` 
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Quotes Usage */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Cotizaciones</p>
            <div className="space-y-1">
              <p className="text-lg font-bold">
                {planUsage.quotesReceived || 0}
                {planLimits.maxQuotes !== -1 ? ` / ${planLimits.maxQuotes}` : ' / ∞'}
              </p>
              {planLimits.maxQuotes !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${getProgressColor(
                      parseInt(planUsage.quotesReceived || "0"), 
                      planLimits.maxQuotes
                    )}`}
                    style={{ 
                      width: `${getProgressPercentage(
                        parseInt(planUsage.quotesReceived || "0"), 
                        planLimits.maxQuotes
                      )}%` 
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Specialties Usage */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Especialidades</p>
            <div className="space-y-1">
              <p className="text-lg font-bold">
                {planUsage.specialtiesCount || 0}
                {planLimits.maxSpecialties !== -1 ? ` / ${planLimits.maxSpecialties}` : ' / ∞'}
              </p>
              {planLimits.maxSpecialties !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${getProgressColor(
                      parseInt(planUsage.specialtiesCount || "0"), 
                      planLimits.maxSpecialties
                    )}`}
                    style={{ 
                      width: `${getProgressPercentage(
                        parseInt(planUsage.specialtiesCount || "0"), 
                        planLimits.maxSpecialties
                      )}%` 
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Project Photos Usage */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Fotos de Proyectos</p>
            <div className="space-y-1">
              <p className="text-lg font-bold">
                {planUsage.projectPhotos || 0}
                {planLimits.maxProjectPhotos !== -1 ? ` / ${planLimits.maxProjectPhotos}` : ' / ∞'}
              </p>
              {planLimits.maxProjectPhotos !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${getProgressColor(
                      parseInt(planUsage.projectPhotos || "0"), 
                      planLimits.maxProjectPhotos
                    )}`}
                    style={{ 
                      width: `${getProgressPercentage(
                        parseInt(planUsage.projectPhotos || "0"), 
                        planLimits.maxProjectPhotos
                      )}%` 
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Plan-specific messages */}
        <div className="mt-4">
          {planLimits.plan === 'basic' && (
            <div className="p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <strong>Plan Básico:</strong> Actualiza a Professional o Enterprise para obtener límites más altos y acceso a la API.
              </p>
            </div>
          )}
          {planLimits.plan === 'professional' && (
            <div className="p-3 bg-green-100 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Plan Professional:</strong> Tienes acceso a productos y cotizaciones ilimitadas. Considera Enterprise para acceso a la API.
              </p>
            </div>
          )}
          {planLimits.plan === 'enterprise' && (
            <div className="p-3 bg-purple-100 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>Plan Enterprise:</strong> Tienes acceso completo a todas las funciones, incluyendo la API para integraciones.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}