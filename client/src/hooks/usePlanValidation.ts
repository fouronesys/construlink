import { useCheckPlanLimit, useUpdatePlanUsage } from "./usePlanLimits";
import { useToast } from "./use-toast";
import { useState } from "react";

export function usePlanValidation(supplierId?: string) {
  const { mutateAsync: checkLimit } = useCheckPlanLimit();
  const { mutateAsync: updateUsage } = useUpdatePlanUsage();
  const { toast } = useToast();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [limitType, setLimitType] = useState("");
  const [limitMessage, setLimitMessage] = useState("");

  const validateAndPerformAction = async (
    type: "product" | "quote" | "specialty" | "photo",
    action: () => Promise<any>,
    options: {
      suppressToast?: boolean;
      onLimitReached?: () => void;
    } = {}
  ) => {
    if (!supplierId) {
      toast({
        title: "Error",
        description: "ID de proveedor no encontrado",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Check if action is allowed
      const limitCheck = await checkLimit({ supplierId, type });
      
      if (!limitCheck.canPerformAction) {
        setLimitType(type);
        setLimitMessage(limitCheck.message);
        setUpgradeDialogOpen(true);
        
        if (!options.suppressToast) {
          toast({
            title: "Límite alcanzado",
            description: limitCheck.message,
            variant: "destructive",
          });
        }
        
        if (options.onLimitReached) {
          options.onLimitReached();
        }
        
        return false;
      }

      // Perform the action
      const result = await action();
      
      // Update usage counter
      await updateUsage({ 
        supplierId, 
        type: type === "quote" ? "quotes" : `${type}s`,
        increment: 1 
      });

      return result;
    } catch (error) {
      console.error("Error validating plan action:", error);
      
      if (!options.suppressToast) {
        toast({
          title: "Error",
          description: "Error al validar la acción del plan",
          variant: "destructive",
        });
      }
      
      return false;
    }
  };

  const validateProductCreation = (action: () => Promise<any>, options = {}) => {
    return validateAndPerformAction("product", action, options);
  };

  const validateQuoteRequest = (action: () => Promise<any>, options = {}) => {
    return validateAndPerformAction("quote", action, options);
  };

  const validateSpecialtyAddition = (action: () => Promise<any>, options = {}) => {
    return validateAndPerformAction("specialty", action, options);
  };

  const validatePhotoUpload = (action: () => Promise<any>, options = {}) => {
    return validateAndPerformAction("photo", action, options);
  };

  const checkCanPerformAction = async (type: "product" | "quote" | "specialty" | "photo"): Promise<boolean> => {
    if (!supplierId) return false;
    
    try {
      const limitCheck = await checkLimit({ supplierId, type });
      return limitCheck.canPerformAction;
    } catch (error) {
      console.error("Error checking plan limits:", error);
      return false;
    }
  };

  return {
    validateProductCreation,
    validateQuoteRequest,
    validateSpecialtyAddition,
    validatePhotoUpload,
    checkCanPerformAction,
    upgradeDialogOpen,
    setUpgradeDialogOpen,
    limitType,
    limitMessage,
  };
}