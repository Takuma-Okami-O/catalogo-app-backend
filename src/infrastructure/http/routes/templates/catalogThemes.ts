export interface CatalogTheme {
  name: string;
  cssVars: string; // contenido que va dentro de :root { ... }
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
  // Las 10 plantillas prometidas ya están completas. Para agregar una #11
  // en el futuro, solo hace falta sumar una entrada más aquí abajo.
};

export const DEFAULT_TEMPLATE_ID = "clasica";

export function getCatalogTheme(templateId: string | undefined | null): CatalogTheme {
  return CATALOG_THEMES[templateId ?? DEFAULT_TEMPLATE_ID] ?? CATALOG_THEMES[DEFAULT_TEMPLATE_ID];
}
