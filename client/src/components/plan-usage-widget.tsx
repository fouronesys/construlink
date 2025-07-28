import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlanRestrictions } from "@/hooks/usePlanLimits";
import { Package, MessageSquare, Tag, Camera, TrendingUp } from "lucide-react";
import PlanUpgradeDialog from "./plan-upgrade-dialog";
import { useState } from "react";

interface PlanUsageWidgetProps {
  supplierId: string;
  compact?: boolean;
}

export default function PlanUsageWidget({ supplierId, compact = false }: PlanUsageWidgetProps) {
  const { limits, getCurrentUsage, getLimit, getLimitMessage, canPerformAction, isLoading } = usePlanRestrictions(supplierId);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedLimitType, setSelectedLimitType] = useState("");

  if (isLoading || !limits) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uso del Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usageItems = [
    {
      type: "products",
      icon: <Package className="w-4 h-4" />,
      label: "Productos",
      current: getCurrentUsage("products"),
      limit: getLimit("products"),
      color: "blue"
    },
    {
      type: "quotes",
      icon: <MessageSquare className="w-4 h-4" />,
      label: "Cotizaciones",
      current: getCurrentUsage("quotes"),
      limit: getLimit("quotes"),
      color: "green"
    },
    {
      type: "specialties",
      icon: <Tag className="w-4 h-4" />,
      label: "Especialidades",
      current: getCurrentUsage("specialties"),
      limit: getLimit("specialties"),
      color: "purple"
    },
    {
      type: "photos",
      icon: <Camera className="w-4 h-4" />,
      label: "Fotos de Proyectos",
      current: getCurrentUsage("photos"),
      limit: getLimit("photos"),
      color: "orange"
    },
  ];

  const handleUpgradeClick = (type: string) => {
    setSelectedLimitType(type);
    setUpgradeDialogOpen(true);
  };

  const getProgressValue = (current: number, limit: number): number => {
    if (limit === -1) return 0; // unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getProgressColor = (current: number, limit: number): string => {
    if (limit === -1) return "bg-green-500"; // unlimited
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-blue-500";
  };

  if (compact) {
    return (
      <>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Plan Actual</CardTitle>
              <Badge variant="outline" className="capitalize">
                {limits.plan}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {usageItems.slice(0, 2).map((item) => (
              <div key={item.type} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <span className={`font-medium ${!canPerformAction(item.type) ? 'text-red-600' : 'text-gray-600'}`}>
                  {item.limit === -1 ? "∞" : `${item.current}/${item.limit}`}
                </span>
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => handleUpgradeClick("general")}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Ver Detalles
            </Button>
          </CardContent>
        </Card>

        <PlanUpgradeDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
          currentPlan={limits.plan}
          limitType={selectedLimitType}
          limitMessage="Mejora tu plan para acceder a más funcionalidades"
        />
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Uso del Plan</CardTitle>
            <Badge variant="secondary" className="capitalize text-sm">
              Plan {limits.plan}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {usageItems.map((item) => (
            <div key={item.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {item.icon}
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {item.limit === -1 ? "Ilimitado" : `${item.current}/${item.limit}`}
                  </span>
                  {!canPerformAction(item.type) && item.limit !== -1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpgradeClick(item.type)}
                      className="text-xs px-2 py-1 h-6"
                    >
                      Actualizar
                    </Button>
                  )}
                </div>
              </div>
              {item.limit !== -1 && (
                <div className="space-y-1">
                  <Progress 
                    value={getProgressValue(item.current, item.limit)} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500">
                    {getLimitMessage(item.type)}
                  </p>
                </div>
              )}
            </div>
          ))}

          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Prioridad en búsquedas:</span>
                <Badge variant={limits.hasPriority ? "default" : "secondary"} className="ml-2 text-xs">
                  {limits.hasPriority ? "Sí" : "No"}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Analytics:</span>
                <Badge variant={limits.hasAnalytics ? "default" : "secondary"} className="ml-2 text-xs">
                  {limits.hasAnalytics ? "Sí" : "No"}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">API Access:</span>
                <Badge variant={limits.hasApiAccess ? "default" : "secondary"} className="ml-2 text-xs">
                  {limits.hasApiAccess ? "Sí" : "No"}
                </Badge>
              </div>
            </div>
          </div>

          {limits.plan === 'basic' && (
            <div className="pt-4">
              <Button 
                className="w-full" 
                onClick={() => handleUpgradeClick("general")}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Actualizar Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PlanUpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        currentPlan={limits.plan}
        limitType={selectedLimitType}
        limitMessage={selectedLimitType === "general" 
          ? "Mejora tu plan para acceder a más funcionalidades y hacer crecer tu negocio"
          : getLimitMessage(selectedLimitType)
        }
      />
    </>
  );
}