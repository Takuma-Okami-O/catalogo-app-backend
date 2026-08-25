export interface CatalogTheme {
  name: string;
  cssVars: string; // contenido que va dentro de :root { ... }
  /** Solo temas especiales (Halloween, Navidad): emojis decorativos flotantes. */
  decorEmojis?: string[];
}

/**
 * Cada plantilla es solo una paleta de variables CSS — el HTML, el
 * carrito, el buscador, el lightbox, etc. son SIEMPRE los mismos.
 * Para agregar la plantilla #3, #4... #10, solo hay que sumar una
 * entrada nueva aquí abajo con sus colores; no hay que tocar nada más.
 */
export const CATALOG_THEMES: Record<string, CatalogTheme> = {
  clasica: {
    name: "Boutique Clásica",
    cssVars: `
      --bg-color: #fcfbfa; --card-bg: #ffffff; --primary: #1a1a1a; --on-primary: #ffffff; --accent-gold: #c59b27; --on-accent: #ffffff;
      --text-main: #222222; --text-muted: #757575; --border-color: #eae5de;
      --whatsapp: #25D366; --danger: #e63946; --radius: 12px;
    `,
  },
  moderna: {
    name: "Moderna Oscura",
    cssVars: `
      --bg-color: #0e0e10; --card-bg: #18181b; --primary: #ffffff; --on-primary: #0e0e10; --accent-gold: #2dd4bf; --on-accent: #0e0e10;
      --text-main: #f4f4f5; --text-muted: #a1a1aa; --border-color: #27272a;
      --whatsapp: #25D366; --danger: #f87171; --radius: 16px;
    `,
  },
  pastel: {
    name: "Pastel Suave",
    cssVars: `
      --bg-color: #fef6f9; --card-bg: #ffffff; --primary: #6b4c57; --on-primary: #ffffff; --accent-gold: #e8a0bf; --on-accent: #4a1a2e;
      --text-main: #4a3941; --text-muted: #9c8791; --border-color: #f3dce4;
      --whatsapp: #25D366; --danger: #e0607e; --radius: 20px;
    `,
  },
  minimalista: {
    name: "Minimalista B&N",
    cssVars: `
      --bg-color: #ffffff; --card-bg: #ffffff; --primary: #000000; --on-primary: #ffffff; --accent-gold: #000000; --on-accent: #ffffff;
      --text-main: #111111; --text-muted: #8a8a8a; --border-color: #e5e5e5;
      --whatsapp: #25D366; --danger: #d00000; --radius: 4px;
    `,
  },
  vibrante: {
    name: "Vibrante Tropical",
    cssVars: `
      --bg-color: #fffbeb; --card-bg: #ffffff; --primary: #1e3a5f; --on-primary: #ffffff; --accent-gold: #ff6b35; --on-accent: #ffffff;
      --text-main: #1e3a5f; --text-muted: #7c8ba1; --border-color: #ffe4c4;
      --whatsapp: #25D366; --danger: #e63946; --radius: 18px;
    `,
  },
  elegante_rosa: {
    name: "Elegante Rosa Gold",
    cssVars: `
      --bg-color: #fdf8f6; --card-bg: #ffffff; --primary: #4a3f42; --on-primary: #ffffff; --accent-gold: #d4a5a5; --on-accent: #4a3f42;
      --text-main: #4a3f42; --text-muted: #a3949a; --border-color: #ecd9dc;
      --whatsapp: #25D366; --danger: #c1666b; --radius: 14px;
    `,
  },
  tech: {
    name: "Tech Neón",
    cssVars: `
      --bg-color: #0a0e17; --card-bg: #131a29; --primary: #ffffff; --on-primary: #0a0e17; --accent-gold: #00e5ff; --on-accent: #0a0e17;
      --text-main: #e8f4ff; --text-muted: #6b8299; --border-color: #1f2b3d;
      --whatsapp: #25D366; --danger: #ff3d71; --radius: 10px;
    `,
  },
  artesanal: {
    name: "Artesanal Tierra",
    cssVars: `
      --bg-color: #f7f2ea; --card-bg: #fffdf8; --primary: #4a3728; --on-primary: #ffffff; --accent-gold: #a97142; --on-accent: #ffffff;
      --text-main: #4a3728; --text-muted: #8c7a68; --border-color: #e6dbc9;
      --whatsapp: #25D366; --danger: #b3541e; --radius: 8px;
    `,
  },
  navidad: {
    name: "Navidad / Fin de Año",
    cssVars: `
      --bg-color: #fdf9f6; --card-bg: #ffffff; --primary: #7a1f2b; --on-primary: #ffffff; --accent-gold: #c9a227; --on-accent: #ffffff;
      --text-main: #2c1e1e; --text-muted: #8a7373; --border-color: #f0dcdc;
      --whatsapp: #25D366; --danger: #7a1f2b; --radius: 12px;
    `,
  },
  rebajas: {
    name: "Rebajas / Black Friday",
    cssVars: `
      --bg-color: #0f0f0f; --card-bg: #1a1a1a; --primary: #ffffff; --on-primary: #0f0f0f; --accent-gold: #ffd60a; --on-accent: #0f0f0f;
      --text-main: #f5f5f5; --text-muted: #9a9a9a; --border-color: #2e2e2e;
      --whatsapp: #25D366; --danger: #ff1744; --radius: 6px;
    `,
  },
  menta_pastel: {
    name: "Menta Pastel",
    cssVars: `
      --bg-color: #f2fbf7; --card-bg: #ffffff; --primary: #2f6b52; --on-primary: #ffffff; --accent-gold: #7fd9b0; --on-accent: #0f3d2b;
      --text-main: #1f3d31; --text-muted: #7c9a8d; --border-color: #d9ede3;
      --whatsapp: #25D366; --danger: #e0607e; --radius: 16px;
    `,
  },
  bosque_esmeralda: {
    name: "Bosque Esmeralda",
    cssVars: `
      --bg-color: #0d1f16; --card-bg: #14291d; --primary: #ffffff; --on-primary: #0d1f16; --accent-gold: #34d399; --on-accent: #0d1f16;
      --text-main: #e9fbf1; --text-muted: #8fb5a3; --border-color: #1e3b2a;
      --whatsapp: #25D366; --danger: #f87171; --radius: 12px;
    `,
  },
  oliva_natural: {
    name: "Oliva Natural",
    cssVars: `
      --bg-color: #f7f6ed; --card-bg: #ffffff; --primary: #556b2f; --on-primary: #ffffff; --accent-gold: #a3b18a; --on-accent: #33420f;
      --text-main: #3c4620; --text-muted: #8b8f6d; --border-color: #e5e3d1;
      --whatsapp: #25D366; --danger: #c1440e; --radius: 8px;
    `,
  },
  lavanda_dream: {
    name: "Lavanda Dream",
    cssVars: `
      --bg-color: #f7f5fc; --card-bg: #ffffff; --primary: #6a4c93; --on-primary: #ffffff; --accent-gold: #b19cd9; --on-accent: #3b2a5c;
      --text-main: #40325a; --text-muted: #9182a8; --border-color: #e6ddf2;
      --whatsapp: #25D366; --danger: #e0607e; --radius: 18px;
    `,
  },
  violeta_royal: {
    name: "Violeta Royal",
    cssVars: `
      --bg-color: #1a0f2e; --card-bg: #241640; --primary: #ffffff; --on-primary: #1a0f2e; --accent-gold: #a855f7; --on-accent: #1a0f2e;
      --text-main: #f3ebff; --text-muted: #a996c4; --border-color: #32204f;
      --whatsapp: #25D366; --danger: #f87171; --radius: 14px;
    `,
  },
  ciruela_oscura: {
    name: "Ciruela Oscura",
    cssVars: `
      --bg-color: #fdf7fb; --card-bg: #ffffff; --primary: #5b2a5e; --on-primary: #ffffff; --accent-gold: #c084c0; --on-accent: #3d1a3f;
      --text-main: #3f1f41; --text-muted: #9c7f9e; --border-color: #eeddef;
      --whatsapp: #25D366; --danger: #c1666b; --radius: 12px;
    `,
  },
  orquidea_neon: {
    name: "Orquídea Neón",
    cssVars: `
      --bg-color: #12081a; --card-bg: #1d0f2b; --primary: #ffffff; --on-primary: #12081a; --accent-gold: #e935c0; --on-accent: #ffffff;
      --text-main: #fbe9f8; --text-muted: #b58bb0; --border-color: #2c1a3a;
      --whatsapp: #25D366; --danger: #ff3d71; --radius: 10px;
    `,
  },
  rosa_pastel_dulce: {
    name: "Rosa Pastel Dulce",
    cssVars: `
      --bg-color: #fff5f8; --card-bg: #ffffff; --primary: #b3446c; --on-primary: #ffffff; --accent-gold: #ffc2d8; --on-accent: #7a2e4a;
      --text-main: #5c2e40; --text-muted: #a9808f; --border-color: #fbdde8;
      --whatsapp: #25D366; --danger: #e0607e; --radius: 20px;
    `,
  },
  halloween_especial: {
    name: "Halloween 🎃",
    cssVars: `
      --bg-color: #150f1e; --card-bg: #1f1730; --primary: #ff7518; --on-primary: #150f1e; --accent-gold: #7c3aed; --on-accent: #ffffff;
      --text-main: #f3e9ff; --text-muted: #a996c4; --border-color: #2c2040;
      --whatsapp: #25D366; --danger: #ff3d71; --radius: 10px;
    `,
    decorEmojis: ['🎃','👻','🦇','🕸️'],
  },
  navidad_magica: {
    name: "Navidad Mágica ❄️",
    cssVars: `
      --bg-color: #fdfefe; --card-bg: #ffffff; --primary: #b91c1c; --on-primary: #ffffff; --accent-gold: #146c43; --on-accent: #ffffff;
      --text-main: #1f2d27; --text-muted: #7c9186; --border-color: #dcece3;
      --whatsapp: #25D366; --danger: #b91c1c; --radius: 14px;
    `,
    decorEmojis: ['❄️','🎅','🎁','🧣'],
  },
  oceano_azul: {
    name: "Océano Azul",
    cssVars: `
      --bg-color: #f0f9ff; --card-bg: #ffffff; --primary: #075985; --on-primary: #ffffff; --accent-gold: #38bdf8; --on-accent: #0c4a6e;
      --text-main: #0c3a4f; --text-muted: #7ea0b0; --border-color: #d7ecf5;
      --whatsapp: #25D366; --danger: #e63946; --radius: 14px;
    `,
  },
  medianoche_azul: {
    name: "Medianoche Azul",
    cssVars: `
      --bg-color: #0a0e1a; --card-bg: #131b2e; --primary: #ffffff; --on-primary: #0a0e1a; --accent-gold: #3b82f6; --on-accent: #0a0e1a;
      --text-main: #e8eefc; --text-muted: #8b96b5; --border-color: #1e2740;
      --whatsapp: #25D366; --danger: #f87171; --radius: 12px;
    `,
  },
  coral_vivo: {
    name: "Coral Vivo",
    cssVars: `
      --bg-color: #fff5f0; --card-bg: #ffffff; --primary: #c2410c; --on-primary: #ffffff; --accent-gold: #fb923c; --on-accent: #431407;
      --text-main: #4a2413; --text-muted: #a98771; --border-color: #fce0cf;
      --whatsapp: #25D366; --danger: #e63946; --radius: 16px;
    `,
  },
  turquesa_caribe: {
    name: "Turquesa Caribe",
    cssVars: `
      --bg-color: #ecfeff; --card-bg: #ffffff; --primary: #0e7490; --on-primary: #ffffff; --accent-gold: #22d3ee; --on-accent: #083344;
      --text-main: #0b3b45; --text-muted: #6c99a3; --border-color: #cff3f8;
      --whatsapp: #25D366; --danger: #e63946; --radius: 18px;
    `,
  },
  mostaza_retro: {
    name: "Mostaza Retro",
    cssVars: `
      --bg-color: #fdf8ee; --card-bg: #ffffff; --primary: #7c5e10; --on-primary: #ffffff; --accent-gold: #eab308; --on-accent: #422006;
      --text-main: #402f08; --text-muted: #94814f; --border-color: #f0e2bd;
      --whatsapp: #25D366; --danger: #c1440e; --radius: 8px;
    `,
  },
  vino_tinto: {
    name: "Vino Tinto",
    cssVars: `
      --bg-color: #fdf6f6; --card-bg: #ffffff; --primary: #6b1d2c; --on-primary: #ffffff; --accent-gold: #b23a48; --on-accent: #ffffff;
      --text-main: #3d1418; --text-muted: #9c7a7e; --border-color: #f0d9dc;
      --whatsapp: #25D366; --danger: #6b1d2c; --radius: 10px;
    `,
  },
  grafito_urbano: {
    name: "Grafito Urbano",
    cssVars: `
      --bg-color: #f4f4f5; --card-bg: #ffffff; --primary: #27272a; --on-primary: #ffffff; --accent-gold: #71717a; --on-accent: #ffffff;
      --text-main: #242426; --text-muted: #8b8b8f; --border-color: #e4e4e7;
      --whatsapp: #25D366; --danger: #dc2626; --radius: 6px;
    `,
  },
  champan_lujo: {
    name: "Champán Lujo",
    cssVars: `
      --bg-color: #fdfaf3; --card-bg: #ffffff; --primary: #8a6d3b; --on-primary: #ffffff; --accent-gold: #e8d5a3; --on-accent: #4a3a1a;
      --text-main: #42341c; --text-muted: #998a6c; --border-color: #efe6cf;
      --whatsapp: #25D366; --danger: #c1440e; --radius: 16px;
    `,
  },
  denim_casual: {
    name: "Denim Casual",
    cssVars: `
      --bg-color: #f5f8fc; --card-bg: #ffffff; --primary: #1e3a5f; --on-primary: #ffffff; --accent-gold: #5b8fc9; --on-accent: #0a1929;
      --text-main: #16283d; --text-muted: #7b93aa; --border-color: #dbe6f0;
      --whatsapp: #25D366; --danger: #e63946; --radius: 14px;
    `,
  },
  terracota_calida: {
    name: "Terracota Cálida",
    cssVars: `
      --bg-color: #fdf5f0; --card-bg: #ffffff; --primary: #a0522d; --on-primary: #ffffff; --accent-gold: #e08e5b; --on-accent: #3d1f0f;
      --text-main: #432617; --text-muted: #a3826f; --border-color: #f2ddd0;
      --whatsapp: #25D366; --danger: #c1440e; --radius: 12px;
    `,
  },
  cereza_dulce: {
    name: "Cereza Dulce",
    cssVars: `
      --bg-color: #fff0f3; --card-bg: #ffffff; --primary: #9d174d; --on-primary: #ffffff; --accent-gold: #f472b6; --on-accent: #500724;
      --text-main: #4a0f28; --text-muted: #a5798e; --border-color: #fbdce7;
      --whatsapp: #25D366; --danger: #e0607e; --radius: 20px;
    `,
  },
  zafiro_profundo: {
    name: "Zafiro Profundo",
    cssVars: `
      --bg-color: #060e1f; --card-bg: #0d1a33; --primary: #ffffff; --on-primary: #060e1f; --accent-gold: #2563eb; --on-accent: #ffffff;
      --text-main: #e3ecfb; --text-muted: #7f93bd; --border-color: #152648;
      --whatsapp: #25D366; --danger: #f87171; --radius: 10px;
    `,
  },
  ambar_otonal: {
    name: "Ámbar Otoñal",
    cssVars: `
      --bg-color: #fef7ed; --card-bg: #ffffff; --primary: #92400e; --on-primary: #ffffff; --accent-gold: #f59e0b; --on-accent: #451a03;
      --text-main: #442008; --text-muted: #a1855e; --border-color: #f5e2bf;
      --whatsapp: #25D366; --danger: #c1440e; --radius: 14px;
    `,
  },
  jade_mistico: {
    name: "Jade Místico",
    cssVars: `
      --bg-color: #f0fdfa; --card-bg: #ffffff; --primary: #115e59; --on-primary: #ffffff; --accent-gold: #2dd4bf; --on-accent: #042f2e;
      --text-main: #0a3733; --text-muted: #6f9c95; --border-color: #d6f2ec;
      --whatsapp: #25D366; --danger: #e63946; --radius: 16px;
    `,
  },
  arena_desierto: {
    name: "Arena del Desierto",
    cssVars: `
      --bg-color: #fdf9f0; --card-bg: #ffffff; --primary: #78350f; --on-primary: #ffffff; --accent-gold: #d4a86a; --on-accent: #3d2410;
      --text-main: #3f2711; --text-muted: #a08a6d; --border-color: #f0e3cc;
      --whatsapp: #25D366; --danger: #c1440e; --radius: 10px;
    `,
  },
  noche_estrellada: {
    name: "Noche Estrellada",
    cssVars: `
      --bg-color: #0a0f2c; --card-bg: #131a44; --primary: #ffffff; --on-primary: #0a0f2c; --accent-gold: #fbbf24; --on-accent: #0a0f2c;
      --text-main: #eef0fb; --text-muted: #8891b8; --border-color: #1d2650;
      --whatsapp: #25D366; --danger: #f87171; --radius: 14px;
    `,
  },
  algodon_azucar: {
    name: "Algodón de Azúcar",
    cssVars: `
      --bg-color: #f5f0ff; --card-bg: #ffffff; --primary: #7c6bab; --on-primary: #ffffff; --accent-gold: #ffb3d9; --on-accent: #4a2740;
      --text-main: #452c5c; --text-muted: #9c8fbd; --border-color: #e9e0f7;
      --whatsapp: #25D366; --danger: #e0607e; --radius: 20px;
    `,
  },
  rubi_elegante: {
    name: "Rubí Elegante",
    cssVars: `
      --bg-color: #fff5f5; --card-bg: #ffffff; --primary: #991b1b; --on-primary: #ffffff; --accent-gold: #ef4444; --on-accent: #ffffff;
      --text-main: #450a0a; --text-muted: #a37e7e; --border-color: #f7d9d9;
      --whatsapp: #25D366; --danger: #991b1b; --radius: 12px;
    `,
  },
  marfil_clasico: {
    name: "Marfil Clásico",
    cssVars: `
      --bg-color: #fffdf7; --card-bg: #ffffff; --primary: #57534e; --on-primary: #ffffff; --accent-gold: #d6c7a1; --on-accent: #292524;
      --text-main: #2b2723; --text-muted: #9c9388; --border-color: #ece5d3;
      --whatsapp: #25D366; --danger: #c1440e; --radius: 10px;
    `,
  },
  verano_citrico: {
    name: "Verano Cítrico",
    cssVars: `
      --bg-color: #fffbeb; --card-bg: #ffffff; --primary: #b45309; --on-primary: #ffffff; --accent-gold: #fde047; --on-accent: #422006;
      --text-main: #432a05; --text-muted: #a68a52; --border-color: #f7ecc0;
      --whatsapp: #25D366; --danger: #c1440e; --radius: 16px;
    `,
  },
  bosque_nocturno: {
    name: "Bosque Nocturno",
    cssVars: `
      --bg-color: #0c1810; --card-bg: #16241a; --primary: #ffffff; --on-primary: #0c1810; --accent-gold: #4ade80; --on-accent: #0c1810;
      --text-main: #e6f5eb; --text-muted: #83a693; --border-color: #1f3327;
      --whatsapp: #25D366; --danger: #f87171; --radius: 10px;
    `,
  },
  rosa_gold_lujo: {
    name: "Rosa Gold Lujo",
    cssVars: `
      --bg-color: #fff8f5; --card-bg: #ffffff; --primary: #9a3b3b; --on-primary: #ffffff; --accent-gold: #f0c1a0; --on-accent: #4a2418;
      --text-main: #4a231a; --text-muted: #a68a7c; --border-color: #f5e2d5;
      --whatsapp: #25D366; --danger: #c1440e; --radius: 18px;
    `,
  },
  cobre_rustico: {
    name: "Cobre Rústico",
    cssVars: `
      --bg-color: #fbf4ee; --card-bg: #ffffff; --primary: #7c3f1d; --on-primary: #ffffff; --accent-gold: #c47a4a; --on-accent: #2e1a0d;
      --text-main: #33200f; --text-muted: #997a63; --border-color: #ecdccb;
      --whatsapp: #25D366; --danger: #c1440e; --radius: 8px;
    `,
  },
  perla_nordica: {
    name: "Perla Nórdica",
    cssVars: `
      --bg-color: #f8fafc; --card-bg: #ffffff; --primary: #334155; --on-primary: #ffffff; --accent-gold: #94a3b8; --on-accent: #0f172a;
      --text-main: #1e293b; --text-muted: #8496ab; --border-color: #e2e8f0;
      --whatsapp: #25D366; --danger: #dc2626; --radius: 8px;
    `,
  },
  fucsia_electrico: {
    name: "Fucsia Eléctrico",
    cssVars: `
      --bg-color: #180a18; --card-bg: #241224; --primary: #ffffff; --on-primary: #180a18; --accent-gold: #e11d9c; --on-accent: #ffffff;
      --text-main: #fce8f7; --text-muted: #b58bab; --border-color: #301a30;
      --whatsapp: #25D366; --danger: #ff3d71; --radius: 10px;
    `,
  },
  cafe_tostado: {
    name: "Café Tostado",
    cssVars: `
      --bg-color: #f7f0ea; --card-bg: #ffffff; --primary: #4a2c17; --on-primary: #ffffff; --accent-gold: #a97449; --on-accent: #2a160a;
      --text-main: #2e190c; --text-muted: #977f6d; --border-color: #e6d8c9;
      --whatsapp: #25D366; --danger: #c1440e; --radius: 8px;
    `,
  },
  cielo_primaveral: {
    name: "Cielo Primaveral",
    cssVars: `
      --bg-color: #f0fbfc; --card-bg: #ffffff; --primary: #0369a1; --on-primary: #ffffff; --accent-gold: #86efac; --on-accent: #14532d;
      --text-main: #123c47; --text-muted: #7098a3; --border-color: #d5eef0;
      --whatsapp: #25D366; --danger: #e63946; --radius: 18px;
    `,
  },
  vintage_sepia: {
    name: "Vintage Sepia",
    cssVars: `
      --bg-color: #f5efe3; --card-bg: #fffdf8; --primary: #6b4423; --on-primary: #ffffff; --accent-gold: #c9a876; --on-accent: #3d2914;
      --text-main: #3d2e1c; --text-muted: #93816a; --border-color: #e6dac2;
      --whatsapp: #25D366; --danger: #a83232; --radius: 10px;
    `,
  },
  neon_ciberpunk: {
    name: "Neón Ciberpunk",
    cssVars: `
      --bg-color: #05050a; --card-bg: #0f0f1e; --primary: #ffffff; --on-primary: #05050a; --accent-gold: #ff2e97; --on-accent: #05050a;
      --text-main: #f0eefc; --text-muted: #8f8fb0; --border-color: #1c1c30;
      --whatsapp: #25D366; --danger: #ff3d71; --radius: 6px;
    `,
  },
  menta_chocolate: {
    name: "Menta Chocolate",
    cssVars: `
      --bg-color: #f2f9f5; --card-bg: #ffffff; --primary: #2d2926; --on-primary: #ffffff; --accent-gold: #6fcf97; --on-accent: #0f2417;
      --text-main: #26221f; --text-muted: #847d75; --border-color: #dcece1;
      --whatsapp: #25D366; --danger: #c1440e; --radius: 14px;
    `,
  },

  // 50 plantillas en total. Para agregar una #51, solo hace falta sumar
  // una entrada más aquí abajo con sus 6 colores base.
};

export const DEFAULT_TEMPLATE_ID = "clasica";

export function getCatalogTheme(templateId: string | undefined | null): CatalogTheme {
  return CATALOG_THEMES[templateId ?? DEFAULT_TEMPLATE_ID] ?? CATALOG_THEMES[DEFAULT_TEMPLATE_ID];
}
