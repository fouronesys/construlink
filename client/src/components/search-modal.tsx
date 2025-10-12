import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search, MapPin, Star, Building2, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  legalName: string;
  location: string | null;
  description: string | null;
  specialties: string[];
  averageRating: string;
  totalReviews: number;
  profileImageUrl: string | null;
  similarity: number;
}

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [, setLocation] = useLocation();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch("/api/search/semantic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const saveRecentSearch = (searchTerm: string) => {
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSelectResult = (supplierId: string, legalName: string) => {
    saveRecentSearch(legalName);
    setOpen(false);
    setQuery("");
    setResults([]);
    setLocation(`/directory?id=${supplierId}`);
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
  };

  const getRelevanceColor = (similarity: number) => {
    if (similarity >= 0.7) return "text-green-600 bg-green-50 dark:bg-green-950";
    if (similarity >= 0.5) return "text-blue-600 bg-blue-50 dark:bg-blue-950";
    if (similarity >= 0.35) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950";
    return "text-gray-600 bg-gray-50 dark:bg-gray-950";
  };

  const getRelevanceLabel = (similarity: number) => {
    if (similarity >= 0.7) return "Muy relevante";
    if (similarity >= 0.5) return "Relevante";
    if (similarity >= 0.35) return "Parcialmente relevante";
    return "Baja relevancia";
  };

  // Group results by relevance (4 tiers)
  const highRelevance = results.filter(r => r.similarity >= 0.7);
  const mediumRelevance = results.filter(r => r.similarity >= 0.5 && r.similarity < 0.7);
  const partialRelevance = results.filter(r => r.similarity >= 0.35 && r.similarity < 0.5);
  const lowRelevance = results.filter(r => r.similarity < 0.35);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar proveedores, productos, servicios..."
        value={query}
        onValueChange={setQuery}
        data-testid="input-search-modal"
      />
      <CommandList>
        {isSearching ? (
          <div className="py-8 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-primary animate-pulse mb-3" />
            <p className="text-sm text-muted-foreground">Buscando con IA semántica...</p>
          </div>
        ) : query.trim().length < 2 ? (
          <div className="py-6">
            <CommandEmpty>
              <div className="text-center">
                <Search className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Escribe al menos 2 caracteres para buscar
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Presiona <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">⌘K</kbd> o{" "}
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">Ctrl+K</kbd> para abrir/cerrar
                </p>
              </div>
            </CommandEmpty>
            {recentSearches.length > 0 && (
              <CommandGroup heading="Búsquedas recientes">
                {recentSearches.map((search, idx) => (
                  <CommandItem
                    key={idx}
                    value={search}
                    onSelect={() => handleRecentSearchClick(search)}
                    className="cursor-pointer"
                    data-testid={`recent-search-${idx}`}
                  >
                    <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{search}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </div>
        ) : results.length === 0 ? (
          <CommandEmpty>
            <div className="py-6 text-center">
              <Search className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <p className="text-sm text-muted-foreground">
                No se encontraron resultados para "{query}"
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Intenta con otros términos o palabras relacionadas
              </p>
            </div>
          </CommandEmpty>
        ) : (
          <>
            {highRelevance.length > 0 && (
              <CommandGroup heading="Resultados más relevantes">
                {highRelevance.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.id}
                    onSelect={() => handleSelectResult(result.id, result.legalName)}
                    className="cursor-pointer py-3"
                    data-testid={`search-result-${result.id}`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      {result.profileImageUrl ? (
                        <img
                          src={result.profileImageUrl}
                          alt={result.legalName}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm truncate" data-testid={`text-name-${result.id}`}>
                            {result.legalName}
                          </h3>
                          {result.averageRating && parseFloat(result.averageRating) > 0 && (
                            <div className="flex items-center gap-1 text-xs text-yellow-600">
                              <Star className="w-3 h-3 fill-current" />
                              <span>{parseFloat(result.averageRating).toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        {result.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                            {result.description}
                          </p>
                        )}
                        {result.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <MapPin className="w-3 h-3" />
                            <span>{result.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {result.specialties && result.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 flex-1">
                              {result.specialties.slice(0, 2).map((specialty, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0">
                                  {specialty}
                                </Badge>
                              ))}
                              {result.specialties.length > 2 && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                  +{result.specialties.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                          <Badge 
                            className={cn("text-xs px-2 py-0.5 flex-shrink-0", getRelevanceColor(result.similarity))}
                          >
                            {getRelevanceLabel(result.similarity)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {mediumRelevance.length > 0 && (
              <CommandGroup heading="Otros resultados relevantes">
                {mediumRelevance.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.id}
                    onSelect={() => handleSelectResult(result.id, result.legalName)}
                    className="cursor-pointer py-3"
                    data-testid={`search-result-${result.id}`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      {result.profileImageUrl ? (
                        <img
                          src={result.profileImageUrl}
                          alt={result.legalName}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm truncate" data-testid={`text-name-${result.id}`}>
                            {result.legalName}
                          </h3>
                          {result.averageRating && parseFloat(result.averageRating) > 0 && (
                            <div className="flex items-center gap-1 text-xs text-yellow-600">
                              <Star className="w-3 h-3 fill-current" />
                              <span>{parseFloat(result.averageRating).toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        {result.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                            {result.description}
                          </p>
                        )}
                        {result.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <MapPin className="w-3 h-3" />
                            <span>{result.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {result.specialties && result.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 flex-1">
                              {result.specialties.slice(0, 2).map((specialty, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0">
                                  {specialty}
                                </Badge>
                              ))}
                              {result.specialties.length > 2 && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                  +{result.specialties.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                          <Badge 
                            className={cn("text-xs px-2 py-0.5 flex-shrink-0", getRelevanceColor(result.similarity))}
                          >
                            {getRelevanceLabel(result.similarity)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {partialRelevance.length > 0 && (
              <CommandGroup heading="Coincidencia parcial">
                {partialRelevance.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.id}
                    onSelect={() => handleSelectResult(result.id, result.legalName)}
                    className="cursor-pointer py-2"
                    data-testid={`search-result-${result.id}`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      {result.profileImageUrl ? (
                        <img
                          src={result.profileImageUrl}
                          alt={result.legalName}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm truncate" data-testid={`text-name-${result.id}`}>
                            {result.legalName}
                          </h3>
                          {result.averageRating && parseFloat(result.averageRating) > 0 && (
                            <div className="flex items-center gap-1 text-xs text-yellow-600">
                              <Star className="w-3 h-3 fill-current" />
                              <span>{parseFloat(result.averageRating).toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        {result.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <MapPin className="w-3 h-3" />
                            <span>{result.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {result.specialties && result.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 flex-1">
                              {result.specialties.slice(0, 2).map((specialty, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0">
                                  {specialty}
                                </Badge>
                              ))}
                              {result.specialties.length > 2 && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                  +{result.specialties.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                          <Badge 
                            className={cn("text-xs px-2 py-0.5 flex-shrink-0", getRelevanceColor(result.similarity))}
                          >
                            {getRelevanceLabel(result.similarity)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {lowRelevance.length > 0 && (
              <CommandGroup heading="Resultados adicionales">
                {lowRelevance.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.id}
                    onSelect={() => handleSelectResult(result.id, result.legalName)}
                    className="cursor-pointer py-2"
                    data-testid={`search-result-${result.id}`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      {result.profileImageUrl ? (
                        <img
                          src={result.profileImageUrl}
                          alt={result.legalName}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm truncate" data-testid={`text-name-${result.id}`}>
                            {result.legalName}
                          </h3>
                          {result.averageRating && parseFloat(result.averageRating) > 0 && (
                            <div className="flex items-center gap-1 text-xs text-yellow-600">
                              <Star className="w-3 h-3 fill-current" />
                              <span>{parseFloat(result.averageRating).toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        {result.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{result.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
