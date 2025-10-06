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
        
        const addressElement = $article.find('address, .address, [itemprop="address"]');
        const address = addressElement.text().trim().replace(/\s+/g, ' ');
        
        let phone = '';
        $article.find('a[href^="tel:"]').each((_, el) => {
          const tel = $(el).attr('href')?.replace('tel:', '') || '';
          if (tel && !phone) phone = tel;
        });
        
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
          name,
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
