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
import RegisterSupplier from "@/pages/register-supplier";
import SupplierDashboard from "@/pages/supplier-dashboard";
import AdminPanel from "@/pages/admin-panel";
import Payment from "@/pages/payment";
import Terms from "@/pages/terms";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Durante desarrollo, mostrar siempre la landing page hasta que la autenticación esté configurada
  if (import.meta.env.DEV) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/directory" component={Directory} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/register-supplier" component={RegisterSupplier} />
        <Route path="/supplier-dashboard" component={SupplierDashboard} />
        <Route path="/admin-panel" component={AdminPanel} />
        <Route path="/payment" component={Payment} />
        <Route path="/dashboard" component={SupplierDashboard} />
        <Route path="/terms" component={Terms} />
        <Route component={NotFound} />
      </Switch>
    );
  }

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
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/register-supplier" component={RegisterSupplier} />
          <Route path="/terms" component={Terms} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/directory" component={Directory} />
          <Route path="/payment" component={Payment} />
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
