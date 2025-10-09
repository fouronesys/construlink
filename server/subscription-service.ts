import type { Subscription, Supplier } from "@shared/schema";

// Plan prices
export const PLAN_PRICES = {
  basic: {
    monthly: 1000,
    annual: 9600, // 20% discount
  },
  professional: {
    monthly: 2500,
    annual: 24000, // 20% discount
  },
  enterprise: {
    monthly: 5000,
    annual: 48000, // 20% discount
  },
};

// Trial days per plan
export const TRIAL_DAYS = {
  basic: 7,
  professional: 14,
  enterprise: 30,
};

interface ProrateCalculation {
  daysRemaining: number;
  totalDays: number;
  currentPlanPrice: number;
  newPlanPrice: number;
  creditAmount: number;
  amountToPay: number;
  isUpgrade: boolean;
}

// Calculate prorated amount when changing plans
export function calculateProratedAmount(
  subscription: Subscription,
  newPlan: "basic" | "professional" | "enterprise",
  newBillingCycle: "monthly" | "annual" = "monthly"
): ProrateCalculation {
  const now = new Date();
  const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  
  if (!periodEnd) {
    throw new Error("Subscription has no period end date");
  }

  // Calculate days remaining in current period
  const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate total days in period (30 days for monthly, 365 for annual)
  const currentBillingCycle = subscription.billingCycle || "monthly";
  const totalDays = currentBillingCycle === "annual" ? 365 : 30;
  
  // Get current and new plan prices
  const currentPlan = subscription.plan as "basic" | "professional" | "enterprise";
  const currentPlanPrice = PLAN_PRICES[currentPlan][currentBillingCycle];
  const newPlanPrice = PLAN_PRICES[newPlan][newBillingCycle];
  
  // Calculate credit from unused time on current plan
  const creditAmount = (currentPlanPrice / totalDays) * daysRemaining;
  
  // Calculate amount for new plan for remaining period
  const newTotalDays = newBillingCycle === "annual" ? 365 : 30;
  const newPlanRemainingAmount = (newPlanPrice / newTotalDays) * daysRemaining;
  
  // Calculate final amount to pay or credit
  const amountToPay = Math.max(0, newPlanRemainingAmount - creditAmount);
  
  // Determine if it's an upgrade
  const isUpgrade = newPlanPrice > currentPlanPrice;
  
  return {
    daysRemaining,
    totalDays,
    currentPlanPrice,
    newPlanPrice,
    creditAmount: Math.round(creditAmount * 100) / 100,
    amountToPay: Math.round(amountToPay * 100) / 100,
    isUpgrade,
  };
}

// Change subscription plan (upgrade/downgrade)
export async function changePlan(
  storage: any,
  subscriptionId: string,
  newPlan: "basic" | "professional" | "enterprise",
  newBillingCycle: "monthly" | "annual" = "monthly"
): Promise<{
  success: boolean;
  subscription?: Subscription;
  prorateCalculation?: ProrateCalculation;
  message?: string;
}> {
  try {
    const subscription = await storage.getSubscription(subscriptionId);
    
    if (!subscription) {
      return {
        success: false,
        message: "Subscription not found",
      };
    }

    // Cannot change plan during trial
    if (subscription.status === "trialing") {
      return {
        success: false,
        message: "Cannot change plan during trial period",
      };
    }

    // Calculate prorated amount
    const prorateCalculation = calculateProratedAmount(subscription, newPlan, newBillingCycle);
    
    // Update subscription
    const now = new Date();
    const periodEnd = newBillingCycle === "annual" 
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const updatedSubscription = await storage.updateSubscription(subscriptionId, {
      plan: newPlan,
      billingCycle: newBillingCycle,
      monthlyAmount: PLAN_PRICES[newPlan].monthly.toString(),
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      updatedAt: now,
    });

    return {
      success: true,
      subscription: updatedSubscription,
      prorateCalculation,
      message: prorateCalculation.isUpgrade 
        ? "Plan upgraded successfully" 
        : "Plan downgraded successfully",
    };
  } catch (error) {
    console.error("Error changing plan:", error);
    return {
      success: false,
      message: "Failed to change plan",
    };
  }
}

// Cancel subscription
export async function cancelSubscription(
  storage: any,
  subscriptionId: string,
  immediate: boolean = false
): Promise<{
  success: boolean;
  subscription?: Subscription;
  endDate?: Date;
  message?: string;
}> {
  try {
    const subscription = await storage.getSubscription(subscriptionId);
    
    if (!subscription) {
      return {
        success: false,
        message: "Subscription not found",
      };
    }

    if (immediate) {
      // Cancel immediately
      const updatedSubscription = await storage.updateSubscription(subscriptionId, {
        status: "cancelled",
        currentPeriodEnd: new Date(),
        updatedAt: new Date(),
      });

      return {
        success: true,
        subscription: updatedSubscription,
        endDate: new Date(),
        message: "Subscription cancelled immediately",
      };
    } else {
      // Cancel at period end
      const endDate = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : new Date();
      
      const updatedSubscription = await storage.updateSubscription(subscriptionId, {
        status: "cancelled",
        updatedAt: new Date(),
      });

      return {
        success: true,
        subscription: updatedSubscription,
        endDate,
        message: `Subscription will be cancelled on ${endDate.toLocaleDateString()}`,
      };
    }
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return {
      success: false,
      message: "Failed to cancel subscription",
    };
  }
}

// Reactivate cancelled subscription
export async function reactivateSubscription(
  storage: any,
  subscriptionId: string
): Promise<{
  success: boolean;
  subscription?: Subscription;
  message?: string;
}> {
  try {
    const subscription = await storage.getSubscription(subscriptionId);
    
    if (!subscription) {
      return {
        success: false,
        message: "Subscription not found",
      };
    }

    if (subscription.status !== "cancelled") {
      return {
        success: false,
        message: "Subscription is not cancelled",
      };
    }

    // Reactivate subscription
    const now = new Date();
    const billingCycle = subscription.billingCycle || "monthly";
    const periodEnd = billingCycle === "annual" 
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const updatedSubscription = await storage.updateSubscription(subscriptionId, {
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      updatedAt: now,
    });

    return {
      success: true,
      subscription: updatedSubscription,
      message: "Subscription reactivated successfully",
    };
  } catch (error) {
    console.error("Error reactivating subscription:", error);
    return {
      success: false,
      message: "Failed to reactivate subscription",
    };
  }
}

// Extend trial period (admin only)
export async function extendTrial(
  storage: any,
  subscriptionId: string,
  additionalDays: number
): Promise<{
  success: boolean;
  subscription?: Subscription;
  newTrialEndDate?: Date;
  message?: string;
}> {
  try {
    const subscription = await storage.getSubscription(subscriptionId);
    
    if (!subscription) {
      return {
        success: false,
        message: "Subscription not found",
      };
    }

    if (subscription.status !== "trialing") {
      return {
        success: false,
        message: "Subscription is not in trial period",
      };
    }

    const currentTrialEnd = subscription.trialEndDate ? new Date(subscription.trialEndDate) : new Date();
    const newTrialEndDate = new Date(currentTrialEnd.getTime() + additionalDays * 24 * 60 * 60 * 1000);
    
    const updatedSubscription = await storage.updateSubscription(subscriptionId, {
      trialEndDate: newTrialEndDate,
      trialDays: (subscription.trialDays || 0) + additionalDays,
      updatedAt: new Date(),
    });

    return {
      success: true,
      subscription: updatedSubscription,
      newTrialEndDate,
      message: `Trial extended by ${additionalDays} days`,
    };
  } catch (error) {
    console.error("Error extending trial:", error);
    return {
      success: false,
      message: "Failed to extend trial",
    };
  }
}

// Get plan display name
export function getPlanDisplayName(plan: string): string {
  const planNames: Record<string, string> = {
    basic: 'Plan Básico',
    professional: 'Plan Profesional',
    enterprise: 'Plan Empresarial'
  };
  return planNames[plan] || plan;
}

// Get billing cycle display name
export function getBillingCycleDisplayName(cycle: string): string {
  const cycleNames: Record<string, string> = {
    monthly: 'Mensual',
    annual: 'Anual'
  };
  return cycleNames[cycle] || cycle;
}
