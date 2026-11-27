import type { ProductoDemo } from "@/lib/catalogo/tipos";

/**
 * PRODUCTOS DE DEMOSTRACIÓN — ver data/README.md.
 *
 * Todo el contenido de este archivo (marcas, nombres, descripciones, notas,
 * familias olfativas, precios, tamaños y banderas destacado/novedad) es
 * FICTICIO y se creó con fines visuales para la Fase 2. Las marcas son
 * inventadas: no corresponden a ningún fabricante real (riesgo de marca,
 * docs/arquitectura.md §6).
 *
 * Los precios están en USD (moneda base, decisión D5) y son la
 * misma escala que usa la semilla de PostgreSQL (docs/specs/2026-10-27-f3a-postgres-drizzle-design.md §4).
 * La tasa CUP/USD la fija el administrador en el Dashboard (F3-C).
 *
 * Las rutas `imagen.src` apuntan a /public/productos/*.webp, archivos que aún no
 * existen: la interfaz debe mostrar un placeholder neutral (no son URLs remotas).
 */
export const productos: ProductoDemo[] = [
  {
    id: "p001",
    slug: "brisa-de-coco-100",
    marca: "Casa Palma",
    nombre: "Brisa de Coco",
    tamano: "100 ml",
    tamanoMl: 100,
    precio: 47,
    moneda: "USD",
    descripcion:
      "Fresca, luminosa y ligera: una salida cítrica que se asienta sobre un corazón floral y un fondo cremoso de coco y sándalo.",
    notas: {
      salida: ["Bergamota", "Limón verde"],
      corazon: ["Jazmín", "Flor de azahar"],
      fondo: ["Coco", "Sándalo", "Almizcle blanco"],
    },
    imagen: {
      src: "/productos/brisa-de-coco.webp",
      alt: "Frasco de Brisa de Coco de 100 ml sobre fondo arena",
    },
    categoriaId: "mujer",
    familia: "floral",
    destacado: true,
    novedad: false,
  },
  {
    id: "p002",
    slug: "rio-cristal",
    marca: "Villa Coral",
    nombre: "Río Cristal",
    tamano: "50 ml",
    tamanoMl: 50,
    precio: 35,
    moneda: "USD",
    descripcion:
      "Un acuático transparente que abre con pomelo y se asienta sobre almizcle blanco. Pensado para el calor del mediodía.",
    notas: {
      salida: ["Pomelo", "Bergamota", "Nota marina"],
      corazon: ["Melón", "Loto", "Cardo marino"],
      fondo: ["Almizcle blanco", "Ámbar gris", "Cedro blanco"],
    },
    imagen: {
      src: "/productos/rio-cristal.webp",
      alt: "Frasco de Río Cristal de 50 ml sobre fondo azul claro",
    },
    categoriaId: "unisex",
    familia: "acuatico",
    destacado: false,
    novedad: true,
  },
  {
    id: "p003",
    slug: "cedro-nocturno",
    marca: "Orquídea Negra",
    nombre: "Cedro Nocturno",
    tamano: "100 ml",
    tamanoMl: 100,
    precio: 69,
    moneda: "USD",
    descripcion:
      "Amaderado y especiado: una salida de pimienta negra da paso a un cedro seco y un fondo de ámbar. Una fragancia de noche, de estela firme.",
    notas: {
      salida: ["Pimienta negra", "Bergamota", "Enebro"],
      corazon: ["Cedro", "Salvia", "Vetiver"],
      fondo: ["Ámbar", "Sándalo", "Cuero"],
    },
    imagen: {
      src: "/productos/cedro-nocturno.webp",
      alt: "Frasco de Cedro Nocturno de 100 ml sobre fondo gris piedra",
    },
    categoriaId: "hombre",
    familia: "amaderado",
    destacado: true,
    novedad: false,
  },
  {
    id: "p004",
    slug: "azahar-de-luna",
    marca: "Jazmín y Cobre",
    nombre: "Azahar de Luna",
    tamano: "50 ml",
    tamanoMl: 50,
    precio: 49,
    moneda: "USD",
    descripcion:
      "Floral blanco de gran difusión: el azahar abre la pieza y el jazmín se apoya sobre una vainilla discreta. Elegante sin resultar empalagosa.",
    notas: {
      salida: ["Flor de azahar", "Mandarina", "Pimienta rosa"],
      corazon: ["Jazmín sambac", "Nardo", "Rosa"],
      fondo: ["Vainilla blanca", "Almizcle blanco", "Haba tonka"],
    },
    imagen: {
      src: "/productos/azahar-de-luna.webp",
      alt: "Frasco de Azahar de Luna de 50 ml sobre fondo blanco roto",
    },
    categoriaId: "mujer",
    familia: "floral",
    destacado: false,
    novedad: true,
  },
  {
    id: "p005",
    slug: "manglar",
    marca: "Taller Mangle",
    nombre: "Manglar",
    tamano: "30 ml",
    tamanoMl: 30,
    precio: 27,
    moneda: "USD",
    descripcion:
      "Cítrico y aromático con hoja de limón, neroli y vetiver. Fresco, seco y sobrio, pensado para el uso diario.",
    notas: {
      salida: ["Limón verde", "Pomelo rosa", "Bergamota"],
      corazon: ["Neroli", "Hierbabuena", "Té verde"],
      fondo: ["Vetiver", "Cedro", "Almizcle blanco"],
    },
    imagen: {
      src: "/productos/manglar.webp",
      alt: "Frasco de Manglar de 30 ml sobre fondo verde salvia",
    },
    categoriaId: "unisex",
    familia: "citrico",
    destacado: false,
    novedad: false,
  },
  {
    id: "p006",
    slug: "vainilla-de-playa",
    marca: "Casa Palma",
    nombre: "Vainilla de Playa",
    tamano: "100 ml",
    tamanoMl: 100,
    precio: 59,
    moneda: "USD",
    descripcion:
      "Vainilla bourbon sobre ámbar y sándalo, con una apertura de cardamomo que evita lo dulce excesivo. Cálida y envolvente, para la noche.",
    notas: {
      salida: ["Cardamomo", "Pimienta rosa", "Bergamota"],
      corazon: ["Vainilla bourbon", "Haba tonka", "Ylang-ylang"],
      fondo: ["Ámbar", "Sándalo", "Benzoino"],
    },
    imagen: {
      src: "/productos/vainilla-de-playa.webp",
      alt: "Frasco de Vainilla de Playa de 100 ml sobre fondo crema",
    },
    categoriaId: "unisex",
    familia: "oriental",
    destacado: true,
    novedad: false,
  },
  {
    id: "p007",
    slug: "sal-y-coral",
    marca: "Villa Coral",
    nombre: "Sal y Coral",
    tamano: "50 ml",
    tamanoMl: 50,
    precio: 39,
    moneda: "USD",
    descripcion:
      "Aromático acuático: sal marina, hierbas frescas y madera flotante. Limpio y discreto, de estela moderada.",
    notas: {
      salida: ["Sal marina", "Bergamota", "Nota marina"],
      corazon: ["Lavanda", "Salvia", "Geranio"],
      fondo: ["Madera flotante", "Almizcle", "Vetiver"],
    },
    imagen: {
      src: "/productos/sal-y-coral.webp",
      alt: "Frasco de Sal y Coral de 50 ml sobre fondo azul marino",
    },
    categoriaId: "hombre",
    familia: "acuatico",
    destacado: false,
    novedad: false,
  },
  {
    id: "p008",
    slug: "ebano",
    marca: "Orquídea Negra",
    nombre: "Ébano",
    tamano: "100 ml",
    tamanoMl: 100,
    precio: 89,
    moneda: "USD",
    descripcion:
      "Oriental amaderado de carácter: incienso y orquídea sobre oud, ámbar y vainilla. La fragancia más intensa del catálogo.",
    notas: {
      salida: ["Incienso", "Pimienta rosa", "Bergamota"],
      corazon: ["Mirra", "Orquídea", "Cedro"],
      fondo: ["Oud", "Ámbar", "Vainilla"],
    },
    imagen: {
      src: "/productos/ebano.webp",
      alt: "Frasco de Ébano de 100 ml sobre fondo gris oscuro",
    },
    categoriaId: "hombre",
    familia: "oriental",
    destacado: true,
    novedad: false,
  },
  {
    id: "p009",
    slug: "rosa-de-batey",
    marca: "Jazmín y Cobre",
    nombre: "Rosa de Batey",
    tamano: "30 ml",
    tamanoMl: 30,
    precio: 25,
    moneda: "USD",
    descripcion:
      "Rosa suave con peonía y lirio sobre almizcle y sándalo. Un floral ligero en formato de 30 ml, fácil de llevar.",
    notas: {
      salida: ["Pimienta rosa", "Lichi", "Mandarina"],
      corazon: ["Rosa", "Peonía", "Lirio"],
      fondo: ["Almizcle blanco", "Sándalo", "Vainilla"],
    },
    imagen: {
      src: "/productos/rosa-de-batey.webp",
      alt: "Frasco de Rosa de Batey de 30 ml sobre fondo rosa palo",
    },
    categoriaId: "mujer",
    familia: "floral",
    destacado: false,
    novedad: true,
  },
  {
    id: "p010",
    slug: "duna",
    marca: "Taller Mangle",
    nombre: "Duna",
    tamano: "50 ml",
    tamanoMl: 50,
    precio: 44,
    moneda: "USD",
    descripcion:
      "Amaderado fresco con hoja de higuera, cedro y vetiver. Terroso pero luminoso, de estela moderada y paso unisex.",
    notas: {
      salida: ["Bergamota", "Higo verde", "Pomelo"],
      corazon: ["Hoja de higuera", "Cedro", "Neroli"],
      fondo: ["Almizcle blanco", "Vetiver", "Musgo de roble"],
    },
    imagen: {
      src: "/productos/duna.webp",
      alt: "Frasco de Duna de 50 ml sobre fondo beige",
    },
    categoriaId: "unisex",
    familia: "amaderado",
    destacado: false,
    novedad: true,
  },
  {
    id: "p011",
    slug: "cafe-de-siesta",
    marca: "Casa Palma",
    nombre: "Café de Siesta",
    tamano: "30 ml",
    tamanoMl: 30,
    precio: 32,
    moneda: "USD",
    descripcion:
      "Café recién hecho con cacao y azahar sobre vainilla y sándalo. Dulce sin ser empalagoso, ideal para la sobremesa.",
    notas: {
      salida: ["Cardamomo", "Café", "Canela"],
      corazon: ["Cacao negro", "Flor de azahar", "Nuez moscada"],
      fondo: ["Vainilla", "Haba tonka", "Sándalo"],
    },
    imagen: {
      src: "/productos/cafe-de-siesta.webp",
      alt: "Frasco de Café de Siesta de 30 ml sobre fondo marrón tostado",
    },
    categoriaId: "unisex",
    familia: "gourmand",
    destacado: true,
    novedad: false,
  },
  {
    id: "p012",
    slug: "sandia-de-verano",
    marca: "Villa Coral",
    nombre: "Sandía de Verano",
    tamano: "50 ml",
    tamanoMl: 50,
    precio: 34,
    moneda: "USD",
    descripcion:
      "Frutal luminoso de pomelo rosa y melón sobre peonía y almizcle. Ligero y alegre, pensado para el verano.",
    notas: {
      salida: ["Pomelo rosa", "Melón verde", "Bergamota"],
      corazon: ["Frambuesa", "Peonía", "Lirio"],
      fondo: ["Almizcle blanco", "Madera blanca", "Cedro"],
    },
    imagen: {
      src: "/productos/sandia-de-verano.webp",
      alt: "Frasco de Sandía de Verano de 50 ml sobre fondo coral",
    },
    categoriaId: "mujer",
    familia: "frutal",
    destacado: false,
    novedad: false,
  },
  {
    id: "p013",
    slug: "amber-real",
    marca: "Orquídea Negra",
    nombre: "Ámbar Real",
    tamano: "100 ml",
    tamanoMl: 100,
    precio: 79,
    moneda: "USD",
    descripcion:
      "Oriental especiado: canela y clavo sobre mirra, incienso y ámbar. Denso y cálido, pensado para el clima fresco.",
    notas: {
      salida: ["Canela", "Clavo", "Bergamota"],
      corazon: ["Mirra", "Incienso", "Rosa"],
      fondo: ["Ámbar", "Vainilla", "Sándalo"],
    },
    imagen: {
      src: "/productos/amber-real.webp",
      alt: "Frasco de Ámbar Real de 100 ml sobre fondo ámbar oscuro",
    },
    categoriaId: "unisex",
    familia: "oriental",
    destacado: false,
    novedad: false,
  },
  {
    id: "p014",
    slug: "alba",
    marca: "Jazmín y Cobre",
    nombre: "Alba",
    tamano: "100 ml",
    tamanoMl: 100,
    precio: 55,
    moneda: "USD",
    descripcion:
      "Floral fresco de magnolia y jazmín con un fondo de almizcle y madera blanca. Un perfume limpio para el día a día.",
    notas: {
      salida: ["Pera", "Bergamota", "Mandarina"],
      corazon: ["Magnolia", "Jazmín", "Lirio"],
      fondo: ["Almizcle blanco", "Madera blanca", "Haba tonka"],
    },
    imagen: {
      src: "/productos/alba.webp",
      alt: "Frasco de Alba de 100 ml sobre fondo blanco",
    },
    categoriaId: "mujer",
    familia: "floral",
    destacado: false,
    novedad: false,
  },
];
