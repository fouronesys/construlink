import axios from 'axios';
import * as cheerio from 'cheerio';

interface ScrapedBusiness {
  name: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  description?: string;
  category: string;
  city: string;
}

const CATEGORIES = [
  'constructoras',
  'restaurantes',
  'supermercados',
  'farmacias',
  'ferreterias',
  'electrodomesticos',
  'mueblerias',
  'talleres-mecanicos',
  'hoteles',
  'clinicas',
  'laboratorios',
  'dentistas',
  'abogados',
  'contadores',
  'bancos',
  'seguros',
  'agencias-de-viajes',
  'transporte',
  'mensajeria',
  'tecnologia',
  'computadoras',
  'imprentas',
  'publicidad',
  'seguridad',
  'limpieza',
  'jardineria',
  'plomeria',
  'electricidad',
  'pintura',
  'carpinteria'
];

const CITIES = [
  'santo-domingo',
  'santiago',
  'la-vega',
  'san-francisco-de-macoris',
  'puerto-plata',
  'la-romana',
  'san-pedro-de-macoris',
  'higuey',
  'moca',
  'bani',
  'azua',
  'barahona'
];

// Helper function to normalize business names for duplicate detection
export function normalizeBusinessName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(srl|s\.r\.l\.|s\.a\.|sa|inc|ltd|ltda|eirl|e\.i\.r\.l\.)\b/gi, '')
    .replace(/[.,\-_()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to check if two business names are duplicates
export function areBusinessNamesSimilar(name1: string, name2: string): boolean {
  const normalized1 = normalizeBusinessName(name1);
  const normalized2 = normalizeBusinessName(name2);
  
  // Exact match after normalization
  if (normalized1 === normalized2) return true;
  
  // Check if one is contained in the other (for cases like "ABC" vs "ABC Construcciones")
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    const words1 = normalized1.split(' ').filter(w => w.length > 2);
    const words2 = normalized2.split(' ').filter(w => w.length > 2);
    
    // If they share most significant words, consider them duplicates
    const commonWords = words1.filter(w => words2.includes(w));
    if (commonWords.length >= Math.min(words1.length, words2.length) * 0.7) {
      return true;
    }
  }
  
  return false;
}

// Keyword mapping for specialty inference
const SPECIALTY_KEYWORDS: Record<string, string[]> = {
  'Construcción': ['construc', 'edifici', 'obra', 'contratist', 'ingeni', 'arquitect'],
  'Restaurante': ['restauran', 'comida', 'food', 'cocina', 'gastronom', 'parrilla', 'pizz'],
  'Supermercado': ['supermercad', 'colmad', 'minimarket', 'bodeg', 'abarrote'],
  'Farmacia': ['farmacia', 'medicamento', 'pharmacy', 'drogueria'],
  'Ferretería': ['ferrete', 'ferreter', 'hardware', 'herramienta', 'materiales'],
  'Tecnología': ['tecnolog', 'tech', 'software', 'informatic', 'sistemas', 'computador', 'digital'],
  'Transporte': ['transport', 'mudanza', 'logistic', 'carga', 'delivery', 'mensajer'],
  'Salud': ['clinic', 'salud', 'medic', 'hospital', 'doctor', 'odontolog', 'dentist', 'laboratorio'],
  'Hotelería': ['hotel', 'hospedaj', 'resort', 'alojamiento', 'hostal'],
  'Legal': ['abogad', 'legal', 'juridic', 'notari', 'ley', 'derecho'],
  'Contabilidad': ['contab', 'contador', 'auditoria', 'financ', 'accounting'],
  'Seguros': ['seguro', 'insurance', 'aseguradora'],
  'Limpieza': ['limpie', 'cleaning', 'fumigac', 'sanitiz'],
  'Diseño': ['diseñ', 'design', 'publicidad', 'marketing', 'imprenta', 'grafico'],
  'Seguridad': ['seguridad', 'vigilancia', 'security', 'alarm'],
  'Mantenimiento': ['mantenimient', 'reparac', 'servicio tecnico', 'plomer', 'electric', 'pintura', 'carpint'],
  'Automotriz': ['taller', 'mecanica', 'auto', 'vehiculo', 'repuesto', 'lubricentro'],
  'Inmobiliaria': ['inmobiliar', 'bienes raices', 'real estate', 'propiedades'],
  'Educación': ['educac', 'escuela', 'colegio', 'universidad', 'academia', 'instituto'],
  'Muebles': ['muebl', 'furniture', 'decorac', 'tapiceria'],
};

// Helper function to infer specialties from business name and description
export function inferSpecialties(name: string, description?: string, primaryCategory?: string): string[] {
  const text = `${name} ${description || ''}`.toLowerCase();
  const specialties = new Set<string>();
  
  // Add primary category if provided
  if (primaryCategory) {
    // Map common category names to specialty format
    const categoryMap: Record<string, string> = {
      'constructoras': 'Construcción',
      'restaurantes': 'Restaurante',
      'supermercados': 'Supermercado',
      'farmacias': 'Farmacia',
      'ferreterias': 'Ferretería',
      'tecnologia': 'Tecnología',
      'computadoras': 'Tecnología',
      'transporte': 'Transporte',
      'mensajeria': 'Transporte',
      'clinicas': 'Salud',
      'laboratorios': 'Salud',
      'dentistas': 'Salud',
      'hoteles': 'Hotelería',
      'abogados': 'Legal',
      'contadores': 'Contabilidad',
      'seguros': 'Seguros',
      'limpieza': 'Limpieza',
      'publicidad': 'Diseño',
      'imprentas': 'Diseño',
      'seguridad': 'Seguridad',
      'plomeria': 'Mantenimiento',
      'electricidad': 'Mantenimiento',
      'pintura': 'Mantenimiento',
      'carpinteria': 'Mantenimiento',
      'talleres-mecanicos': 'Automotriz',
      'mueblerias': 'Muebles',
    };
    
    const mappedCategory = categoryMap[primaryCategory.toLowerCase()];
    if (mappedCategory) {
      specialties.add(mappedCategory);
    }
  }
  
  // Check for additional specialties based on keywords
  Object.entries(SPECIALTY_KEYWORDS).forEach(([specialty, keywords]) => {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        specialties.add(specialty);
        break;
      }
    }
  });
  
  return Array.from(specialties).slice(0, 5); // Limit to 5 specialties
}

export async function scrapeBusinesses(
  category: string,
  city: string,
  maxPages: number = 5
): Promise<ScrapedBusiness[]> {
  const businesses: ScrapedBusiness[] = [];
  
  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = `https://paginasamarillas.com.do/en/business/search/${city}/c/${category}?p=${page}`;
      console.log(`Scraping page ${page} of ${category} in ${city}...`);
      console.log(`URL: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      
      const articleCount = $('article').length;
      console.log(`Found ${articleCount} article elements on page ${page}`);
      
      if (articleCount === 0 && page === 1) {
        console.warn(`⚠️ No articles found on first page. The website structure may have changed.`);
        console.log(`Response status: ${response.status}`);
        console.log(`Response content length: ${response.data.length}`);
      }
      
      let foundOnThisPage = 0;
      
      $('article').each((_, element) => {
        const $article = $(element);
        
        // Try to find name in h2 first (with or without link), then h3
        let name = $article.find('h2 a').first().text().trim();
        if (!name) {
          name = $article.find('h2').first().text().trim();
        }
        if (!name) {
          name = $article.find('h3 a').first().text().trim();
        }
        if (!name) {
          name = $article.find('h3').first().text().trim();
        }
        
        if (!name) return;
        
        // Address is usually in h3 element (if it's not the name)
        let address = '';
        const h3Elements = $article.find('h3');
        
        // The h3 contains the address if it's different from the name
        if (h3Elements.length > 0) {
          const h3Text = h3Elements.first().text().trim();
          // If h3 is not the same as name, it's likely the address
          if (h3Text && h3Text !== name) {
            address = h3Text.replace(/\s+/g, ' ');
          }
        }
        
        // Fallback to other address selectors
        if (!address) {
          const addressElement = $article.find('address, .address, [itemprop="address"]');
          address = addressElement.text().trim().replace(/\s+/g, ' ');
        }
        
        // Extract phone numbers from links and text
        let phone = '';
        $article.find('a[href^="tel:"]').each((_, el) => {
          const tel = $(el).attr('href')?.replace('tel:', '').replace(/\D/g, '') || '';
          if (tel && !phone) phone = tel;
        });
        
        // If no phone link found, try to extract from text
        if (!phone) {
          const text = $article.text();
          const phoneMatch = text.match(/(?:809|829|849)[-\s]?\d{3}[-\s]?\d{4}/);
          if (phoneMatch) {
            phone = phoneMatch[0].replace(/\D/g, '');
          }
        }
        
        let whatsapp = '';
        $article.find('a[href*="wa.me"], a[href*="whatsapp"]').each((_, el) => {
          const wa = $(el).attr('href') || '';
          const match = wa.match(/\d{10,}/);
          if (match) whatsapp = match[0];
        });
        
        let website = '';
        $article.find('a[href*="http"]').each((_, el) => {
          const href = $(el).attr('href') || '';
          if (
            !href.includes('paginasamarillas.com.do') &&
            !href.includes('wa.me') &&
            !href.includes('whatsapp') &&
            !href.includes('tel:')
          ) {
            if (!website) website = href;
          }
        });
        
        const descriptionElement = $article.find('p, .description, [itemprop="description"]');
        const description = descriptionElement.first().text().trim().replace(/\s+/g, ' ').substring(0, 500);
        
        const business: ScrapedBusiness = {
          name: name.trim(),
          address: address || undefined,
          phone: phone || undefined,
          whatsapp: whatsapp || undefined,
          website: website || undefined,
          description: description || undefined,
          category,
          city
        };
        
        businesses.push(business);
        foundOnThisPage++;
      });
      
      console.log(`Extracted ${foundOnThisPage} businesses from page ${page}`);
      
      if (foundOnThisPage === 0 && page > 1) {
        console.log(`No more results found, stopping pagination.`);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
    } catch (error) {
      console.error(`Error scraping page ${page} of ${category} in ${city}:`, error);
      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        if (axios.isAxiosError(error)) {
          console.error(`Status: ${error.response?.status}`);
          console.error(`Status text: ${error.response?.statusText}`);
        }
      }
      break;
    }
  }
  
  console.log(`Total businesses found for ${category} in ${city}: ${businesses.length}`);
  return businesses;
}

export async function scrapeMultipleCategories(
  categories: string[],
  cities: string[],
  maxPagesPerCategory: number = 3
): Promise<ScrapedBusiness[]> {
  const allBusinesses: ScrapedBusiness[] = [];
  
  for (const category of categories) {
    for (const city of cities) {
      try {
        const businesses = await scrapeBusinesses(category, city, maxPagesPerCategory);
        allBusinesses.push(...businesses);
        console.log(`Scraped ${businesses.length} businesses from ${category} in ${city}`);
      } catch (error) {
        console.error(`Error scraping ${category} in ${city}:`, error);
      }
    }
  }
  
  return allBusinesses;
}

export function getAvailableCategories(): string[] {
  return CATEGORIES;
}

export function getAvailableCities(): string[] {
  return CITIES;
}
