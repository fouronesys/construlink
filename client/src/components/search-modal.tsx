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
import { Search, MapPin, Star, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [, setLocation] = useLocation();

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

  const handleSelectResult = (supplierId: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setLocation(`/directory?id=${supplierId}`);
  };

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
          <div className="py-6 text-center text-sm text-muted-foreground">
            Buscando...
          </div>
        ) : query.trim().length < 2 ? (
          <CommandEmpty>
            <div className="py-6 text-center">
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
        ) : results.length === 0 ? (
          <CommandEmpty>
            <div className="py-6 text-center">
              <Search className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <p className="text-sm text-muted-foreground">
                No se encontraron resultados para "{query}"
              </p>
            </div>
          </CommandEmpty>
        ) : (
          <CommandGroup heading="Resultados">
            {results.map((result) => (
              <CommandItem
                key={result.id}
                value={result.id}
                onSelect={() => handleSelectResult(result.id)}
                className="cursor-pointer"
                data-testid={`search-result-${result.id}`}
              >
                <div className="flex items-start gap-3 w-full">
                  {result.profileImageUrl ? (
                    <img
                      src={result.profileImageUrl}
                      alt={result.legalName}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
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
                    {result.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <MapPin className="w-3 h-3" />
                        <span>{result.location}</span>
                      </div>
                    )}
                    {result.specialties && result.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
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
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
