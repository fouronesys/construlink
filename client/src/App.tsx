import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Directory from "@/pages/directory";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Pricing from "@/pages/pricing";

import SupplierDashboard from "@/pages/supplier-dashboard";
import AdminPanel from "@/pages/admin-panel";
import Payment from "@/pages/payment";
import SubscriptionSelection from "@/pages/subscription-selection";
import Terms from "@/pages/terms";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading state while checking authentication
  console.log('Auth state:', { isAuthenticated, isLoading, user: user?.role });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/directory" component={Directory} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/terms" component={Terms} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/directory" component={Directory} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/payment" component={Payment} />
          <Route path="/subscription-selection" component={SubscriptionSelection} />
          {user?.role === 'supplier' && (
            <Route path="/supplier-dashboard" component={SupplierDashboard} />
          )}
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <Route path="/admin-panel" component={AdminPanel} />
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
