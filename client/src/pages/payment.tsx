import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import VerifonePayment from "@/components/verifone-payment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Payment() {
  const { user } = useAuth();
  const navigate = (path: string) => { window.location.href = path; };
  const [location] = useLocation();
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Parse query parameters
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const subscriptionId = urlParams.get('subscriptionId');
    const planId = urlParams.get('planId');

    if (!subscriptionId || !planId) {
      navigate('/subscription-selection');
      return;
    }

    // Fetch subscription data
    fetchSubscriptionData(subscriptionId);
  }, [location]);

  const fetchSubscriptionData = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      } else {
        navigate('/subscription-selection');
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
      navigate('/subscription-selection');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    navigate('/supplier-dashboard');
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error);
  };

  if (!user || user.role !== 'supplier') {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2">Cargando información de pago...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subscriptionData) {
    navigate('/subscription-selection');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Completar Suscripción
          </h1>
          <p className="text-gray-600">
            Configura tu método de pago para activar tu suscripción
          </p>
        </div>

        <VerifonePayment
          subscriptionId={subscriptionData.id}
          planId={subscriptionData.planId}
          amount={subscriptionData.monthlyAmount}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </div>
    </div>
  );
}