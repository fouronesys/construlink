import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import { QuoteModal } from "@/components/quote-modal";
import { ProviderProfileModal } from "@/components/provider-profile-modal";
import { Shield, Star, Handshake, MapPin, Phone, Mail, Globe, CheckCircle } from "lucide-react";

interface Provider {
  id: string;
  legalName: string;
  rnc: string;
  specialties: string[];
  location: string;
  description: string;
  averageRating: number;
  totalReviews: number;
}

const sampleProviders: Provider[] = [
  {
    id: "1",
    legalName: "Constructora Dominicana S.R.L.",
    rnc: "1-31-85420-1",
    specialties: ["Concreto", "Estructura", "Techado"],
    location: "Santo Domingo, Distrito Nacional",
    description: "Empresa líder en construcción de edificios residenciales y comerciales con más de 15 años de experiencia en el mercado dominicano.",
    averageRating: 4.9,
    totalReviews: 127,
  },
  {
    id: "2",
    legalName: "Instalaciones Eléctricas Pro",
    rnc: "1-01-50123-8",
    specialties: ["Eléctricos", "Iluminación"],
    location: "Santiago, Santiago",
    description: "Especialistas en instalaciones eléctricas residenciales e industriales. Certificados por la Comisión Nacional de Energía.",
    averageRating: 4.7,
    totalReviews: 89,
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");

  const handleViewProfile = (provider: Provider) => {
    setSelectedProvider(provider);
  };

  const handleRequestQuote = (providerId: string) => {
    setSelectedProviderId(providerId);
    setShowQuoteModal(true);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section 
        className="relative bg-gradient-to-r from-primary to-blue-700 min-h-96 flex items-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1541976590-713941681591?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "overlay",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Proveedores de Construcción{" "}
              <span className="text-emerald-400 block sm:inline">Verificados</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-200 mb-6 sm:mb-8 max-w-2xl lg:max-w-3xl mx-auto px-4">
              La plataforma líder en República Dominicana para conectar con proveedores certificados de materiales y servicios de construcción.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto px-4">
              <Button 
                size="lg" 
                className="bg-emerald-500 text-white hover:bg-emerald-600 text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto"
                onClick={() => setLocation("/register-supplier")}
              >
                Registrarse como Proveedor
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white text-primary hover:bg-gray-100 border-white text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto"
                onClick={() => setLocation("/directory")}
              >
                Explorar Proveedores
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div className="py-4">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">1,247+</div>
              <div className="text-sm sm:text-base text-gray-600">Proveedores Verificados</div>
            </div>
            <div className="py-4">
              <div className="text-3xl sm:text-4xl font-bold text-emerald-500 mb-2">98%</div>
              <div className="text-sm sm:text-base text-gray-600">Tasa de Satisfacción</div>
            </div>
            <div className="py-4">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">15,000+</div>
              <div className="text-sm sm:text-base text-gray-600">Proyectos Completados</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">¿Por qué elegirnos?</h2>
            <p className="text-lg text-gray-600">Garantizamos confiabilidad y calidad en cada conexión</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-emerald text-3xl mb-4">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Verificación RNC</h3>
                <p className="text-gray-600">
                  Todos nuestros proveedores están verificados con la DGII para garantizar su legitimidad.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-primary text-3xl mb-4">
                  <Star className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Calidad Certificada</h3>
                <p className="text-gray-600">
                  Sistema de reseñas verificadas y certificaciones profesionales validadas.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-emerald text-3xl mb-4">
                  <Handshake className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Conexiones Seguras</h3>
                <p className="text-gray-600">
                  Facilitamos conexiones directas y seguras entre clientes y proveedores.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Providers Preview */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Proveedores Destacados</h2>
            <p className="text-lg text-gray-600">Conoce algunos de nuestros proveedores verificados</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {sampleProviders.map((provider) => (
              <Card key={provider.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        {provider.legalName}
                        <Badge className="ml-2 bg-emerald/10 text-emerald border-emerald/20">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verificado
                        </Badge>
                      </h3>
                      <p className="text-sm text-gray-600">RNC: {provider.rnc}</p>
                    </div>
                    <div className="flex items-center">
                      {renderStars(provider.averageRating)}
                      <span className="ml-1 text-gray-600 text-sm">({provider.averageRating})</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-700 text-sm mb-2">Especialidades:</p>
                    <div className="flex flex-wrap gap-2">
                      {provider.specialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center mb-4 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {provider.location}
                  </div>

                  <p className="text-gray-700 text-sm mb-4">{provider.description}</p>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleViewProfile(provider)}
                    >
                      Ver Perfil
                    </Button>
                    <Button 
                      className="bg-emerald text-emerald-foreground hover:bg-emerald/90"
                      onClick={() => handleRequestQuote(provider.id)}
                    >
                      Solicitar Cotización
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              size="lg" 
              onClick={() => setLocation("/directory")}
            >
              Ver Todos los Proveedores
            </Button>
          </div>
        </div>
      </section>

      {/* Quote Modal */}
      <QuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        providerId={selectedProviderId}
      />

      {/* Provider Profile Modal */}
      <ProviderProfileModal
        provider={selectedProvider}
        isOpen={!!selectedProvider}
        onClose={() => setSelectedProvider(null)}
        onRequestQuote={(providerId) => {
          setSelectedProvider(null);
          handleRequestQuote(providerId);
        }}
      />
    </div>
  );
}
