import { Router } from "express";
import { IProductRepository, IStoreRepository, IStoreVisitRepository } from "../../../domain/repositories/ICatalogRepositories";
import { GetPublicCatalogUseCase } from "../../../application/use-cases/GetPublicCatalogUseCase";
import { RecordStoreVisitUseCase } from "../../../application/use-cases/RecordStoreVisitUseCase";
import { getCatalogTheme, CatalogTheme } from "./templates/catalogThemes";

export function buildPublicCatalogPageRoute(
  storeRepository: IStoreRepository,
  productRepository: IProductRepository,
  visitRepository: IStoreVisitRepository
) {
  const router = Router();
  const getPublicCatalogUseCase = new GetPublicCatalogUseCase(storeRepository, productRepository);
  const recordStoreVisitUseCase = new RecordStoreVisitUseCase(visitRepository);

  router.get("/catalogo/:slug", async (req, res) => {
    // Nunca cachear: el comprador siempre debe ver el catálogo tal cual
    // está en la base de datos en ese instante (productos, precios, logo).
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    try {
      const { store, products } = await getPublicCatalogUseCase.execute(req.params.slug);
      // Registrar la visita no debe nunca bloquear ni romper la carga del
      // catálogo — si falla, se ignora en silencio (no es crítico).
      recordStoreVisitUseCase.execute(store.id).catch(() => {});
      res.status(200).send(renderCatalogPage(store, products, req.params.slug));
    } catch (error) {
      res.status(404).send(renderNotFoundPage());
    }
  });

  return router;
}

function renderSocialCard(store: StoreView): string {
  const buttons: string[] = [];
  if (store.instagramUrl) {
    buttons.push(`<a class="social-btn instagram" href="${escapeHtml(store.instagramUrl)}" target="_blank" rel="noopener">Instagram</a>`);
  }
  if (store.tiktokUrl) {
    buttons.push(`<a class="social-btn tiktok" href="${escapeHtml(store.tiktokUrl)}" target="_blank" rel="noopener">TikTok</a>`);
  }
  if (store.whatsappPhone) {
    buttons.push(
      `<a class="social-btn whatsapp" href="https://wa.me/${escapeHtml(store.whatsappPhone)}" target="_blank" rel="noopener">WhatsApp</a>`
    );
  }
  if (buttons.length === 0) return "";
  return `<div class="social-card"><p class="social-card-title">Conéctate con nosotros</p><div class="social-buttons">${buttons.join("")}</div></div>`;
}

function renderTestimonialsSection(store: StoreView): string {
  const urls = store.testimonialUrls ?? [];
  if (urls.length === 0) return "";
  const imagesHtml = urls
    .map((url) => `<img src="${escapeHtml(url)}" alt="Comprador satisfecho" loading="lazy" onclick="abrirTestimonio('${escapeJs(url)}')" />`)
    .join("");
  return `
    <div class="social-card">
      <p class="social-card-title">Lo que dicen nuestros clientes</p>
      <div class="testimonials-scroll">${imagesHtml}</div>
    </div>`;
}

/**
 * Decoración flotante sutil, solo para plantillas especiales (Halloween,
 * Navidad) que definan `decorEmojis` — genera ~14 emojis con distinta
 * posición/velocidad/tamaño, cayendo lento por toda la pantalla, sin
 * bloquear ningún clic (pointer-events: none).
 */
function renderFestiveDecor(theme: CatalogTheme): string {
  if (!theme.decorEmojis || theme.decorEmojis.length === 0) return "";
  const spans = Array.from({ length: 10 })
    .map((_, i) => {
      const emoji = theme.decorEmojis![i % theme.decorEmojis!.length];
      const left = Math.round((i * 137.5) % 100); // distribución pseudo-aleatoria pero determinista
      const duration = 10 + (i % 5) * 3; // entre 10s y 22s
      const delay = (i % 7) * 1.3;
      const size = 0.85 + (i % 3) * 0.2;
      return `<span style="left:${left}%; animation-duration:${duration}s; animation-delay:${delay}s; font-size:${size}rem;">${emoji}</span>`;
    })
    .join("");
  return `<div class="festive-decor">${spans}</div>`;
}

/** El trineo de Santa: solo aparece si el tema tiene `santaSleigh: true`.
 *  Ilustración propia en SVG (formas vectoriales planas), no emojis —
 *  reno corriendo, jalando un trineo con Santa saludando adentro. */
function renderSantaSleigh(theme: CatalogTheme): string {
  if (!theme.santaSleigh) return "";
  const svg = `
    <svg viewBox="0 0 320 150" xmlns="http://www.w3.org/2000/svg">
      <!-- Cuerda que conecta el trineo con el reno -->
      <path d="M175,100 Q205,80 228,92" stroke="#8a5a34" stroke-width="3" fill="none" stroke-linecap="round"/>

      <!-- Reno -->
      <g>
        <!-- patas -->
        <rect x="222" y="100" width="7" height="26" rx="3.5" fill="#a9713f" transform="rotate(18 225 113)"/>
        <rect x="240" y="102" width="7" height="26" rx="3.5" fill="#a9713f" transform="rotate(-8 243 115)"/>
        <rect x="258" y="100" width="7" height="26" rx="3.5" fill="#a9713f" transform="rotate(22 261 113)"/>
        <rect x="272" y="98" width="7" height="26" rx="3.5" fill="#a9713f" transform="rotate(-14 275 111)"/>
        <!-- cuerpo -->
        <ellipse cx="252" cy="92" rx="36" ry="21" fill="#c68958"/>
        <ellipse cx="256" cy="102" rx="21" ry="10" fill="#f3d9b1"/>
        <!-- cola -->
        <ellipse cx="216" cy="88" rx="6" ry="5" fill="#a9713f"/>
        <!-- cabeza -->
        <ellipse cx="292" cy="76" rx="18" ry="16" fill="#c68958"/>
        <ellipse cx="306" cy="84" rx="10" ry="7.5" fill="#f3d9b1"/>
        <circle cx="315" cy="84" r="5.5" fill="#e6483c"/>
        <circle cx="296" cy="70" r="2.3" fill="#2b2320"/>
        <ellipse cx="280" cy="62" rx="5" ry="8" fill="#c68958" transform="rotate(-20 280 62)"/>
        <ellipse cx="300" cy="58" rx="5" ry="8" fill="#c68958" transform="rotate(10 300 58)"/>
        <!-- astas -->
        <path d="M284,58 L278,42 M278,42 L272,36 M278,42 L284,38" stroke="#7a5230" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M300,52 L302,36 M302,36 L296,30 M302,36 L308,32" stroke="#7a5230" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </g>

      <!-- Trineo -->
      <g>
        <path d="M40,128 Q30,128 30,120 L30,108 Q65,102 110,106 L175,110 Q182,110 182,118 L182,124 Q182,130 175,130 L46,130 Q40,130 40,128 Z" fill="#d1272c"/>
        <path d="M22,134 Q30,140 45,134 L178,134 Q188,140 198,134" stroke="#f2b705" stroke-width="6" fill="none" stroke-linecap="round"/>
        <rect x="55" y="90" width="55" height="20" rx="8" fill="#1f7a4d"/>
        <!-- Santa sentado -->
        <ellipse cx="95" cy="98" rx="24" ry="20" fill="#d1272c"/>
        <circle cx="98" cy="78" r="14" fill="#f0b892"/>
        <path d="M84,80 Q98,102 114,80 Q116,96 98,100 Q80,96 84,80 Z" fill="#ffffff"/>
        <path d="M84,70 Q98,52 116,68 Q120,58 108,50 Q96,44 86,52 Q78,58 84,70 Z" fill="#d1272c"/>
        <circle cx="118" cy="52" r="6" fill="#ffffff"/>
        <rect x="83" y="66" width="30" height="8" rx="4" fill="#ffffff"/>
        <circle cx="92" cy="80" r="1.8" fill="#2b2320"/>
        <circle cx="104" cy="80" r="1.8" fill="#2b2320"/>
        <ellipse cx="118" cy="92" rx="8" ry="6" fill="#f0b892" transform="rotate(-25 118 92)"/>
      </g>
    </svg>
  `;
  return `<div class="santa-sleigh-lane"><div class="santa-sleigh-wrap">${svg}</div></div>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeJs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/**
 * Cloudinary a veces optimiza automáticamente el formato/calidad de las
 * imágenes, y esa optimización puede entregar un GIF como una imagen
 * ESTÁTICA (solo el primer cuadro) en vez de animada — sobre todo si la
 * cuenta tiene activada la optimización automática a nivel global.
 * "f_gif" fuerza el formato de salida; "fl_animated" fuerza explícitamente
 * a preservar TODOS los cuadros de la animación. Juntos garantizan que
 * el GIF se vea animado sin importar la configuración de la cuenta,
 * sin volver a subir el archivo ni tocar la base de datos.
 */
function withAnimatedGifDelivery(url: string): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  if (url.includes("/upload/f_gif,fl_animated")) return url;
  // Si ya tenía un "f_gif" suelto de una versión anterior del código,
  // lo reemplazamos por la combinación completa en vez de duplicarlo.
  const cleaned = url.replace("/upload/f_gif/", "/upload/");
  return cleaned.replace("/upload/", "/upload/f_gif,fl_animated/");
}

interface StoreView {
  name: string;
  logoUrl: string | null;
  whatsappPhone: string;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  templateId?: string;
  testimonialUrls?: string[];
  rif?: string | null;
  isVerified?: boolean;
}
interface ProductView {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  gifUrl: string | null;
  images: string[];
  videoUrl: string | null;
  available: boolean;
  isFeatured: boolean;
  stockCount: number | null;
  isEffectivelyAvailable: boolean;
  saleDiscountPercent: number | null;
  saleEndsAt: Date | string | null;
  createdAt: Date | string;
}

function renderCatalogPage(store: StoreView, products: ProductView[], slug: string): string {
  // Configurable por variables de entorno, para no tener que tocar código
  // cada vez que cambien el link de descarga o el sitio de la empresa.
  const APP_DOWNLOAD_URL = process.env.APP_DOWNLOAD_URL || "#";
  const PLATFORM_NAME = process.env.PLATFORM_NAME || "Catálogo App";
  const COMPANY_NAME = process.env.COMPANY_NAME || "TĀKŪMĀ Group";
  const COMPANY_WEBSITE_URL = process.env.COMPANY_WEBSITE_URL || "#";
  // El botón dorado de promoción de la app queda listo y diseñado, pero
  // oculto hasta que la app esté publicada en Play Store/App Store.
  // Actívalo poniendo SHOW_APP_PROMO="true" en tu .env cuando llegue el momento.
  const SHOW_APP_PROMO = process.env.SHOW_APP_PROMO === "true";

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const categoryButtonsHtml = categories
    .map((c) => `<button class="cat-btn" onclick="filtrarCategoria('${escapeJs(c)}', this)">${escapeHtml(c)}</button>`)
    .join("");

  const productsJson = JSON.stringify(
    products.map((p) => {
      const createdAtMs = new Date(p.createdAt).getTime();
      const isNew = Date.now() - createdAtMs < 7 * 24 * 60 * 60 * 1000; // 7 días
      return {
        id: p.id,
        nombre: p.name,
        categoria: p.category,
        precio: p.price,
        disponible: p.isEffectivelyAvailable,
        imagen: p.gifUrl ? withAnimatedGifDelivery(p.gifUrl) : p.imageUrl,
        imagenes: [p.gifUrl ? withAnimatedGifDelivery(p.gifUrl) : p.imageUrl, ...(p.images || [])],
        video: p.videoUrl || null,
        destacado: p.isFeatured,
        stock: p.stockCount,
        nuevo: isNew,
        creadoEn: createdAtMs,
        ofertaPct: p.saleDiscountPercent,
        ofertaFin: p.saleEndsAt ? new Date(p.saleEndsAt).getTime() : null,
      };
    })
  );

  const theme = getCatalogTheme(store.templateId);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(store.name)} · Catálogo</title>
<style>
  :root {
    ${theme.cssVars}
  }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body { background: var(--bg-color); color: var(--text-main); padding-bottom: 110px; -webkit-font-smoothing: antialiased; }
  header { background: var(--card-bg); backdrop-filter: blur(10px); padding: 14px 20px; border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 100; }
  .header-content { max-width: 600px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .brand-info { display: flex; align-items: center; gap: 12px; }
  .logo-container { width: 48px; height: 48px; border-radius: 50%; overflow: hidden; border: 1px solid var(--accent-gold); box-shadow: 0 4px 12px rgba(197,155,39,0.2); background: #f2efe9; }
  .logo-container img { width: 100%; height: 100%; object-fit: cover; }
  .brand-title { font-size: 1rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--text-main); display: flex; align-items: center; gap: 5px; }
  .verified-badge { color: #2dd4bf; font-size: 0.85em; }
  .brand-rif { font-size: 0.6rem; color: var(--text-muted); letter-spacing: 0.5px; margin-top: 1px; }
  .brand-sub { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; }
  .status-tag { background: #f4f6f4; color: #2d6a4f; font-size: 0.65rem; font-weight: 700; padding: 5px 10px; border-radius: 20px; display: flex; align-items: center; gap: 5px; letter-spacing: 0.5px; text-transform: uppercase; }
  .status-dot { width: 5px; height: 5px; background: #2d6a4f; border-radius: 50%; }
  .promo-btn { background: linear-gradient(135deg, #c59b27, #e0b84a); color: #1a1a1a; font-size: 0.65rem; font-weight: 800; padding: 8px 14px; border-radius: 20px; display: flex; align-items: center; gap: 5px; letter-spacing: 0.3px; text-transform: uppercase; text-decoration: none; box-shadow: 0 3px 8px rgba(197,155,39,0.35); white-space: nowrap; }
  .promo-btn:active { transform: scale(0.97); }
  main { max-width: 600px; margin: 0 auto; padding: 16px; }
  .search-box { margin-bottom: 16px; }
  .search-input { width: 100%; padding: 14px 16px; border: 1px solid var(--border-color); border-radius: var(--radius); background: var(--card-bg); font-size: 0.85rem; color: var(--text-main); outline: none; box-shadow: 0 2px 6px rgba(0,0,0,0.01); }
  .search-input:focus { border-color: var(--primary); box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
  .categories { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 20px; scrollbar-width: none; }
  .categories::-webkit-scrollbar { display: none; }
  .cat-btn { background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-muted); padding: 8px 16px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; cursor: pointer; }
  .cat-btn.active { background: var(--primary); color: var(--on-primary); border-color: var(--primary); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
  .products-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .product-card { background: var(--card-bg); border-radius: var(--radius); border: 1px solid var(--border-color); overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  .img-container { position: relative; width: 100%; padding-top: 110%; background: #f2efe9; overflow: hidden; }
  .img-container img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; }
  .badge-stack { position: absolute; top: 10px; left: 10px; right: 10px; display: flex; flex-direction: column; align-items: flex-start; gap: 5px; pointer-events: none; }
  .tag-stock { background: var(--card-bg); backdrop-filter: blur(4px); color: var(--text-main); font-size: 0.6rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
  .tag-stock.out { background: var(--primary); color: var(--on-primary); }
  .tag-featured { background: var(--accent-gold); color: var(--on-accent); font-size: 0.6rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
  .tag-new { background: #2563eb; color: #ffffff; font-size: 0.6rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
  .tag-low-stock { background: #dc2626; color: #ffffff; font-size: 0.6rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
  .tag-sale { background: #dc2626; color: #ffffff; font-size: 0.6rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
  .fav-btn { position: absolute; bottom: 8px; right: 8px; width: 30px; height: 30px; border-radius: 50%; background: var(--card-bg); border: none; font-size: 1rem; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
  .sale-price-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .price-original { font-size: 0.75rem; color: var(--text-muted); text-decoration: line-through; }
  .sale-countdown { font-size: 0.6rem; color: #dc2626; font-weight: 700; margin-top: 2px; }
  .toolbar-row { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; }
  .sort-select { flex-shrink: 0; background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-main); padding: 8px 10px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
  .cat-btn.fav-filter.active { background: #dc2626; border-color: #dc2626; color: #ffffff; }
  .product-card.featured { border: 1.5px solid var(--accent-gold); }
  .product-info { padding: 12px; }
  .product-cat { font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 1px; margin-bottom: 2px; }
  .product-title { font-size: 0.8rem; font-weight: 500; color: var(--text-main); margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.25; }
  .product-price { font-size: 0.95rem; font-weight: 700; color: var(--primary); letter-spacing: -0.5px; }
  .btn-add { display: flex; align-items: center; justify-content: center; gap: 6px; width: calc(100% - 24px); margin: 0 12px 12px 12px; padding: 10px 0; background: var(--primary); color: var(--on-primary); font-size: 0.75rem; font-weight: 600; border-radius: 8px; border: none; cursor: pointer; letter-spacing: 0.5px; }
  .btn-add.disabled { background: #e5e0dc; color: #a39e9a; cursor: not-allowed; }
  .cart-bar { position: fixed; bottom: 20px; left: 16px; right: 16px; max-width: 568px; margin: 0 auto; background: rgba(26,26,26,0.95); backdrop-filter: blur(12px); color: #fff; border-radius: 16px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 200; transform: translateY(150%); transition: transform 0.35s cubic-bezier(0.175,0.885,0.32,1.275); cursor: pointer; }
  .cart-bar.visible { transform: translateY(0); }
  .cart-info { font-size: 0.8rem; font-weight: 500; display: flex; align-items: center; gap: 8px; }
  .cart-total { color: #f4d35e; font-weight: 700; font-size: 1rem; }
  .cart-action-hint { font-size: 0.75rem; background: rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 20px; font-weight: 600; }
   .agent-bubble { position: fixed; bottom: 20px; right: 16px; width: 56px; height: 56px; border-radius: 50%; background: #1c1c1e; color: #fff; border: none; font-size: 1.5rem; box-shadow: 0 8px 20px rgba(0,0,0,0.35); cursor: pointer; z-index: 250; display: flex; align-items: center; justify-content: center; transition: transform 0.2s ease; }
  .agent-bubble-badge { position: absolute; top: -4px; right: -4px; background: #ffd60a; color: #1a1a1a; font-size: 0.55rem; font-weight: 800; padding: 2px 5px; border-radius: 10px; letter-spacing: 0.3px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
  .agent-bubble:active { transform: scale(0.92); }
  .agent-panel { position: fixed; bottom: 0; right: 0; left: 0; margin: 0 auto; max-width: 380px; width: 94%; max-height: 70vh; background: #1c1c1e; color: #f5f5f5; border-radius: 18px 18px 0 0; box-shadow: 0 -12px 35px rgba(0,0,0,0.4); z-index: 260; display: flex; flex-direction: column; transform: translateY(120%); transition: transform 0.3s cubic-bezier(0.1,0.9,0.2,1); forced-color-adjust: none; }
  .agent-panel.open { transform: translateY(0); }
  .agent-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #2f2f31; }
  .agent-panel-header h4 { font-size: 0.9rem; font-weight: 700; color: #f5f5f5; }
  .agent-panel-header span { font-size: 0.65rem; color: #9a9a9d; display: block; margin-top: 2px; }
  .agent-panel-close { background: none; border: none; font-size: 1rem; color: #9a9a9d; cursor: pointer; }
  .agent-messages { flex: 1; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; min-height: 180px; }
  .agent-msg { max-width: 82%; padding: 9px 13px; border-radius: 14px; font-size: 0.82rem; line-height: 1.4; white-space: pre-wrap; }
  .agent-msg.user { align-self: flex-end; background: #2563eb; color: #fff; border-bottom-right-radius: 4px; }
  .agent-msg.assistant { align-self: flex-start; background: #2f2f31; color: #f5f5f5; border-bottom-left-radius: 4px; }
  .agent-msg.typing { align-self: flex-start; font-style: italic; color: #9a9a9d; background: none; padding: 0 4px; }
  .agent-input-row { display: flex; gap: 8px; padding: 10px 12px 14px; border-top: 1px solid #2f2f31; }
  .agent-input-row input { flex: 1; border: 1px solid #3a3a3d; border-radius: 20px; padding: 9px 14px; font-size: 0.82rem; background: #2a2a2c; color: #f5f5f5; -webkit-appearance: none; appearance: none; color-scheme: dark; forced-color-adjust: none; }
  .agent-input-row input::placeholder { color: #8a8a8d; }
  .agent-input-row button { background: #2563eb; color: #fff; border: none; border-radius: 50%; width: 38px; height: 38px; font-size: 0.9rem; cursor: pointer; flex-shrink: 0; }
  .cart-modal { position: fixed; bottom: 0; left: 0; right: 0; background: var(--card-bg); color: var(--text-main); border-top-left-radius: 24px; border-top-right-radius: 24px; box-shadow: 0 -15px 40px rgba(0,0,0,0.15); z-index: 300; max-height: 80vh; display: flex; flex-direction: column; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.1,0.9,0.2,1); }
  .cart-modal.open { transform: translateY(0); }
  .modal-header { padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
  .modal-title { font-size: 0.95rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .close-modal { background: #f2efe9; color: #1a1a1a; border: none; width: 30px; height: 30px; border-radius: 50%; font-size: 0.9rem; cursor: pointer; }
  .modal-body { padding: 16px 20px; overflow-y: auto; max-height: 40vh; }
  .cart-item-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color); }
  .cart-item-details h4 { font-size: 0.8rem; font-weight: 600; margin-bottom: 2px; }
  .cart-item-details p { font-size: 0.75rem; color: var(--text-muted); }
  .cart-item-controls { display: flex; align-items: center; gap: 10px; }
  .qty-btn { width: 28px; height: 28px; background: #f2efe9; color: #1a1a1a; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
  .delete-btn { background: none; border: none; color: var(--danger); font-size: 1rem; cursor: pointer; padding: 4px; margin-left: 4px; }
  .modal-footer { padding: 20px; border-top: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); display: flex; flex-direction: column; gap: 12px; }
  .modal-total-row { display: flex; justify-content: space-between; font-weight: 700; font-size: 0.95rem; }
  .btn-checkout { background: var(--whatsapp); color: #fff; border: none; padding: 14px; border-radius: var(--radius); font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; width: 100%; box-shadow: 0 4px 12px rgba(37,211,102,0.3); }
  .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 250; display: none; }
  .backdrop.active { display: block; }
  .lightbox { position: fixed; inset: 0; z-index: 400; display: none; align-items: center; justify-content: center; padding: 24px; }
  .lightbox.open { display: flex; }
  .lightbox-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.85); }
  .lightbox-content { position: relative; max-width: 480px; width: 100%; background: var(--card-bg); color: var(--text-main); border-radius: 20px; overflow: hidden; z-index: 1; }
  .lightbox-content img { width: 100%; height: 320px; object-fit: cover; }
  .lightbox-slides { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .lightbox-slides::-webkit-scrollbar { display: none; }
  .lightbox-slide { flex: 0 0 100%; scroll-snap-align: start; }
  .lightbox-slide img, .lightbox-slide video { width: 100%; height: 320px; object-fit: cover; display: block; background: #000; }
  .lightbox-dots { display: flex; justify-content: center; gap: 6px; padding: 10px 0 0; }
  .lightbox-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border-color); transition: background 0.2s; }
  .lightbox-dot.active { background: var(--primary); }
  .lightbox-info { padding: 18px; }
  .lightbox-close { position: absolute; top: 12px; right: 12px; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.9); border: none; font-size: 1rem; cursor: pointer; z-index: 2; }
  .testimonial-lightbox { position: fixed; inset: 0; z-index: 410; display: none; align-items: center; justify-content: center; padding: 20px; }
  .testimonial-lightbox.open { display: flex; }
  .testimonial-lightbox-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.92); }
  .testimonial-lightbox-content { position: relative; max-width: 640px; width: 100%; max-height: 92vh; z-index: 1; display: flex; align-items: center; justify-content: center; }
  .testimonial-lightbox-content img { max-width: 100%; max-height: 92vh; object-fit: contain; border-radius: 12px; }
  .testimonial-lightbox-close { position: absolute; top: -6px; right: -6px; width: 36px; height: 36px; border-radius: 50%; background: #ffffff; color: #1a1a1a; border: none; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
  .testimonials-scroll img { cursor: zoom-in; }
  .festive-decor { position: fixed; inset: 0; pointer-events: none; z-index: 5; overflow: hidden; }
  .festive-decor span { position: absolute; top: -40px; font-size: 1.2rem; opacity: 0.4; animation: festive-fall linear infinite; }
  @keyframes festive-fall {
    0% { transform: translateY(-40px) rotate(0deg); }
    100% { transform: translateY(110vh) rotate(360deg); }
  }
  /* Gorrito navideño decorativo encima de cada precio (puro CSS, sin depender de emojis) */
  body.theme-santa-hats .product-price { position: relative; }
  body.theme-santa-hats .product-price::before {
    content: ''; position: absolute; top: -11px; left: -3px; width: 0; height: 0;
    border-left: 7px solid transparent; border-right: 7px solid transparent; border-bottom: 12px solid #c0392b;
    transform: rotate(-18deg); transform-origin: bottom left;
  }
  body.theme-santa-hats .product-price::after {
    content: ''; position: absolute; top: -15px; left: -6px; width: 6px; height: 6px;
    background: #fff; border-radius: 50%;
  }
  /* Trineo de Santa: cruza la pantalla de vez en cuando, muy abajo del header y
     con pointer-events:none, así nunca tapa ni bloquea botones/anuncios.
     Diseño tipo "estrella fugaz": Santa con una estela de brillo detrás,
     en vez de varios emojis pegados (se veía desordenado). */
  .santa-sleigh-lane { position: fixed; top: 68px; left: 0; width: 100%; height: 44px; pointer-events: none; z-index: 6; overflow: hidden; }
  .santa-sleigh-wrap { position: absolute; left: -25%; top: 50%; transform: translateY(-50%); display: flex; align-items: center; animation: santa-fly 32s linear infinite; animation-delay: 6s; }
  .santa-sleigh-wrap svg { width: 150px; height: auto; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3)); }
  @keyframes santa-fly {
    0% { left: -25%; opacity: 0; }
    6% { opacity: 1; }
    42% { opacity: 1; }
    50% { left: 115%; opacity: 0; }
    100% { left: 115%; opacity: 0; }
  }
  footer { text-align: center; margin-top: 40px; font-size: 0.7rem; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; }
  .social-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 16px; margin-bottom: 16px; text-align: center; }
  .social-card-title { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); margin-bottom: 12px; }
  .social-buttons { display: flex; gap: 10px; }
  .social-btn { flex: 1; padding: 12px 0; border-radius: 10px; color: #fff; font-weight: 700; font-size: 0.8rem; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .social-btn.instagram { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); }
  .social-btn.tiktok { background: #000; }
  .social-btn.whatsapp { background: var(--whatsapp); }
  .testimonials-scroll { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
  .testimonials-scroll::-webkit-scrollbar { display: none; }
  .testimonials-scroll img { height: 220px; width: auto; border-radius: 12px; border: 1px solid var(--border-color); flex-shrink: 0; object-fit: cover; }
</style>
</head>
<body class="${theme.priceHats ? "theme-santa-hats" : ""}">
${renderFestiveDecor(theme)}
${renderSantaSleigh(theme)}
  <header>
    <div class="header-content">
      <div class="brand-info">
        <div class="logo-container">${store.logoUrl ? `<img src="${escapeHtml(store.logoUrl)}" alt="logo">` : ""}</div>
        <div>
          <h1 class="brand-title">${escapeHtml(store.name)}${store.isVerified ? `<span class="verified-badge" title="Tienda verificada">✔️</span>` : ""}</h1>
          <p class="brand-sub">Catálogo oficial</p>
          ${store.rif ? `<p class="brand-rif">RIF: ${escapeHtml(store.rif)}</p>` : ""}
        </div>
      </div>
      ${SHOW_APP_PROMO ? `<a class="promo-btn" href="${escapeHtml(APP_DOWNLOAD_URL)}" target="_blank" rel="noopener">📲 Crea tu catálogo</a>` : ""}
    </div>
  </header>

  <main>
    ${renderSocialCard(store)}
    ${renderTestimonialsSection(store)}
    <div class="search-box">
      <input type="text" id="searchInput" class="search-input" placeholder="Buscar productos..." oninput="filtrar()">
    </div>

    <div class="toolbar-row">
      <select class="sort-select" id="sortSelect" onchange="filtrar()">
        <option value="relevancia">Ordenar: relevancia</option>
        <option value="nuevo">Más nuevo primero</option>
        <option value="precio_asc">Precio: menor a mayor</option>
        <option value="precio_desc">Precio: mayor a menor</option>
      </select>
    </div>

    <div class="categories" id="catContainer">
      <button class="cat-btn active" onclick="filtrarCategoria('todas', this)">Todo</button>
      <button class="cat-btn fav-filter" onclick="filtrarCategoria('__favoritos__', this)">❤️ Favoritos</button>
      ${categoryButtonsHtml}
    </div>

    <div class="products-grid" id="grid"></div>

    <footer>
      <p>Catálogo generado con <strong>${escapeHtml(PLATFORM_NAME)}</strong></p>
      <p style="margin-top: 4px;"><a href="${escapeHtml(COMPANY_WEBSITE_URL)}" target="_blank" rel="noopener" style="color: var(--accent-gold); text-decoration: none; font-weight: 700;">${escapeHtml(COMPANY_NAME)}</a></p>
    </footer>
  </main>

  <div class="cart-bar" id="cartBar" onclick="abrirCarritoModal()">
    <div class="cart-info"><span>🛍️ <strong id="cartCount">0</strong> items</span> | <span class="cart-total" id="cartTotal">$0.00</span></div>
    <div class="cart-action-hint">Ver Carrito</div>
  </div>

  <div class="backdrop" id="backdrop" onclick="cerrarCarritoModal()"></div>

  <div class="cart-modal" id="cartModal">
    <div class="modal-header">
      <h3 class="modal-title">Bolsa de Compras</h3>
      <button class="close-modal" onclick="cerrarCarritoModal()">✕</button>
    </div>
    <div class="modal-body" id="cartModalBody"></div>
    <div class="modal-footer">
      <div class="modal-total-row"><span>Subtotal Estimado:</span><span id="modalTotalAmount" style="color: var(--primary);">$0.00</span></div>
      <button class="btn-checkout" onclick="enviarPedidoWhatsApp()">Enviar Pedido por WhatsApp 📲</button>
    </div>
  </div>

  <div class="lightbox" id="lightbox">
    <div class="lightbox-backdrop" onclick="cerrarLightbox()"></div>
    <div class="lightbox-content">
      <button class="lightbox-close" onclick="cerrarLightbox()">✕</button>
      <div class="lightbox-slides" id="lightboxSlides"></div>
      <div class="lightbox-dots" id="lightboxDots"></div>
      <div class="lightbox-info">
        <span class="product-cat" id="lightboxCat"></span>
        <h3 class="product-title" style="font-size:1rem;margin:4px 0;" id="lightboxName"></h3>
        <p class="product-price" style="font-size:1.1rem;" id="lightboxPrice"></p>
      </div>
    </div>
  </div>

  <div class="testimonial-lightbox" id="testimonialLightbox">
    <div class="testimonial-lightbox-backdrop" onclick="cerrarTestimonio()"></div>
    <div class="testimonial-lightbox-content">
      <button class="testimonial-lightbox-close" onclick="cerrarTestimonio()">✕</button>
      <img id="testimonialLightboxImg" src="" alt="Captura de comprador ampliada">
    </div>
  </div>

 <button class="agent-bubble" id="agentBubble" onclick="alternarPanelAgente()" aria-label="Chatear con el asistente de IA">
    🤖<span class="agent-bubble-badge">IA</span>
  </button>

  <div class="agent-panel" id="agentPanel">
    <div class="agent-panel-header">
      <div>
        <h4>Asistente de ${escapeHtml(store.name)}</h4>
        <span>Pregúntame por productos, precios o disponibilidad</span>
      </div>
      <button class="agent-panel-close" onclick="alternarPanelAgente()">✕</button>
    </div>
    <div class="agent-messages" id="agentMessages"></div>
    <div class="agent-input-row">
      <input type="text" id="agentInput" placeholder="Escribe tu mensaje..." onkeydown="if(event.key==='Enter') enviarMensajeAgente()">
      <button onclick="enviarMensajeAgente()" aria-label="Enviar">➤</button>
    </div>
  </div>

  <script>
    const SLUG = ${JSON.stringify(slug)};
    const productos = ${productsJson};
    let categoriaSeleccionada = 'todas';
    let carrito = {};

    // ---------- Favoritos (sin cuenta, guardados solo en este navegador) ----------
    const FAV_KEY = 'catalogo_favoritos_' + SLUG;
    function obtenerFavoritos() {
      try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch (e) { return []; }
    }
    function esFavorito(id) { return obtenerFavoritos().includes(id); }
    function alternarFavorito(id, event) {
      if (event) event.stopPropagation();
      let favs = obtenerFavoritos();
      if (favs.includes(id)) favs = favs.filter(f => f !== id);
      else favs.push(id);
      localStorage.setItem(FAV_KEY, JSON.stringify(favs));
      filtrar();
    }

    function calcularOferta(prod) {
      if (!prod.ofertaPct || !prod.ofertaFin || prod.ofertaFin <= Date.now()) return null;
      const precioFinal = prod.precio * (1 - prod.ofertaPct / 100);
      return { precioFinal, msRestante: prod.ofertaFin - Date.now() };
    }

    function formatearTiempoRestante(ms) {
      if (ms <= 0) return 'Termina en 0m';
      const totalMin = Math.floor(ms / 60000);
      const horas = Math.floor(totalMin / 60);
      const min = totalMin % 60;
      if (horas > 0) return \`Termina en \${horas}h \${min}m\`;
      return \`Termina en \${min}m\`;
    }

    function renderizar(lista) {
      const grid = document.getElementById('grid');
      grid.innerHTML = '';
      lista.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card' + (prod.destacado ? ' featured' : '');
        const oferta = calcularOferta(prod);
        const stockBajo = typeof prod.stock === 'number' && prod.stock > 0 && prod.stock <= 5;
        const favActivo = esFavorito(prod.id);
        const precioHtml = oferta
          ? \`<div class="sale-price-row"><span class="product-price">$\${oferta.precioFinal.toFixed(2)}</span><span class="price-original">$\${prod.precio.toFixed(2)}</span></div>
             <p class="sale-countdown" data-ofertafin="\${prod.ofertaFin}">\${formatearTiempoRestante(oferta.msRestante)}</p>\`
          : \`<p class="product-price">$\${prod.precio.toFixed(2)}</p>\`;
        card.innerHTML = \`
          <div>
            <div class="img-container" onclick="abrirLightbox('\${prod.id}')">
              <img src="\${prod.imagen}" alt="\${prod.nombre}" loading="lazy">
              <div class="badge-stack">
                <span class="tag-stock \${!prod.disponible ? 'out' : ''}">\${prod.disponible ? 'Disponible' : 'Agotado'}</span>
                \${prod.destacado ? '<span class="tag-featured">⭐ Destacado</span>' : ''}
                \${prod.nuevo ? '<span class="tag-new">🆕 Nuevo</span>' : ''}
                \${oferta ? '<span class="tag-sale">🔥 Oferta</span>' : ''}
                \${stockBajo ? \`<span class="tag-low-stock">¡Quedan \${prod.stock}!</span>\` : ''}
              </div>
              <button class="fav-btn" onclick="alternarFavorito('\${prod.id}', event)">\${favActivo ? '❤️' : '🤍'}</button>
            </div>
            <div class="product-info">
              <span class="product-cat">\${prod.categoria}</span>
              <h3 class="product-title">\${prod.nombre}</h3>
              \${precioHtml}
            </div>
          </div>
          \${prod.disponible ? \`
            <button class="btn-add" onclick="cambiarCantidad('\${prod.id}', 1)">\${carrito[prod.id] ? 'En bolsa (' + carrito[prod.id] + ')' : '+ Añadir'}</button>
          \` : '<button class="btn-add disabled" disabled>Agotado</button>'}
        \`;
        grid.appendChild(card);
      });
    }

    // Actualiza los contadores de oferta cada segundo sin recargar la página.
    // Si alguna oferta ya venció mientras el comprador tenía la página abierta,
    // se vuelve a renderizar la lista para que el precio regrese solo a la normal.
    setInterval(() => {
      let algunaVencio = false;
      document.querySelectorAll('.sale-countdown').forEach(el => {
        const fin = Number(el.dataset.ofertafin);
        const restante = fin - Date.now();
        if (restante <= 0) { algunaVencio = true; }
        else { el.innerText = formatearTiempoRestante(restante); }
      });
      if (algunaVencio) filtrar();
    }, 1000);

    function cambiarCantidad(id, delta) {
      if (!carrito[id]) { if (delta > 0) carrito[id] = 1; }
      else { carrito[id] += delta; if (carrito[id] <= 0) delete carrito[id]; }
      actualizarCarritoInterface();
      filtrar();
    }

    function eliminarDelCarrito(id) {
      delete carrito[id];
      actualizarCarritoInterface();
      filtrar();
    }

    function actualizarCarritoInterface() {
      const cartBar = document.getElementById('cartBar');
      const cartCount = document.getElementById('cartCount');
      const cartTotal = document.getElementById('cartTotal');
      const modalBody = document.getElementById('cartModalBody');
      const modalTotalAmount = document.getElementById('modalTotalAmount');
      let totalItems = 0, totalPrice = 0;
      modalBody.innerHTML = '';
      for (const id in carrito) {
        const prod = productos.find(p => p.id === id);
        if (prod) {
          const cantidad = carrito[id];
          totalItems += cantidad;
          totalPrice += prod.precio * cantidad;
          const row = document.createElement('div');
          row.className = 'cart-item-row';
          row.innerHTML = \`
            <div class="cart-item-details"><h4>\${prod.nombre}</h4><p>$\${prod.precio.toFixed(2)} c/u</p></div>
            <div class="cart-item-controls">
              <button class="qty-btn" onclick="cambiarCantidad('\${prod.id}', -1)">-</button>
              <span style="font-size:0.8rem;font-weight:700;min-width:16px;text-align:center;">\${cantidad}</span>
              <button class="qty-btn" onclick="cambiarCantidad('\${prod.id}', 1)">+</button>
              <button class="delete-btn" onclick="eliminarDelCarrito('\${prod.id}')">🗑️</button>
            </div>\`;
          modalBody.appendChild(row);
        }
      }
      if (totalItems === 0) {
        modalBody.innerHTML = '<p style="text-align:center;color:var(--text-muted);font-size:0.8rem;padding:25px 0;">Tu bolsa de compras está vacía.</p>';
        cerrarCarritoModal();
      }
      cartCount.innerText = totalItems;
      cartTotal.innerText = '$' + totalPrice.toFixed(2);
      modalTotalAmount.innerText = '$' + totalPrice.toFixed(2);
      cartBar.classList.toggle('visible', totalItems > 0);
    }

    function abrirCarritoModal() {
      if (Object.keys(carrito).length > 0) {
        document.getElementById('cartModal').classList.add('open');
        document.getElementById('backdrop').classList.add('active');
      }
    }
    function cerrarCarritoModal() {
      document.getElementById('cartModal').classList.remove('open');
      document.getElementById('backdrop').classList.remove('active');
    }

    async function enviarPedidoWhatsApp() {
      const items = Object.entries(carrito).map(([productId, quantity]) => ({ productId, quantity }));
      try {
        const res = await fetch('/api/catalogo/' + SLUG + '/pedidos', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items })
        });
        const data = await res.json();
        if (data.success) { window.location.href = data.data.whatsappLink; }
        else { alert(data.message || 'No se pudo crear el pedido.'); }
      } catch (e) { alert('No se pudo conectar. Intenta de nuevo.'); }
    }

    function abrirLightbox(id) {
      const prod = productos.find(p => p.id === id);
      if (!prod) return;
      const slidesEl = document.getElementById('lightboxSlides');
      const dotsEl = document.getElementById('lightboxDots');
      const medios = (prod.imagenes && prod.imagenes.length ? prod.imagenes : [prod.imagen]);
      slidesEl.innerHTML = medios.map(url => \`<div class="lightbox-slide"><img src="\${url}" alt="\${prod.nombre}" loading="lazy"></div>\`).join('')
        + (prod.video ? \`<div class="lightbox-slide"><video src="\${prod.video}" controls playsinline preload="metadata"></video></div>\` : '');
      const totalSlides = medios.length + (prod.video ? 1 : 0);
      dotsEl.innerHTML = totalSlides > 1
        ? medios.map((_, i) => \`<span class="lightbox-dot \${i === 0 ? 'active' : ''}"></span>\`).join('') + (prod.video ? '<span class="lightbox-dot"></span>' : '')
        : '';
      slidesEl.scrollLeft = 0;
      slidesEl.onscroll = () => {
        const idx = Math.round(slidesEl.scrollLeft / slidesEl.clientWidth);
        dotsEl.querySelectorAll('.lightbox-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
      };
      document.getElementById('lightboxCat').innerText = prod.categoria;
      document.getElementById('lightboxName').innerText = prod.nombre;
      document.getElementById('lightboxPrice').innerText = '$' + prod.precio.toFixed(2);
      document.getElementById('lightbox').classList.add('open');
    }
    function cerrarLightbox() {
      document.getElementById('lightbox').classList.remove('open');
      const video = document.querySelector('#lightboxSlides video');
      if (video) video.pause();
    }

    function abrirTestimonio(url) {
      document.getElementById('testimonialLightboxImg').src = url;
      document.getElementById('testimonialLightbox').classList.add('open');
    }

    function cerrarTestimonio() {
      document.getElementById('testimonialLightbox').classList.remove('open');
    }

    function filtrar() {
      const q = document.getElementById('searchInput').value.toLowerCase();
      let res = productos.filter(p => {
        const coincideTexto = p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q);
        if (categoriaSeleccionada === '__favoritos__') {
          return coincideTexto && esFavorito(p.id);
        }
        const coincideCat = categoriaSeleccionada === 'todas' || p.categoria === categoriaSeleccionada;
        return coincideTexto && coincideCat;
      });

      const orden = document.getElementById('sortSelect').value;
      if (orden === 'nuevo') {
        res = [...res].sort((a, b) => b.creadoEn - a.creadoEn);
      } else if (orden === 'precio_asc') {
        res = [...res].sort((a, b) => a.precio - b.precio);
      } else if (orden === 'precio_desc') {
        res = [...res].sort((a, b) => b.precio - a.precio);
      }

      renderizar(res);
    }

    function filtrarCategoria(cat, btn) {
      categoriaSeleccionada = cat;
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filtrar();
    }

    // ---------- Agente de ventas (chat con IA) ----------
    const AGENT_SESSION_KEY = 'catalogo_agente_sesion_' + SLUG;
    function obtenerBuyerSessionId() {
      let id = localStorage.getItem(AGENT_SESSION_KEY);
      if (!id) {
        id = (crypto.randomUUID ? crypto.randomUUID() : 'buyer-' + Date.now() + '-' + Math.random().toString(36).slice(2));
        localStorage.setItem(AGENT_SESSION_KEY, id);
      }
      return id;
    }

    let agentPanelAbierto = false;
    function alternarPanelAgente() {
      agentPanelAbierto = !agentPanelAbierto;
      document.getElementById('agentPanel').classList.toggle('open', agentPanelAbierto);
      if (agentPanelAbierto) document.getElementById('agentInput').focus();
    }

    function agregarBurbujaChat(rol, texto) {
      const cont = document.getElementById('agentMessages');
      const div = document.createElement('div');
      div.className = 'agent-msg ' + rol;
      div.innerText = texto;
      cont.appendChild(div);
      cont.scrollTop = cont.scrollHeight;
      return div;
    }

    // El agente maneja su propio carrito en el backend (borrador de compra);
    // aquí lo reflejamos en el carrito visual existente de la página para
    // que el comprador vea todo en un solo lugar y pueda pagar con el
    // flujo de WhatsApp que ya existe.
    function sincronizarCarritoDesdeAgente(cartItemsAgente) {
      if (!cartItemsAgente) return;
      cartItemsAgente.forEach(item => {
        carrito[item.productId] = item.quantity;
      });
      actualizarCarritoInterface();
      filtrar();
    }

    async function enviarMensajeAgente() {
      const input = document.getElementById('agentInput');
      const mensaje = input.value.trim();
      if (!mensaje) return;

      agregarBurbujaChat('user', mensaje);
      input.value = '';
      input.disabled = true;
      const typingEl = agregarBurbujaChat('typing', 'Escribiendo...');

      try {
        const resp = await fetch('/api/catalogo/' + encodeURIComponent(SLUG) + '/agente/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buyerSessionId: obtenerBuyerSessionId(), message: mensaje }),
        });
        typingEl.remove();

        if (!resp.ok) {
          agregarBurbujaChat('assistant', 'Hubo un problema respondiendo tu mensaje. Intenta de nuevo en un momento.');
          return;
        }

        const data = await resp.json();
        agregarBurbujaChat('assistant', data.reply);
        sincronizarCarritoDesdeAgente(data.cart);
      } catch (err) {
        typingEl.remove();
        agregarBurbujaChat('assistant', 'No pude conectarme. Revisa tu conexión e intenta de nuevo.');
      } finally {
        input.disabled = false;
        input.focus();
      }
    }

    renderizar(productos);
  </script>
</body>
</html>`;
}

function renderNotFoundPage(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Catálogo no encontrado</title>
<style>
  body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fcfbfa; color: #1a1a1a; text-align: center; }
  div { padding: 24px; }
  h1 { font-size: 22px; margin-bottom: 8px; }
  p { color: #757575; }
</style>
</head>
<body><div><h1>Este catálogo no existe</h1><p>Verifica que el link esté escrito correctamente.</p></div></body>
</html>`;
}
