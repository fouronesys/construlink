export interface PredefinedProduct {
  name: string;
  description: string;
  category: string;
}

export const PREDEFINED_PRODUCTS: PredefinedProduct[] = [
  // Construcción General
  {
    name: "Bloques de Concreto 6\"",
    description: "Bloques de concreto de 6 pulgadas para construcción de paredes y estructuras",
    category: "Construcción General"
  },
  {
    name: "Bloques de Concreto 8\"",
    description: "Bloques de concreto de 8 pulgadas para construcción de paredes estructurales",
    category: "Construcción General"
  },
  {
    name: "Bloques de Concreto 4\"",
    description: "Bloques de concreto de 4 pulgadas para divisiones internas",
    category: "Construcción General"
  },
  {
    name: "Ladrillos Rojos",
    description: "Ladrillos de arcilla cocida para construcción y acabados",
    category: "Construcción General"
  },
  {
    name: "Ladrillos Huecos",
    description: "Ladrillos huecos para construcción ligera y divisiones",
    category: "Construcción General"
  },

  // Materiales de Construcción
  {
    name: "Cemento Portland Gris 42.5kg",
    description: "Cemento Portland gris para construcción general, saco de 42.5kg",
    category: "Materiales de Construcción"
  },
  {
    name: "Cemento Blanco 42.5kg",
    description: "Cemento blanco para acabados y trabajos especiales",
    category: "Materiales de Construcción"
  },
  {
    name: "Arena Lavada m³",
    description: "Arena lavada para construcción y mezclas, por metro cúbico",
    category: "Materiales de Construcción"
  },
  {
    name: "Gravilla m³",
    description: "Gravilla para concreto y construcción, por metro cúbico",
    category: "Materiales de Construcción"
  },
  {
    name: "Piedrín m³",
    description: "Piedrín para concreto estructural, por metro cúbico",
    category: "Materiales de Construcción"
  },
  {
    name: "Cal Hidratada 25kg",
    description: "Cal hidratada para mezclas y acabados, saco de 25kg",
    category: "Materiales de Construcción"
  },
  {
    name: "Yeso en Polvo 25kg",
    description: "Yeso en polvo para acabados interiores",
    category: "Materiales de Construcción"
  },

  // Cemento y Concreto
  {
    name: "Concreto Premezclado 3000 PSI",
    description: "Concreto premezclado de 3000 PSI, entrega en obra",
    category: "Cemento y Concreto"
  },
  {
    name: "Concreto Premezclado 4000 PSI",
    description: "Concreto premezclado de 4000 PSI para estructuras",
    category: "Cemento y Concreto"
  },
  {
    name: "Mortero Premezclado",
    description: "Mortero premezclado para pegar bloques y ladrillos",
    category: "Cemento y Concreto"
  },
  {
    name: "Aditivo para Concreto",
    description: "Aditivos plastificantes e impermeabilizantes para concreto",
    category: "Cemento y Concreto"
  },

  // Herramientas y Equipos
  {
    name: "Taladro Percutor 1/2\"",
    description: "Taladro percutor profesional de 1/2 pulgada",
    category: "Herramientas y Equipos"
  },
  {
    name: "Esmeriladora Angular 4.5\"",
    description: "Esmeriladora angular de 4.5 pulgadas para corte y pulido",
    category: "Herramientas y Equipos"
  },
  {
    name: "Sierra Circular 7.25\"",
    description: "Sierra circular eléctrica de 7.25 pulgadas",
    category: "Herramientas y Equipos"
  },
  {
    name: "Mezcladora de Concreto",
    description: "Mezcladora de concreto eléctrica para obras",
    category: "Herramientas y Equipos"
  },
  {
    name: "Nivel Láser Autonivelante",
    description: "Nivel láser profesional autonivelante",
    category: "Herramientas y Equipos"
  },
  {
    name: "Carretilla de Construcción",
    description: "Carretilla metálica para transporte de materiales",
    category: "Herramientas y Equipos"
  },
  {
    name: "Escalera de Aluminio 6m",
    description: "Escalera extensible de aluminio de 6 metros",
    category: "Herramientas y Equipos"
  },
  {
    name: "Andamio Tubular",
    description: "Andamio tubular metálico para trabajos en altura",
    category: "Herramientas y Equipos"
  },

  // Eléctricos y Iluminación
  {
    name: "Cable THW #12",
    description: "Cable eléctrico THW calibre 12 para instalaciones residenciales",
    category: "Eléctricos y Iluminación"
  },
  {
    name: "Cable THW #10",
    description: "Cable eléctrico THW calibre 10 para cargas mayores",
    category: "Eléctricos y Iluminación"
  },
  {
    name: "Interruptor Termomagnético 2x20A",
    description: "Breaker termomagnético doble de 20 amperios",
    category: "Eléctricos y Iluminación"
  },
  {
    name: "Tablero Eléctrico 12 Espacios",
    description: "Panel eléctrico residencial de 12 espacios",
    category: "Eléctricos y Iluminación"
  },
  {
    name: "Lámpara LED 12W",
    description: "Bombillo LED de 12W luz blanca, equivalente a 100W",
    category: "Eléctricos y Iluminación"
  },
  {
    name: "Reflector LED 50W",
    description: "Reflector LED de 50W para exteriores",
    category: "Eléctricos y Iluminación"
  },
  {
    name: "Tubo Conduit PVC 3/4\"",
    description: "Tubo conduit de PVC de 3/4\" para cableado eléctrico",
    category: "Eléctricos y Iluminación"
  },
  {
    name: "Toma Corriente Doble",
    description: "Tomacorriente doble polarizado 110V",
    category: "Eléctricos y Iluminación"
  },
  {
    name: "Interruptor Sencillo",
    description: "Interruptor eléctrico sencillo 110V",
    category: "Eléctricos y Iluminación"
  },
  {
    name: "Plafonera LED Sobreponer",
    description: "Luminaria LED para sobreponer en cielo raso",
    category: "Eléctricos y Iluminación"
  },

  // Plomería y Sanitarios
  {
    name: "Tubo PVC 2\" Sanitario",
    description: "Tubo PVC de 2\" para desagües sanitarios",
    category: "Plomería y Sanitarios"
  },
  {
    name: "Tubo PVC 4\" Sanitario",
    description: "Tubo PVC de 4\" para desagües principales",
    category: "Plomería y Sanitarios"
  },
  {
    name: "Tubo CPVC 1/2\" Agua Caliente",
    description: "Tubo CPVC de 1/2\" para agua caliente",
    category: "Plomería y Sanitarios"
  },
  {
    name: "Inodoro Económico",
    description: "Inodoro de porcelana blanco económico",
    category: "Plomería y Sanitarios"
  },
  {
    name: "Lavamanos con Pedestal",
    description: "Lavamanos de porcelana blanco con pedestal",
    category: "Plomería y Sanitarios"
  },
  {
    name: "Fregadero Acero Inoxidable",
    description: "Fregadero de acero inoxidable una tina",
    category: "Plomería y Sanitarios"
  },
  {
    name: "Grifería para Lavamanos",
    description: "Llave mezcladora cromada para lavamanos",
    category: "Plomería y Sanitarios"
  },
  {
    name: "Grifería para Fregadero",
    description: "Llave mezcladora cromada para fregadero de cocina",
    category: "Plomería y Sanitarios"
  },
  {
    name: "Ducha Cromada",
    description: "Regadera de mano cromada con soporte",
    category: "Plomería y Sanitarios"
  },
  {
    name: "Tanque de Agua 500 Galones",
    description: "Tanque de agua de polietileno de 500 galones",
    category: "Plomería y Sanitarios"
  },
  {
    name: "Bomba de Agua 1/2 HP",
    description: "Bomba de agua periférica de 1/2 HP",
    category: "Plomería y Sanitarios"
  },
  {
    name: "Calentador de Agua Eléctrico 40 Galones",
    description: "Calentador de agua eléctrico de 40 galones",
    category: "Plomería y Sanitarios"
  },

  // Pinturas y Acabados
  {
    name: "Pintura Látex Interior Blanco Galón",
    description: "Pintura látex lavable para interiores, galón blanco",
    category: "Pinturas y Acabados"
  },
  {
    name: "Pintura Látex Exterior Galón",
    description: "Pintura látex para exteriores resistente al clima, galón",
    category: "Pinturas y Acabados"
  },
  {
    name: "Esmalte Sintético Galón",
    description: "Esmalte sintético brillante para metal y madera, galón",
    category: "Pinturas y Acabados"
  },
  {
    name: "Sellador Acrílico Galón",
    description: "Sellador acrílico para preparación de superficies, galón",
    category: "Pinturas y Acabados"
  },
  {
    name: "Masa Corrida 25kg",
    description: "Masa acrílica para nivelar paredes interiores, cubo de 25kg",
    category: "Pinturas y Acabados"
  },
  {
    name: "Rodillo Antigota 9\"",
    description: "Rodillo de pintura antigota de 9 pulgadas",
    category: "Pinturas y Acabados"
  },
  {
    name: "Brocha 3\"",
    description: "Brocha de pintura profesional de 3 pulgadas",
    category: "Pinturas y Acabados"
  },
  {
    name: "Thinner Galón",
    description: "Thinner para dilución de pinturas, galón",
    category: "Pinturas y Acabados"
  },

  // Ferretería
  {
    name: "Clavos 2\" Libra",
    description: "Clavos de acero de 2 pulgadas, libra",
    category: "Ferretería"
  },
  {
    name: "Clavos 3\" Libra",
    description: "Clavos de acero de 3 pulgadas, libra",
    category: "Ferretería"
  },
  {
    name: "Tornillos para Madera 1.5\"",
    description: "Tornillos galvanizados para madera de 1.5\", caja",
    category: "Ferretería"
  },
  {
    name: "Tornillos para Drywall",
    description: "Tornillos punta fina para drywall, caja",
    category: "Ferretería"
  },
  {
    name: "Taquetes de Expansión",
    description: "Taquetes de expansión para concreto, set",
    category: "Ferretería"
  },
  {
    name: "Bisagras para Puerta 3\"",
    description: "Bisagras de acero de 3 pulgadas, par",
    category: "Ferretería"
  },
  {
    name: "Cerradura de Pomo",
    description: "Cerradura de pomo económica para puertas interiores",
    category: "Ferretería"
  },
  {
    name: "Candado de Alta Seguridad",
    description: "Candado de alta seguridad con llave",
    category: "Ferretería"
  },
  {
    name: "Cadena Galvanizada",
    description: "Cadena galvanizada calibre medio, metro",
    category: "Ferretería"
  },

  // Seguridad y Protección
  {
    name: "Casco de Seguridad",
    description: "Casco de seguridad industrial certificado",
    category: "Seguridad y Protección"
  },
  {
    name: "Guantes de Trabajo",
    description: "Guantes de seguridad para construcción, par",
    category: "Seguridad y Protección"
  },
  {
    name: "Lentes de Seguridad",
    description: "Gafas de seguridad transparentes antiempañantes",
    category: "Seguridad y Protección"
  },
  {
    name: "Botas de Seguridad",
    description: "Botas de seguridad con punta de acero",
    category: "Seguridad y Protección"
  },
  {
    name: "Arnés de Seguridad",
    description: "Arnés de seguridad para trabajos en altura",
    category: "Seguridad y Protección"
  },
  {
    name: "Extintor PQS 10lb",
    description: "Extintor de polvo químico seco de 10 libras",
    category: "Seguridad y Protección"
  },
  {
    name: "Cinta de Seguridad Amarilla",
    description: "Cinta de seguridad amarilla para señalización, rollo",
    category: "Seguridad y Protección"
  },

  // Ebanistería y Carpintería
  {
    name: "Madera Pino 2x4x8'",
    description: "Madera de pino de 2x4 pulgadas por 8 pies",
    category: "Ebanistería y Carpintería"
  },
  {
    name: "Madera Pino 2x6x8'",
    description: "Madera de pino de 2x6 pulgadas por 8 pies",
    category: "Ebanistería y Carpintería"
  },
  {
    name: "Plywood 4x8' 3/4\"",
    description: "Lámina de plywood de 4x8 pies, 3/4 pulgadas",
    category: "Ebanistería y Carpintería"
  },
  {
    name: "MDF 4x8' 3/4\"",
    description: "Lámina de MDF de 4x8 pies, 3/4 pulgadas",
    category: "Ebanistería y Carpintería"
  },
  {
    name: "Moldura Colonial 3\"",
    description: "Moldura colonial de madera de 3 pulgadas, metro",
    category: "Ebanistería y Carpintería"
  },
  {
    name: "Pega Blanca para Madera",
    description: "Adhesivo blanco PVA para madera, galón",
    category: "Ebanistería y Carpintería"
  },
  {
    name: "Barniz Brillante",
    description: "Barniz brillante para madera, galón",
    category: "Ebanistería y Carpintería"
  },
  {
    name: "Lija de Grano 80",
    description: "Papel de lija grano 80 para madera, pliego",
    category: "Ebanistería y Carpintería"
  },

  // Pisos y Revestimientos
  {
    name: "Cerámica 33x33cm",
    description: "Cerámica para piso de 33x33 cm, caja",
    category: "Pisos y Revestimientos"
  },
  {
    name: "Porcelanato 60x60cm",
    description: "Porcelanato de alta resistencia 60x60 cm, caja",
    category: "Pisos y Revestimientos"
  },
  {
    name: "Cemento Cola",
    description: "Adhesivo para cerámica tipo cemento cola, saco 25kg",
    category: "Pisos y Revestimientos"
  },
  {
    name: "Fragüe Gris",
    description: "Fragüe color gris para juntas de cerámica, bolsa 5kg",
    category: "Pisos y Revestimientos"
  },
  {
    name: "Piso Laminado",
    description: "Piso laminado click resistente al agua, caja",
    category: "Pisos y Revestimientos"
  },
  {
    name: "Guardaescoba PVC",
    description: "Guardaescoba de PVC imitación madera, metro",
    category: "Pisos y Revestimientos"
  },
  {
    name: "Alfombra Vinílica",
    description: "Alfombra vinílica autoadhesiva, metro cuadrado",
    category: "Pisos y Revestimientos"
  },

  // Aluminio y PVC
  {
    name: "Perfil de Aluminio para Ventana",
    description: "Perfil de aluminio natural para ventanas, metro",
    category: "Aluminio y PVC"
  },
  {
    name: "Perfil de Aluminio para Puerta",
    description: "Perfil de aluminio para puertas corredizas, metro",
    category: "Aluminio y PVC"
  },
  {
    name: "Ventana de Aluminio 1x1m",
    description: "Ventana de aluminio corrediza de 1x1 metro",
    category: "Aluminio y PVC"
  },
  {
    name: "Puerta de Aluminio 0.80x2.10m",
    description: "Puerta de aluminio de 0.80x2.10 metros",
    category: "Aluminio y PVC"
  },
  {
    name: "Perfil PVC para Cielo Raso",
    description: "Perfil de PVC para instalación de cielo raso, metro",
    category: "Aluminio y PVC"
  },

  // Vidriería y Cristalería
  {
    name: "Vidrio Claro 4mm",
    description: "Vidrio claro templado de 4mm, metro cuadrado",
    category: "Vidriería y Cristalería"
  },
  {
    name: "Vidrio Esmerilado 6mm",
    description: "Vidrio esmerilado de 6mm para privacidad, metro cuadrado",
    category: "Vidriería y Cristalería"
  },
  {
    name: "Espejo 4mm",
    description: "Espejo de 4mm, metro cuadrado",
    category: "Vidriería y Cristalería"
  },
  {
    name: "Silicón para Vidrio",
    description: "Silicón transparente para instalación de vidrios, tubo",
    category: "Vidriería y Cristalería"
  },

  // Cerrajería y Herrería
  {
    name: "Tubo Cuadrado 1\" Calibre 18",
    description: "Tubo estructural cuadrado de 1 pulgada calibre 18, metro",
    category: "Cerrajería y Herrería"
  },
  {
    name: "Tubo Redondo 1\" Calibre 18",
    description: "Tubo redondo de 1 pulgada calibre 18, metro",
    category: "Cerrajería y Herrería"
  },
  {
    name: "Varilla Lisa 3/8\"",
    description: "Varilla de acero lisa de 3/8 pulgadas, metro",
    category: "Cerrajería y Herrería"
  },
  {
    name: "Varilla Corrugada 1/2\"",
    description: "Varilla de acero corrugada de 1/2 pulgada, metro",
    category: "Cerrajería y Herrería"
  },
  {
    name: "Reja de Seguridad",
    description: "Reja de seguridad para ventana, metro cuadrado",
    category: "Cerrajería y Herrería"
  },
  {
    name: "Portón Metálico",
    description: "Portón metálico para garaje, metro cuadrado",
    category: "Cerrajería y Herrería"
  },

  // Aire Acondicionado y Ventilación
  {
    name: "Aire Acondicionado Split 12000 BTU",
    description: "Aire acondicionado tipo split inverter de 12000 BTU",
    category: "Aire Acondicionado y Ventilación"
  },
  {
    name: "Aire Acondicionado Ventana 18000 BTU",
    description: "Aire acondicionado tipo ventana de 18000 BTU",
    category: "Aire Acondicionado y Ventilación"
  },
  {
    name: "Extractor de Aire 12\"",
    description: "Extractor de aire industrial de 12 pulgadas",
    category: "Aire Acondicionado y Ventilación"
  },
  {
    name: "Ventilador de Techo 52\"",
    description: "Ventilador de techo de 52 pulgadas con luz",
    category: "Aire Acondicionado y Ventilación"
  },
  {
    name: "Tubería de Cobre 1/4\"",
    description: "Tubería de cobre para refrigeración 1/4\", metro",
    category: "Aire Acondicionado y Ventilación"
  },

  // Techado e Impermeabilización
  {
    name: "Zinc Galvanizado Calibre 26",
    description: "Lámina de zinc galvanizado calibre 26, 12 pies",
    category: "Techado e Impermeabilización"
  },
  {
    name: "Teja Asfáltica",
    description: "Teja asfáltica arquitectónica, paquete",
    category: "Techado e Impermeabilización"
  },
  {
    name: "Lámina de Policarbonato",
    description: "Lámina de policarbonato traslúcido, metro cuadrado",
    category: "Techado e Impermeabilización"
  },
  {
    name: "Impermeabilizante Acrílico",
    description: "Impermeabilizante acrílico para techos, cubeta 19L",
    category: "Techado e Impermeabilización"
  },
  {
    name: "Manto Asfáltico",
    description: "Manto asfáltico autoadhesivo, rollo",
    category: "Techado e Impermeabilización"
  },
  {
    name: "Canalón de PVC",
    description: "Canalón de PVC para desagüe de techos, metro",
    category: "Techado e Impermeabilización"
  },

  // Jardinería y Paisajismo
  {
    name: "Grama en Rollo",
    description: "Grama natural en rollo para jardines, metro cuadrado",
    category: "Jardinería y Paisajismo"
  },
  {
    name: "Tierra Negra m³",
    description: "Tierra negra para jardinería, metro cúbico",
    category: "Jardinería y Paisajismo"
  },
  {
    name: "Abono Orgánico",
    description: "Abono orgánico para plantas, saco 25kg",
    category: "Jardinería y Paisajismo"
  },
  {
    name: "Sistema de Riego por Goteo",
    description: "Kit de riego por goteo automático",
    category: "Jardinería y Paisajismo"
  },
  {
    name: "Manguera de Jardín 1/2\"",
    description: "Manguera de jardín de 1/2 pulgada, metro",
    category: "Jardinería y Paisajismo"
  },
  {
    name: "Adoquín de Concreto",
    description: "Adoquín de concreto para caminos, metro cuadrado",
    category: "Jardinería y Paisajismo"
  },

  // Piscinas y Spas
  {
    name: "Bomba para Piscina 1 HP",
    description: "Bomba centrífuga para piscina de 1 HP",
    category: "Piscinas y Spas"
  },
  {
    name: "Filtro de Arena para Piscina",
    description: "Filtro de arena para piscina residencial",
    category: "Piscinas y Spas"
  },
  {
    name: "Cloro en Pastillas",
    description: "Cloro en pastillas para piscinas, cubo 10kg",
    category: "Piscinas y Spas"
  },
  {
    name: "Liner para Piscina",
    description: "Liner de vinilo para revestimiento de piscina, metro cuadrado",
    category: "Piscinas y Spas"
  },
  {
    name: "Iluminación LED para Piscina",
    description: "Luz LED sumergible multicolor para piscina",
    category: "Piscinas y Spas"
  },

  // Acabados y Decoración
  {
    name: "Cielo Raso PVC",
    description: "Cielo raso de PVC blanco, metro cuadrado",
    category: "Acabados y Decoración"
  },
  {
    name: "Drywall 1/2\"",
    description: "Lámina de drywall de 1/2 pulgada 4x8 pies",
    category: "Acabados y Decoración"
  },
  {
    name: "Perfil Metálico para Drywall",
    description: "Perfil metálico para estructura de drywall, metro",
    category: "Acabados y Decoración"
  },
  {
    name: "Cornisa Decorativa",
    description: "Cornisa decorativa de yeso, metro",
    category: "Acabados y Decoración"
  },
  {
    name: "Papel Tapiz Decorativo",
    description: "Papel tapiz decorativo lavable, rollo",
    category: "Acabados y Decoración"
  },

  // Mármol y Granito
  {
    name: "Granito Natural Pulido",
    description: "Losa de granito natural pulido, metro cuadrado",
    category: "Mármol y Granito"
  },
  {
    name: "Mármol Blanco",
    description: "Losa de mármol blanco, metro cuadrado",
    category: "Mármol y Granito"
  },
  {
    name: "Tope de Cocina Granito",
    description: "Tope de cocina en granito con instalación, metro lineal",
    category: "Mármol y Granito"
  },

  // Equipos Pesados y Maquinaria
  {
    name: "Alquiler Retroexcavadora",
    description: "Alquiler de retroexcavadora con operador, día",
    category: "Equipos Pesados y Maquinaria"
  },
  {
    name: "Alquiler Excavadora",
    description: "Alquiler de excavadora con operador, día",
    category: "Equipos Pesados y Maquinaria"
  },
  {
    name: "Alquiler Camión Volteo",
    description: "Alquiler de camión volteo, viaje",
    category: "Equipos Pesados y Maquinaria"
  },
  {
    name: "Alquiler Compactadora",
    description: "Alquiler de compactadora vibratoria, día",
    category: "Equipos Pesados y Maquinaria"
  },

  // Energía Renovable
  {
    name: "Panel Solar 250W",
    description: "Panel solar fotovoltaico de 250W",
    category: "Energía renovable"
  },
  {
    name: "Inversor Solar 3000W",
    description: "Inversor solar de 3000W para sistema fotovoltaico",
    category: "Energía renovable"
  },
  {
    name: "Batería Solar 200Ah",
    description: "Batería de ciclo profundo de 200Ah para sistema solar",
    category: "Energía renovable"
  },
  {
    name: "Controlador de Carga Solar",
    description: "Controlador de carga MPPT para sistema solar",
    category: "Energía renovable"
  },

  // Sistemas de Seguridad
  {
    name: "Cámara de Seguridad IP",
    description: "Cámara de seguridad IP con visión nocturna",
    category: "Sistemas de Seguridad"
  },
  {
    name: "DVR 8 Canales",
    description: "DVR para sistema de seguridad de 8 canales",
    category: "Sistemas de Seguridad"
  },
  {
    name: "Alarma Inalámbrica",
    description: "Sistema de alarma inalámbrico para hogar",
    category: "Sistemas de Seguridad"
  },
  {
    name: "Sensor de Movimiento",
    description: "Sensor de movimiento infrarrojo para alarma",
    category: "Sistemas de Seguridad"
  },

  // Puertas y Ventanas
  {
    name: "Puerta de Madera Sólida",
    description: "Puerta de madera sólida 0.80x2.10m",
    category: "Puertas y Ventanas"
  },
  {
    name: "Puerta de PVC",
    description: "Puerta de PVC reforzada 0.80x2.10m",
    category: "Puertas y Ventanas"
  },
  {
    name: "Puerta de Seguridad",
    description: "Puerta de seguridad metálica con marco",
    category: "Puertas y Ventanas"
  },
  {
    name: "Ventana de PVC",
    description: "Ventana de PVC doble vidrio, metro cuadrado",
    category: "Puertas y Ventanas"
  },
  {
    name: "Mosquitero de Aluminio",
    description: "Mosquitero de aluminio para ventana, metro cuadrado",
    category: "Puertas y Ventanas"
  },

  // Estructuras Metálicas
  {
    name: "Viga IPR 6\"",
    description: "Viga metálica IPR de 6 pulgadas, metro",
    category: "Estructuras Metálicas"
  },
  {
    name: "Canal C 6\"",
    description: "Canal metálica C de 6 pulgadas, metro",
    category: "Estructuras Metálicas"
  },
  {
    name: "Ángulo 2x2\"",
    description: "Ángulo metálico de 2x2 pulgadas, metro",
    category: "Estructuras Metálicas"
  },
  {
    name: "Platina 2\" x 1/4\"",
    description: "Platina metálica de 2\" x 1/4\", metro",
    category: "Estructuras Metálicas"
  }
];

// Group products by category for easier access
export const PRODUCTS_BY_CATEGORY = PREDEFINED_PRODUCTS.reduce((acc, product) => {
  if (!acc[product.category]) {
    acc[product.category] = [];
  }
  acc[product.category].push(product);
  return acc;
}, {} as Record<string, PredefinedProduct[]>);

// Get all unique categories
export const PRODUCT_CATEGORIES = Object.keys(PRODUCTS_BY_CATEGORY).sort();
