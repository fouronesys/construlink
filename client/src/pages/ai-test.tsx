import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, CheckCircle, XCircle } from "lucide-react";

export default function AITestPage() {
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [parseResult, setParseResult] = useState<any>(null);
  const [parsing, setParsing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await fetch('/api/ai/test');
      const data = await response.json();
      setConnectionStatus(data);
    } catch (error: any) {
      setConnectionStatus({ success: false, message: error.message });
    } finally {
      setTestingConnection(false);
    }
  };

  const parseSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setParsing(true);
    try {
      const response = await fetch('/api/ai/search/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await response.json();
      setParseResult(data);
    } catch (error: any) {
      setParseResult({ error: error.message });
    } finally {
      setParsing(false);
    }
  };

  const getSuggestions = async () => {
    if (!searchQuery.trim()) return;
    
    setLoadingSuggestions(true);
    try {
      const response = await fetch('/api/ai/search/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error: any) {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            <Sparkles className="inline-block mr-2 h-8 w-8 text-orange" />
            Prueba de IA - DeepSeek
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Prueba las funcionalidades de búsqueda inteligente
          </p>
        </div>

        {/* Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle>1. Prueba de Conexión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testConnection} 
              disabled={testingConnection}
              data-testid="button-test-connection"
            >
              {testingConnection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Probar Conexión con DeepSeek
            </Button>

            {connectionStatus && (
              <div className={`p-4 rounded-lg flex items-start gap-3 ${
                connectionStatus.success 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
              }`}>
                {connectionStatus.success ? (
                  <CheckCircle className="h-5 w-5 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">
                    {connectionStatus.success ? '¡Conexión exitosa!' : 'Error de conexión'}
                  </p>
                  <p className="text-sm mt-1" data-testid="text-connection-message">
                    {connectionStatus.message}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Natural Language Parser */}
        <Card>
          <CardHeader>
            <CardTitle>2. Análisis de Lenguaje Natural</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ej: Necesito un electricista certificado en Santiago"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && parseSearch()}
                data-testid="input-search-query"
              />
              <Button 
                onClick={parseSearch} 
                disabled={parsing || !searchQuery.trim()}
                data-testid="button-parse-search"
              >
                {parsing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Analizar
              </Button>
            </div>

            {parseResult && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  Resultado del Análisis:
                </h4>
                <pre className="text-sm overflow-auto bg-white dark:bg-gray-800 p-3 rounded" data-testid="text-parse-result">
                  {JSON.stringify(parseResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle>3. Sugerencias de Búsqueda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Escribe algo parcial... Ej: electr"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && getSuggestions()}
                data-testid="input-suggestions-query"
              />
              <Button 
                onClick={getSuggestions} 
                disabled={loadingSuggestions || !searchQuery.trim()}
                data-testid="button-get-suggestions"
              >
                {loadingSuggestions && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Obtener Sugerencias
              </Button>
            </div>

            {suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Sugerencias:
                </h4>
                <ul className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li 
                      key={index} 
                      className="bg-gray-100 dark:bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={() => setSearchQuery(suggestion)}
                      data-testid={`suggestion-${index}`}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
