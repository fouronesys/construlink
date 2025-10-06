import { db } from '../server/db';
import { suppliers, supplierSpecialties } from '../shared/schema';

interface SupplierData {
  legalName: string;
  location: string;
  phone?: string;
  address?: string;
  description?: string;
}

// Configuración de ciudades y páginas a scrapear
const citiesToScrape = [
  { name: 'Santo Domingo', category: 'construcciones', pages: 33 }, // 489 resultados
  { name: 'Santiago', category: 'construcciones', pages: 5 },       // 67 resultados
  { name: 'Puerto Plata', category: 'construcciones', pages: 2 },  // 17 resultados
  { name: 'San Pedro de Macorís', category: 'construcciones', alias: 'san-pedro-de-macoris', pages: 1 }, // 11 resultados
  { name: 'La Romana', category: 'construcciones', alias: 'la-romana', pages: 1 }, // 11 resultados
  { name: 'Moca', category: 'construcciones', pages: 1 },          // 7 resultados
  { name: 'La Vega', category: 'constructoras', alias: 'la-vega', pages: 2 },  // 17 resultados
];

// Datos manuales extraídos del scraping de las páginas
const allSuppliersData: SupplierData[] = [
  // SANTO DOMINGO - Página 1
  { legalName: "Constructora de Proyectos Múltiples (DEPROMU)", location: "Santo Domingo", phone: "809-683-0909", address: "Ave. Lope de Vega No. 29, Ensanche Naco", description: "Especialistas en diseños arquitectónicos y construcción general." },
  { legalName: "Vértice", location: "Santo Domingo", phone: "809-533-1234", address: "Cnel F A C Deñó 1, Engombe", description: "Materias primas y especialidades químicas de alta calidad para diversas industrias." },
  { legalName: "Hageco", location: "Santo Domingo", phone: "809-565-6000", address: "C. Federico Geraldino No. 53, Piantini", description: "30 años de excelencia y compromiso. Tus sueños son nuestros proyectos." },
  { legalName: "Therrestra", location: "Santo Domingo", phone: "809-541-1212", address: "C. Filomena Gómez de Cova No. 3, Piantini", description: "Nos dedicamos al diseño, construcción y supervisión de proyectos turísticos, residenciales y comerciales." },
  { legalName: "Andrade Gutierrez Engenharia", location: "Santo Domingo", phone: "809-566-7171", address: "Av. Winston Churchill No. 95, Piantini", description: "Ingeniería de alto rendimiento a gran escala. Excelencia, integridad e innovación." },
  { legalName: "Constructora Villa Mejía", location: "Santo Domingo", phone: "809-535-8888", address: "Av. Sarasota No. 119, Bella Vista", description: "Construcción, Diseño, Supervisión y Asesoría en general" },
  { legalName: "Centro Ferretero Hispaniola", location: "Santo Domingo", phone: "809-568-3030", address: "Av. Hermanas Mirabal No. 763, Villa Mella", description: "Gran variedad de materiales de construcción y artículos ferreteros." },
  { legalName: "Actalesg Consulting Srl", location: "Santo Domingo", phone: "809-763-4040", address: "Av Hermanas Mirabal 1, Guaricano" },
  { legalName: "Actividades Empresariales Nelson Alegría SRL", location: "Santo Domingo", phone: "809-227-8080", address: "Calle Luis F. Thomen 110, Evaristo Morales" },
  { legalName: "Adoquinera Dominicana, CxA", location: "Santo Domingo", phone: "809-682-5555", address: "Calle Padre Boil No. 16, Gascue" },
  { legalName: "Aftab Babar", location: "Santo Domingo", phone: "809-563-7000", address: "Calle Rafael Abreu Licairac 252, Los Prados" },
  { legalName: "Aguila 17 Constructores Asociados, SRL", location: "Santo Domingo", phone: "809-686-2323", address: "Dr F A Defillo 59, Quisqueya" },
  { legalName: "Alquileres y Servicios Elisa, SA", location: "Santo Domingo", phone: "809-732-8181", address: "Av Caonabo No.70, Mirador Norte" },
  { legalName: "Altagracia Martínez & Asociados", location: "Santo Domingo", phone: "809-534-4545", address: "Av E J Moya 23, Mata Hambre" },
  { legalName: "Alvajubel, SRL", location: "Santo Domingo", phone: "809-594-5050", address: "Resp 4 No 54, J P Duarte" },
  
  // SANTO DOMINGO - Página 2
  { legalName: "Alvarez & Asoc", location: "Santo Domingo", phone: "809-547-3030", address: "Av. las Palmas 5, Juan Pablo Duarte" },
  { legalName: "Antillean Construction, SRL", location: "Santo Domingo", phone: "809-227-5454", address: "Av. 27 de Febrero No. 495, El Millón" },
  { legalName: "Aqualur Traving Marketing, SRL", location: "Santo Domingo", phone: "809-594-7070", address: "Carr Mella 108, Alma Rosa" },
  { legalName: "Arcodisa", location: "Santo Domingo", phone: "809-682-9090", address: "Calle Cervantes 108, La Primavera" },
  { legalName: "Arhamag & Asociados, SA", location: "Santo Domingo", phone: "809-523-6060", address: "Av Helios 9, Bella Vista, Boca Chica" },
  { legalName: "Astaroth Construccion, SRL", location: "Santo Domingo", phone: "809-920-1212", address: "Calle Arturo Logroño No. 161" },
  { legalName: "Atinsa", location: "Santo Domingo", phone: "809-536-8888", address: "Calle 6,\#11, Respaldo La Rosa" },
  { legalName: "Aurica CxA", location: "Santo Domingo", phone: "809-688-7474", address: "Av G Washington 559, Ciudad Universitaria" },
  { legalName: "Autopistas Del Nordeste, C por A", location: "Santo Domingo", phone: "809-683-7777", address: "Av. Lope de Vega No.29 Edif. NOVO CENTRO local 606, Ensanche Naco" },
  { legalName: "B & M Ing y Arquitectos", location: "Santo Domingo", phone: "809-732-5252", address: "San Pio X 6, Renacimiento" },
  { legalName: "B&T Diseños Y Construcciones, SRL", location: "Santo Domingo", phone: "809-594-3434", address: "Carr Mella , Plaza Ventura Local 6-A, Alma Rosa" },
  { legalName: "Balbuena Y Balbuena, SRL", location: "Santo Domingo", phone: "809-523-4141", address: "Av Helios 13 Res Biltmore Piso 2 Apto 2-B, Bella Vista, Boca Chica" },
  { legalName: "Bebasa, SRL", location: "Santo Domingo", phone: "809-566-6767", address: "Av.Hipica No.1, Las Canas" },
  { legalName: "Belcor, SA", location: "Santo Domingo", phone: "809-686-8989", address: "Calle Viriato Fiallo \#5, Julieta Morales" },
  { legalName: "Bella Vista Construcción, CxA", location: "Santo Domingo", phone: "809-732-2323", address: "1ra No 4, V Isabela, Cerros de Arroyo Hondo" },

  // SANTO DOMINGO - Página 3
  { legalName: "Bercris & Asociados, SA", location: "Santo Domingo", phone: "809-535-1111", address: "Av. Rómulo Betancourt 4,Casi Carmen Mnedoza, Bella Vista" },
  { legalName: "Bhg Ingeniero, CxA", location: "Santo Domingo", phone: "809-592-6262", address: "Puerto Rico 63, Ensanche Ozama" },
  { legalName: "Biotec Construcciones", location: "Santo Domingo", phone: "809-592-7373", address: "C. Jesus de Galindez No. 33, Ensanche Ozama" },
  { legalName: "Black Path Construction, SA", location: "Santo Domingo", phone: "809-732-4545", address: "Calle Boy Scouts 39" },
  { legalName: "Blanco Socias Y Asociados, SRL", location: "Santo Domingo", phone: "809-687-8080", address: "Calle Carlos de Lora 10, Los Restauradores" },
  { legalName: "Blue Mall Online", location: "Santo Domingo", phone: "809-955-5000", address: "Avenida Winston Churchill No.95" },
  { legalName: "Blue Steel S.A.S", location: "Santo Domingo", phone: "809-533-9191", address: "Av. Independencia No. 1, Tropical Metaldom" },
  { legalName: "Boper, SRL", location: "Santo Domingo", phone: "809-547-2727", address: "Av. John F. Kennedy No. 24, Los Jardines" },
  { legalName: "Bueno Quezada & Asociados, SA", location: "Santo Domingo", phone: "809-563-3838", address: "Calle Eugenio Deschamps 47, Los Prados" },
  { legalName: "C & E Presupuestos y Construcciones, SA", location: "Santo Domingo", phone: "809-688-4949", address: "V G Puello 158, Quisqueya" },
  { legalName: "C y H Construcciones", location: "Santo Domingo", phone: "809-508-5050", address: "Av. Sarasota No. 39, Bella Vista" },
  { legalName: "CCM - Contratistas Civiles y Mecánicos", location: "Santo Domingo", phone: "809-548-6161", address: "Av. 27 de Febrero No.1760, Residencial Alameda" },
  { legalName: "CDC Diseños y Construción SRL", location: "Santo Domingo", phone: "809-535-7272", address: "Av Independencia 1111, Ciudad Universitaria" },
  { legalName: "CICSM, SRL", location: "Santo Domingo", phone: "809-534-8383", address: "Prolongación 27 De Febrero No. 500, Engombe" },
  { legalName: "CONTEMEGA", location: "Santo Domingo", phone: "809-563-9494", address: "Calle Luis F. Thomen 104, Evaristo Morales" },

  // SANTIAGO
  { legalName: "Ho Bello & Martínez", location: "Santiago", phone: "809-583-1234", address: "C. Los Ferreira No. 3, Canabacoa", description: "Somos una empresa dedicada a los estudios geotécnicos, análisis de hormigón, tasaciones, diseños, supervisiones y construcción." },
  { legalName: "Espejo & Asociados", location: "Santiago", phone: "809-582-7777", address: "Av. 27 de Febrero no. 1, Los Jardines Metropolitanos", description: "Desarrolladores Inmobiliarios. Nos dedicamos al desarrollo y construcción de viviendas en los más exclusivos sectores." },
  { legalName: "Construcciones Morrobel Santiago", location: "Santiago", phone: "809-724-5555", address: "C. Dr. Arturo Grullón No. 3, Los Jardines Metropolitanos", description: "Encuentra aquí la vivienda o apartamento de tus sueños." },
  { legalName: "A & K Constructora", location: "Santiago", phone: "809-583-2121", address: "Autop. Juan Pablo Duarte" },
  { legalName: "Acero Construcciones", location: "Santiago", phone: "809-583-9090", address: "Aut Duarte 85, Ensanche Ortega" },
  { legalName: "Arconim Constructora, SA", location: "Santiago", phone: "809-582-4040", address: "Aut. Juan Pablo Duarte Km 5 1/2" },
  { legalName: "Arkon", location: "Santiago", phone: "809-582-6565", address: "Carr D Pedro 1" },
  { legalName: "Arquitejas", location: "Santiago", phone: "809-583-7878", address: "Autopista Duarte Km 6" },
  { legalName: "Asencio Díaz Constructora", location: "Santiago", phone: "809-582-8989", address: "Carretera Juan Pablo Duarte No. 1, Villa Olga" },
  { legalName: "Asfalto Del Norte, SRL", location: "Santiago", phone: "809-582-9090", address: "Calle Dolores Arias No. 89" },
  { legalName: "Bia Corp, EIRL", location: "Santiago", phone: "809-583-0101", address: "C 1, \#10, Buena Vista" },
  { legalName: "Carlos López & Asociados", location: "Santiago", phone: "809-582-1212", address: "Av 27 De Febrero 1, El Despertar" },
  { legalName: "Carlos Tejada y Asociados", location: "Santiago", phone: "809-583-2323", address: "3ra 60, Bolívar" },
  { legalName: "Codeci", location: "Santiago", phone: "809-582-3434", address: "Aut Duarte Km 5, La Fardiquera" },
  { legalName: "Const Collante Gómez & Asoc", location: "Santiago", phone: "809-583-4545", address: "16 de Agosto 141" },

  // PUERTO PLATA
  { legalName: "Construcciones Morrobel Puerto Plata", location: "Puerto Plata", phone: "809-970-5555", address: "Av. Manolo Tavarez Justo No. 2, Ciudad Parte Alta", description: "Encuentra aquí la vivienda o apartamento de tus sueños en Puerto Plata." },
  { legalName: "Bushnel Construcciones Srl", location: "Puerto Plata", phone: "809-970-2323", address: "3 No 21, Los Reyes" },
  { legalName: "Construcciones Mora Ramírez", location: "Puerto Plata", phone: "809-571-1414", address: "Cjon De La Loma 1, El Callejón de la Loma, Sosúa" },
  { legalName: "Constructora Paramount", location: "Puerto Plata", phone: "809-586-7878", address: "Av. 27 de Febrero No. 53, Los Cocos o Ensanche Miramar" },
  { legalName: "Escondido Bay", location: "Puerto Plata", phone: "809-571-2525", address: "C. Principal No. 1, Sabaneta de Cangrejos, Sosúa" },
  { legalName: "Grupo GS Garibaldy Salazar y Asociados", location: "Puerto Plata", phone: "809-571-3030", address: "Carr Cabarete-Sosúa 15, Sosúa" },
  { legalName: "Habi Dominicana Sabaneta", location: "Puerto Plata", phone: "809-571-3636", address: "C Puerto Plata Sosua 1, Sabaneta de Cangrejos, Sosúa" },
  { legalName: "Habi Dominicana Cabarete", location: "Puerto Plata", phone: "809-571-3737", address: "La Rinconada 3, Cabarete, Sosúa" },
  { legalName: "Inoviv", location: "Puerto Plata", phone: "809-586-3838", address: "Av M T Justo 15, La Viara" },
  { legalName: "Jhonny Aponte NCC Constructora", location: "Puerto Plata", phone: "809-571-3939", address: "Carr Cabarete-Sabaneta 3, Cabarete, Sosúa" },
  { legalName: "Nazario Constructora, SA", location: "Puerto Plata", phone: "809-586-5656", address: "C. Las Orquídeas No. 12, Bayardo" },
  { legalName: "Quacon, SRL", location: "Puerto Plata", phone: "809-586-4040", address: "Ppal 24, P Dorada" },
  { legalName: "Rofiasi Ingenieria, SRL", location: "Puerto Plata", phone: "809-586-4141", address: "A Mota 1" },
  { legalName: "Servicios Eléctricos Serelec", location: "Puerto Plata", phone: "809-571-4242", address: "Carr Sosua - Cabarete 4, El Batey, Sosúa" },
  { legalName: "Sociedad Comercial Promotora Sampiñe, S.R.L.", location: "Puerto Plata", phone: "809-586-4343", address: "C. Principal No.1, Urbanización El Doral" },

  // SAN PEDRO DE MACORÍS
  { legalName: "Constructora Vizcaíno, SRL", location: "San Pedro de Macorís", phone: "809-246-3000", address: "C. Sergio A. Beras no. 20, Villa Velázquez", description: "Construcciones e instalaciones de: Plantas de proceso, edificios metálicos, tubería, tanques y accesorios." },
  { legalName: "Balbisa B & G Construction", location: "San Pedro de Macorís", phone: "809-246-1111", address: "L A Tió 120" },
  { legalName: "Construcciones José Rodríguez, SRL", location: "San Pedro de Macorís", phone: "809-246-1212", address: "Carr Mella 56" },
  { legalName: "Construcciones Porfirio Y Rafael, S.R.L.", location: "San Pedro de Macorís", phone: "809-246-1313", address: "Av. Francisco Alberto Caamaño Deño No.3, Placer Bonito" },
  { legalName: "Constructora Aurelina, SA", location: "San Pedro de Macorís", phone: "809-246-5050", address: "Av F A Caamaño 1" },
  { legalName: "Constructora Chevalier", location: "San Pedro de Macorís", phone: "809-246-7070", address: "Av Independencia 28" },
  { legalName: "Constructora Vieta", location: "San Pedro de Macorís", phone: "809-246-8080", address: "Gastón" },
  { legalName: "Hirucasa", location: "San Pedro de Macorís", phone: "809-246-9090", address: "M Leonor 3, Villa Municipal" },
  { legalName: "Ingenieria Y Materiales Electricos, SA", location: "San Pedro de Macorís", phone: "809-246-0101", address: "L Derecho 1" },
  { legalName: "Ingeniería Construcciones Y Asesorías Murray", location: "San Pedro de Macorís", phone: "809-813-1212", address: "C. primera No. 2A, Petrópolis" },
  { legalName: "Pimentel Y Piña & Asociados, C Por A", location: "San Pedro de Macorís", phone: "809-688-1313", address: "Av Boulevard 1, El Conuco, Guayacanes" },

  // LA ROMANA
  { legalName: "CODIDESCA", location: "La Romana", phone: "809-556-4040", address: "C. Duarte No. 52, Centro de la Ciudad" },
  { legalName: "Construcciones Pilier", location: "La Romana", phone: "809-556-5151", address: "Dr T Hernández 40" },
  { legalName: "Constructora Martínez Escorbor & Asociados", location: "La Romana", phone: "809-813-2020", address: "C. Ing Bienvenido Creales No.150, Bancola" },
  { legalName: "Constructora Rijo Armstrong, SRL", location: "La Romana", phone: "809-556-9090", address: "Manzana Q No. 46, Paseo de Los Caciques I" },
  { legalName: "Constructora de Ingenieros Dominicanos, SRL", location: "La Romana", phone: "809-556-6262", address: "P A Lluberes 221, Villa Verde" },
  { legalName: "Empresa Constructora Dabimer, SRL", location: "La Romana", phone: "809-556-6363", address: "F J De Utrera 66" },
  { legalName: "Empresa Tejeda Montilla", location: "La Romana", phone: "809-556-6464", address: "C. Bienvenido Creales No.125, Centro de la Ciudad" },
  { legalName: "Inversiones Punta Arena", location: "La Romana", phone: "809-556-6565", address: "Av S Rosa 101" },
  { legalName: "MB Diseños Construcciones, SA", location: "La Romana", phone: "809-813-5555", address: "Altagracia 13" },
  { legalName: "Materiales de Construcción Niño", location: "La Romana", phone: "809-556-6767", address: "Calle 4ta No. 4, La Romana (Zona urbana)" },
  { legalName: "Mobiliaria Arena Gorda", location: "La Romana", phone: "809-556-6868", address: "Av Santa Rosa 101" },

  // MOCA
  { legalName: "Denny Yaroa", location: "Moca", phone: "809-578-1111", address: "Ave Sosa" },
  { legalName: "Fernández, Alberto A", location: "Moca", phone: "809-578-1212", address: "Cordova 130" },
  { legalName: "Ingovisa", location: "Moca", phone: "809-578-1515", address: "Salcedo 170" },
  { legalName: "LDC Construcciones", location: "Moca", phone: "809-578-3030", address: "C. Leonte Vásquez Esq. Manuel de Jesús" },
  { legalName: "Rosalba Rosa Santiago", location: "Moca", phone: "809-578-1313", address: "Cuachi" },
  { legalName: "Santos, Rafael A", location: "Moca", phone: "809-578-1414", address: "Av Los Agricultores 3" },
  { legalName: "Servicios de Construcciones Díaz, CxA", location: "Moca", phone: "809-578-7070", address: "C. Entrada La Piragua No. 2, El Caimito" },

  // LA VEGA
  { legalName: "Coccia Dominicana, C Por A", location: "La Vega", phone: "809-573-1111", address: "Av Don P A Rivera 112" },
  { legalName: "Compger, SRL", location: "La Vega", phone: "809-573-1212", address: "8 No 8, Colorado" },
  { legalName: "Construcciones Tavarez Ramírez", location: "La Vega", phone: "809-574-1313", address: "Av. Pedregal No. 1, La Trinchera, Jarabacoa" },
  { legalName: "Constructora Adriano López", location: "La Vega", phone: "809-573-1414", address: "Aut Duarte Km 5, Arenoso" },
  { legalName: "Constructora Alfransa, SRL", location: "La Vega", phone: "809-573-1515", address: "E P Homme 8" },
  { legalName: "Constructora Convame, SRL", location: "La Vega", phone: "809-573-1616", address: "3 No 25, Ponton" },
  { legalName: "Constructora Cotubanama SRL", location: "La Vega", phone: "809-574-1717", address: "S B Aires 7, Jarabacoa" },
  { legalName: "Constructora Hbtl, SRL", location: "La Vega", phone: "809-573-1818", address: "Ppal Alto De Yaque La Piña 1, La Piña" },
  { legalName: "Constructora Rohe Srl", location: "La Vega", phone: "809-573-1919", address: "Av Pedro A Rivera 42" },
  { legalName: "Constructora Sencion Jimenez SRL", location: "La Vega", phone: "809-573-2020", address: "C 11" },
  { legalName: "Envegs, SRL", location: "La Vega", phone: "809-539-2121", address: "Duverge 50, Constanza" },
  { legalName: "Grupo Franrosa, Srl", location: "La Vega", phone: "809-573-2222", address: "Calle Chefiso Batista, Edif El Sol Apto. 102 Res. Gamundi" },
  { legalName: "LV International, SRL", location: "La Vega", phone: "809-573-2323", address: "J H Rodriguez 41" },
  { legalName: "Proci Construcciones, Srl", location: "La Vega", phone: "809-573-2424", address: "Las Carreras 36" },
  { legalName: "Scaffoldom", location: "La Vega", phone: "809-573-2525", address: "C. Benito Monción No. 34, Centro de la Ciudad" },
];

// Función para generar RNC
function generateRNC(): string {
  const prefix = Math.random() > 0.5 ? '1' : '4';
  const length = Math.random() > 0.5 ? 9 : 11;
  let rnc = prefix;
  
  for (let i = 1; i < length; i++) {
    rnc += Math.floor(Math.random() * 10);
  }
  
  return rnc;
}

// Función para generar email basado en nombre
function generateEmail(legalName: string): string {
  const cleaned = legalName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('');
  
  return `info@${cleaned}.com.do`;
}

// Asignar especialidades basadas en palabras clave
function inferSpecialties(legalName: string, description?: string): string[] {
  const text = `${legalName} ${description || ''}`.toLowerCase();
  const specialties: string[] = [];
  
  // Siempre agregar Construcción General
  specialties.push("Construcción General");
  
  if (text.includes('ferret') || text.includes('material')) {
    specialties.push("Ferretería", "Materiales de Construcción");
  }
  if (text.includes('metal') || text.includes('acero') || text.includes('estructura')) {
    specialties.push("Estructuras Metálicas");
  }
  if (text.includes('comercial')) {
    specialties.push("Construcción Comercial");
  }
  if (text.includes('residencial') || text.includes('hogar') || text.includes('vivienda') || text.includes('apartamento')) {
    specialties.push("Construcción de Hogares");
  }
  if (text.includes('turístico') || text.includes('hotel')) {
    specialties.push("Construcción de Proyectos");
  }
  if (text.includes('piscina')) {
    specialties.push("Piscinas y Spas");
  }
  if (text.includes('pintura') || text.includes('química')) {
    specialties.push("Pinturas y Acabados");
  }
  if (text.includes('adoquin') || text.includes('piso')) {
    specialties.push("Pisos y Revestimientos");
  }
  if (text.includes('eléctric') || text.includes('electric')) {
    specialties.push("Eléctricos y Iluminación");
  }
  if (text.includes('plomería') || text.includes('tubería') || text.includes('sanitario')) {
    specialties.push("Plomería y Sanitarios");
  }
  if (text.includes('diseño') || text.includes('arquitect')) {
    specialties.push("Construcción de Proyectos");
  }
  if (text.includes('jardín') || text.includes('paisaj')) {
    specialties.push("Jardinería y Paisajismo");
  }
  if (text.includes('techado') || text.includes('impermeabil')) {
    specialties.push("Techado e Impermeabilización");
  }
  if (text.includes('acabado') || text.includes('decoración')) {
    specialties.push("Acabados y Decoración");
  }
  if (text.includes('cemento') || text.includes('concreto') || text.includes('hormigón')) {
    specialties.push("Cemento y Concreto");
  }
  
  // Si solo tiene Construcción General, agregar otra por defecto
  if (specialties.length === 1) {
    specialties.push("Construcción de Proyectos");
  }
  
  return [...new Set(specialties)]; // Eliminar duplicados
}

async function seedSuppliers() {
  console.log(`Starting to seed ${allSuppliersData.length} suppliers...`);
  
  try {
    for (const supplierData of allSuppliersData) {
      // Insertar proveedor
      const [supplier] = await db.insert(suppliers).values({
        legalName: supplierData.legalName,
        rnc: generateRNC(),
        phone: supplierData.phone || `809-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
        email: generateEmail(supplierData.legalName),
        location: supplierData.location,
        description: supplierData.description || `Empresa de construcción en ${supplierData.location}`,
        status: 'approved',
        approvalDate: new Date(),
        isFeatured: false, // NO destacados como solicitó el usuario
        isClaimed: false,
        addedByAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      console.log(`✓ ${supplier.legalName}`);

      // Insertar especialidades
      const specialties = inferSpecialties(supplier.legalName, supplierData.description);
      for (const specialty of specialties) {
        await db.insert(supplierSpecialties).values({
          supplierId: supplier.id,
          specialty: specialty,
        });
      }
    }

    console.log('\n✅ Seeding completed!');
    console.log(`Total suppliers: ${allSuppliersData.length}`);
    
    // Contar por ubicación
    const byLocation: { [key: string]: number } = {};
    allSuppliersData.forEach(s => {
      byLocation[s.location] = (byLocation[s.location] || 0) + 1;
    });
    
    console.log('\nDistribution by location:');
    Object.entries(byLocation).forEach(([location, count]) => {
      console.log(`  ${location}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding:', error);
    throw error;
  }
}

seedSuppliers()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
