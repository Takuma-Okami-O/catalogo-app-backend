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
  const spans = Array.from({ length: 14 })
    .map((_, i) => {
      const emoji = theme.decorEmojis![i % theme.decorEmojis!.length];
      const left = Math.round((i * 137.5) % 100); // distribución pseudo-aleatoria pero determinista
      const duration = 10 + (i % 5) * 3; // entre 10s y 22s
      const delay = (i % 7) * 1.3;
      const size = 1.1 + (i % 3) * 0.3;
      return `<span style="left:${left}%; animation-duration:${duration}s; animation-delay:${delay}s; font-size:${size}rem;">${emoji}</span>`;
    })
    .join("");
  return `<div class="festive-decor">${spans}</div>`;
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
  .festive-decor span { position: absolute; top: -40px; font-size: 1.6rem; opacity: 0.55; animation: festive-fall linear infinite; }
  @keyframes festive-fall {
    0% { transform: translateY(-40px) rotate(0deg); }
    100% { transform: translateY(110vh) rotate(360deg); }
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
<body>
${renderFestiveDecor(theme)}
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
      <img id="lightboxImg" src="" alt="">
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
      document.getElementById('lightboxImg').src = prod.imagen;
      document.getElementById('lightboxCat').innerText = prod.categoria;
      document.getElementById('lightboxName').innerText = prod.nombre;
      document.getElementById('lightboxPrice').innerText = '$' + prod.precio.toFixed(2);
      document.getElementById('lightbox').classList.add('open');
    }
    function cerrarLightbox() {
      document.getElementById('lightbox').classList.remove('open');
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
