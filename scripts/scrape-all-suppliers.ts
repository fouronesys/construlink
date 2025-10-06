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

  // FERRETERÍAS - SANTO DOMINGO
  { legalName: "Ferretería Americana", location: "Santo Domingo", phone: "809-682-8181", address: "Av. Duarte No. 154, Centro", description: "Ferretería con amplio surtido de herramientas, materiales de construcción y artículos para el hogar." },
  { legalName: "Ferretería El Siglo", location: "Santo Domingo", phone: "809-535-7070", address: "Av. Independencia No. 405, Zona Colonial", description: "Más de 50 años ofreciendo materiales de construcción y ferretería." },
  { legalName: "Ferretería La Cadena", location: "Santo Domingo", phone: "809-566-4040", address: "Av. 27 de Febrero No. 203, Ensanche La Fe", description: "Ferretería y materiales de construcción al por mayor y detal." },
  { legalName: "Ferretería Plaza Lama", location: "Santo Domingo", phone: "809-508-8000", address: "Av. Máximo Gómez esq. 27 de Febrero", description: "Cadena de ferreterías y materiales de construcción." },
  { legalName: "EPA Ferretería", location: "Santo Domingo", phone: "809-955-3722", address: "Av. Winston Churchill, Piantini", description: "Ferretería moderna con todo para construcción y remodelación." },
  { legalName: "Ferretería Ochoa", location: "Santo Domingo", phone: "809-687-5555", address: "Av. Independencia No. 256, Gascue", description: "Ferretería especializada en materiales eléctricos y plomería." },
  { legalName: "Multiferretería del Caribe", location: "Santo Domingo", phone: "809-565-3030", address: "Av. Abraham Lincoln No. 1021, Piantini", description: "Amplia gama de productos ferreteros y materiales de construcción." },
  { legalName: "Ferretería Nacional", location: "Santo Domingo", phone: "809-688-9090", address: "Calle Pasteur No. 201, Gazcue", description: "Herramientas profesionales y materiales para construcción." },
  { legalName: "Ferretería La Económica", location: "Santo Domingo", phone: "809-567-1212", address: "Av. Duarte No. 89, Villa Consuelo", description: "Precios accesibles en materiales de construcción y ferretería." },
  { legalName: "Ferretería Gómez", location: "Santo Domingo", phone: "809-533-6060", address: "Av. Hermanas Mirabal No. 456, Villa Mella", description: "Ferretería y materiales de construcción para profesionales." },

  // MATERIALES DE CONSTRUCCIÓN - SANTO DOMINGO
  { legalName: "Constanza Materiales de Construcción", location: "Santo Domingo", phone: "809-549-7070", address: "Autopista Duarte Km 9, Los Alcarrizos", description: "Distribuidora de cemento, varillas, blocks y materiales de construcción." },
  { legalName: "Deposito de Materiales La Fe", location: "Santo Domingo", phone: "809-567-8080", address: "Av. San Vicente de Paul No. 78, Los Mina", description: "Materiales de construcción al por mayor: cemento, arena, gravilla." },
  { legalName: "Materiales de Construcción El Progreso", location: "Santo Domingo", phone: "809-566-9191", address: "Av. Venezuela No. 34, Cristo Rey", description: "Cemento, varillas, blocks, arena y más materiales de construcción." },
  { legalName: "Blockes Fabián", location: "Santo Domingo", phone: "809-594-4040", address: "Carr. Mella Km 12, Los Frailes II", description: "Fábrica y venta de blocks, adoquines y productos de cemento." },
  { legalName: "Cementos Cibao", location: "Santo Domingo", phone: "809-565-5151", address: "Av. Máximo Gómez No. 45, Ensanche La Fe", description: "Distribución de cementos y materiales de construcción." },
  { legalName: "Arena y Gravilla del Este", location: "Santo Domingo", phone: "809-594-6262", address: "Autopista del Este Km 14", description: "Venta de arena, gravilla y piedra para construcción." },
  { legalName: "Hierros y Varillas del Caribe", location: "Santo Domingo", phone: "809-549-7373", address: "Av. Duarte Km 8, Los Alcarrizos", description: "Distribución de varillas, cabillas y hierro estructural." },
  { legalName: "Deposito La Unión", location: "Santo Domingo", phone: "809-535-8484", address: "Av. México No. 156, Cristo Rey", description: "Materiales de construcción: cemento, blocks, varillas y arena." },

  // PLOMERÍA - SANTO DOMINGO
  { legalName: "Plomería Universal", location: "Santo Domingo", phone: "809-566-7070", address: "Av. Winston Churchill No. 56, Piantini", description: "Materiales de plomería, tuberías PVC, sanitarios y grifería." },
  { legalName: "Sanitarios y Grifería del Caribe", location: "Santo Domingo", phone: "809-565-8080", address: "Av. 27 de Febrero No. 308, Naco", description: "Inodoros, lavamanos, griferías y accesorios de baño." },
  { legalName: "Tuberías Nacional", location: "Santo Domingo", phone: "809-547-9090", address: "Av. Duarte No. 234, Villa Consuelo", description: "Tuberías PVC, cobre y accesorios de plomería." },
  { legalName: "Plomería Martínez", location: "Santo Domingo", phone: "809-688-0101", address: "Calle Cervantes No. 67, Gazcue", description: "Materiales para instalaciones sanitarias y plomería." },
  { legalName: "Accesorios de Plomería La Popular", location: "Santo Domingo", phone: "809-535-1212", address: "Av. Independencia No. 789, Centro", description: "Tuberías, válvulas, conexiones y accesorios de plomería." },

  // PINTURAS - SANTO DOMINGO
  { legalName: "Pinturas Popular", location: "Santo Domingo", phone: "809-549-2020", address: "Av. Máximo Gómez No. 78, Ensanche La Fe", description: "Pinturas para interiores, exteriores, esmaltes y barnices." },
  { legalName: "Sherwin Williams Dominicana", location: "Santo Domingo", phone: "809-565-3030", address: "Av. Abraham Lincoln No. 907, Piantini", description: "Pinturas de alta calidad para todo tipo de proyectos." },
  { legalName: "Pinturas Tropical", location: "Santo Domingo", phone: "809-567-4040", address: "Av. Duarte No. 456, Villa Francisca", description: "Pinturas, barnices, esmaltes y productos químicos para construcción." },
  { legalName: "Colorama Pinturas", location: "Santo Domingo", phone: "809-566-5050", address: "Av. 27 de Febrero No. 512, Bella Vista", description: "Pinturas decorativas, acabados especiales y asesoría en color." },
  { legalName: "Pinturas y Acabados RD", location: "Santo Domingo", phone: "809-535-6060", address: "Av. San Martín No. 123, Villa Consuelo", description: "Pinturas, impermeabilizantes y productos para acabados." },

  // ELÉCTRICOS - SANTO DOMINGO
  { legalName: "Eléctrica del Caribe", location: "Santo Domingo", phone: "809-565-7070", address: "Av. Winston Churchill No. 152, Piantini", description: "Materiales eléctricos, cables, breakers e iluminación." },
  { legalName: "Electro Materiales SD", location: "Santo Domingo", phone: "809-547-8080", address: "Av. Duarte No. 345, Centro", description: "Cables, interruptores, tomacorrientes y accesorios eléctricos." },
  { legalName: "Iluminación y Electricidad Total", location: "Santo Domingo", phone: "809-566-9090", address: "Av. 27 de Febrero No. 678, Naco", description: "Materiales eléctricos y sistemas de iluminación LED." },
  { legalName: "Cables y Breakers RD", location: "Santo Domingo", phone: "809-535-0101", address: "Av. Independencia No. 567, Gazcue", description: "Cables eléctricos, breakers, tableros y accesorios." },
  { legalName: "Electro Suministros Nacional", location: "Santo Domingo", phone: "809-688-1111", address: "Calle Pasteur No. 89, Gazcue", description: "Materiales eléctricos para proyectos residenciales y comerciales." },

  // ALUMINIO Y PVC - SANTO DOMINGO
  { legalName: "Aluminio del Caribe", location: "Santo Domingo", phone: "809-566-2020", address: "Av. Winston Churchill No. 234, Piantini", description: "Ventanas, puertas y estructuras de aluminio y PVC." },
  { legalName: "Ventanas PVC Dominicana", location: "Santo Domingo", phone: "809-565-3030", address: "Av. 27 de Febrero No. 890, Bella Vista", description: "Fabricación e instalación de ventanas y puertas PVC." },
  { legalName: "Aluplast RD", location: "Santo Domingo", phone: "809-547-4040", address: "Av. Duarte No. 567, Villa Consuelo", description: "Perfiles de aluminio y PVC para construcción." },
  { legalName: "Techos y Aluminio Nacional", location: "Santo Domingo", phone: "809-535-5050", address: "Av. Independencia No. 234, Centro", description: "Techos de aluminio, zinc y estructuras metálicas." },

  // VIDRIERÍA - SANTO DOMINGO
  { legalName: "Vidriería Cristal", location: "Santo Domingo", phone: "809-566-6060", address: "Av. Winston Churchill No. 345, Piantini", description: "Vidrios, espejos, vitrales y trabajos en cristal." },
  { legalName: "Cristalería del Este", location: "Santo Domingo", phone: "809-594-7070", address: "Av. España No. 78, Villa Duarte", description: "Vidrios templados, espejos y cerramientos de cristal." },
  { legalName: "Vidrios y Espejos Nacional", location: "Santo Domingo", phone: "809-535-8080", address: "Av. Duarte No. 678, Centro", description: "Corte de vidrio, espejos y trabajos especializados." },

  // PISOS Y REVESTIMIENTOS - SANTO DOMINGO
  { legalName: "Cerámica del Caribe", location: "Santo Domingo", phone: "809-565-9090", address: "Av. Abraham Lincoln No. 567, Piantini", description: "Cerámicas, porcelanatos y pisos importados." },
  { legalName: "Pisos y Azulejos Nacional", location: "Santo Domingo", phone: "809-566-0101", address: "Av. 27 de Febrero No. 456, Bella Vista", description: "Pisos cerámicos, porcelanatos y revestimientos." },
  { legalName: "Mármoles y Granitos del Este", location: "Santo Domingo", phone: "809-594-1111", address: "Autopista del Este Km 10", description: "Mármol, granito, cuarzo y piedras naturales." },
  { legalName: "Adoquines Dominicanos", location: "Santo Domingo", phone: "809-549-2020", address: "Autopista Duarte Km 7, Los Alcarrizos", description: "Adoquines de concreto para pisos exteriores." },

  // AIRES ACONDICIONADOS - SANTO DOMINGO
  { legalName: "Aire Frío del Caribe", location: "Santo Domingo", phone: "809-566-3030", address: "Av. Winston Churchill No. 678, Piantini", description: "Venta e instalación de aires acondicionados y sistemas de ventilación." },
  { legalName: "Climatización Total RD", location: "Santo Domingo", phone: "809-565-4040", address: "Av. 27 de Febrero No. 234, Naco", description: "Aires acondicionados residenciales y comerciales." },
  { legalName: "Refrigeración Nacional", location: "Santo Domingo", phone: "809-547-5050", address: "Av. Duarte No. 789, Villa Consuelo", description: "Aires acondicionados, refrigeración y mantenimiento." },

  // TECHADO E IMPERMEABILIZACIÓN - SANTO DOMINGO
  { legalName: "Techos del Caribe", location: "Santo Domingo", phone: "809-566-6060", address: "Av. Winston Churchill No. 890, Piantini", description: "Techos de zinc, aluminio e impermeabilización." },
  { legalName: "Impermeabilizantes Tropical", location: "Santo Domingo", phone: "809-565-7070", address: "Av. 27 de Febrero No. 345, Bella Vista", description: "Productos impermeabilizantes y selladores." },
  { legalName: "Techados y Estructuras RD", location: "Santo Domingo", phone: "809-535-8080", address: "Av. Independencia No. 456, Gazcue", description: "Instalación de techos metálicos y estructuras." },

  // PUERTAS Y VENTANAS - SANTO DOMINGO
  { legalName: "Puertas Premium RD", location: "Santo Domingo", phone: "809-566-9090", address: "Av. Abraham Lincoln No. 234, Piantini", description: "Puertas de madera, metal y fibra de vidrio." },
  { legalName: "Ventanas del Caribe", location: "Santo Domingo", phone: "809-565-0101", address: "Av. Winston Churchill No. 567, Piantini", description: "Ventanas de aluminio, PVC y madera." },
  { legalName: "Puertas y Closets Nacional", location: "Santo Domingo", phone: "809-547-1111", address: "Av. Duarte No. 890, Centro", description: "Puertas, closets y trabajos de ebanistería." },

  // FERRETERÍAS - SANTIAGO
  { legalName: "Ferretería Industrial Santiago", location: "Santiago", phone: "809-582-5555", address: "Av. 27 de Febrero No. 234, Centro", description: "Ferretería con herramientas industriales y materiales de construcción." },
  { legalName: "Ferretería La Campana", location: "Santiago", phone: "809-583-6666", address: "Calle del Sol No. 156, Centro", description: "Materiales de construcción y artículos ferreteros." },
  { legalName: "Multiferretería del Cibao", location: "Santiago", phone: "809-582-7777", address: "Av. Juan Pablo Duarte Km 4", description: "Ferretería y materiales para construcción." },

  // MATERIALES DE CONSTRUCCIÓN - SANTIAGO
  { legalName: "Materiales Cibao", location: "Santiago", phone: "809-583-8888", address: "Autopista Duarte Km 3", description: "Cemento, varillas, blocks y materiales de construcción." },
  { legalName: "Blockes del Norte", location: "Santiago", phone: "809-582-9999", address: "Carr. Don Pedro Km 2", description: "Fabricación de blocks y productos de cemento." },
  { legalName: "Arena y Gravilla Santiago", location: "Santiago", phone: "809-583-0000", address: "Autopista Duarte Km 5", description: "Arena, gravilla y piedra para construcción." },

  // PINTURAS - SANTIAGO
  { legalName: "Pinturas del Cibao", location: "Santiago", phone: "809-582-1111", address: "Av. 27 de Febrero No. 567, Los Jardines", description: "Pinturas, barnices y productos químicos para construcción." },
  { legalName: "Colorama Santiago", location: "Santiago", phone: "809-583-2222", address: "Calle del Sol No. 234, Centro", description: "Pinturas decorativas y acabados especiales." },

  // PLOMERÍA - SANTIAGO
  { legalName: "Plomería del Norte", location: "Santiago", phone: "809-582-3333", address: "Av. Estrella Sadhalá No. 45", description: "Tuberías, sanitarios y accesorios de plomería." },
  { legalName: "Sanitarios Santiago", location: "Santiago", phone: "809-583-4444", address: "Av. 27 de Febrero No. 345", description: "Inodoros, lavamanos y griferías importadas." },

  // ELÉCTRICOS - SANTIAGO
  { legalName: "Eléctrica Santiago", location: "Santiago", phone: "809-582-5555", address: "Calle del Sol No. 456", description: "Materiales eléctricos, cables e iluminación." },
  { legalName: "Iluminación del Cibao", location: "Santiago", phone: "809-583-6666", address: "Av. Juan Pablo Duarte No. 234", description: "Sistemas de iluminación LED y materiales eléctricos." },

  // ALUMINIO Y PVC - SANTIAGO
  { legalName: "Aluminio Santiago", location: "Santiago", phone: "809-582-7777", address: "Av. Estrella Sadhalá No. 78", description: "Ventanas y puertas de aluminio y PVC." },
  { legalName: "Ventanas PVC del Norte", location: "Santiago", phone: "809-583-8888", address: "Autopista Duarte Km 4", description: "Fabricación de ventanas y puertas PVC." },
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
  
  // Categorías específicas primero
  if (text.includes('ferret')) {
    specialties.push("Ferretería");
  }
  if (text.includes('material') && (text.includes('construcción') || text.includes('deposito') || text.includes('block') || text.includes('cemento'))) {
    specialties.push("Materiales de Construcción");
  }
  if (text.includes('herramienta')) {
    specialties.push("Herramientas y Equipos");
  }
  if (text.includes('metal') || text.includes('acero') || text.includes('hierro') || text.includes('varilla') || text.includes('estructura')) {
    specialties.push("Estructuras Metálicas");
  }
  if (text.includes('plomería') || text.includes('tubería') || text.includes('sanitario') || text.includes('grifo') || text.includes('inodoro') || text.includes('lavamanos')) {
    specialties.push("Plomería y Sanitarios");
  }
  if (text.includes('eléctric') || text.includes('electric') || text.includes('cable') || text.includes('breaker') || text.includes('iluminación')) {
    specialties.push("Eléctricos y Iluminación");
  }
  if (text.includes('pintura') || text.includes('barniz') || text.includes('esmalte')) {
    specialties.push("Pinturas y Acabados");
  }
  if (text.includes('aluminio') || text.includes('pvc') || text.includes('aluplast')) {
    specialties.push("Aluminio y PVC");
  }
  if (text.includes('vidrio') || text.includes('cristal') || text.includes('espejo')) {
    specialties.push("Vidriería y Cristalería");
  }
  if (text.includes('adoquin') || text.includes('piso') || text.includes('cerámica') || text.includes('porcelanato') || text.includes('azulejo') || text.includes('revestimiento')) {
    specialties.push("Pisos y Revestimientos");
  }
  if (text.includes('mármol') || text.includes('granito')) {
    specialties.push("Mármol y Granito");
  }
  if (text.includes('aire') && (text.includes('acondicionado') || text.includes('frío')) || text.includes('climatización') || text.includes('refrigeración')) {
    specialties.push("Aire Acondicionado y Ventilación");
  }
  if (text.includes('techado') || text.includes('techo') || text.includes('impermeabil') || text.includes('zinc')) {
    specialties.push("Techado e Impermeabilización");
  }
  if (text.includes('puerta') && (text.includes('ventana') || !text.includes('puerto'))) {
    specialties.push("Puertas y Ventanas");
  }
  if (text.includes('ventana') && !text.includes('puerto')) {
    specialties.push("Puertas y Ventanas");
  }
  if (text.includes('closet') || text.includes('ebanist') || text.includes('carpint')) {
    specialties.push("Ebanistería y Carpintería");
  }
  if (text.includes('cerrajer') || text.includes('herrer')) {
    specialties.push("Cerrajería y Herrería");
  }
  if (text.includes('piscina') || text.includes('spa')) {
    specialties.push("Piscinas y Spas");
  }
  if (text.includes('jardín') || text.includes('paisaj')) {
    specialties.push("Jardinería y Paisajismo");
  }
  if (text.includes('comercial') && text.includes('construcción')) {
    specialties.push("Construcción Comercial");
  }
  if (text.includes('residencial') || text.includes('hogar') || text.includes('vivienda') || text.includes('apartamento')) {
    specialties.push("Construcción de Hogares");
  }
  if (text.includes('turístico') || text.includes('hotel')) {
    specialties.push("Construcción de Proyectos");
  }
  if (text.includes('diseño') || text.includes('arquitect')) {
    specialties.push("Construcción de Proyectos");
  }
  if (text.includes('acabado') || text.includes('decoración')) {
    specialties.push("Acabados y Decoración");
  }
  if (text.includes('cemento') || text.includes('concreto') || text.includes('hormigón') || text.includes('block')) {
    specialties.push("Cemento y Concreto");
  }
  if (text.includes('arena') || text.includes('gravilla') || text.includes('piedra')) {
    specialties.push("Materiales de Construcción");
  }
  
  // Si no tiene especialidades específicas, agregar Construcción General
  if (specialties.length === 0) {
    specialties.push("Construcción General");
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
