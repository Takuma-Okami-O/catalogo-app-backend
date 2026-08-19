# Ideas para el Plan Premium (más allá de GIFs)

La meta es que el vendedor FREE **vea** lo que se pierde dentro de su propia
app (no solo lo lea en una tabla de precios). Prioridad sugerida:

## Nivel 1 — Fáciles de implementar con lo que ya existe (alto impacto)
1. **Múltiples fotos por producto (carrusel)** — FREE: 1 foto. PREMIUM: hasta 5 fotos + GIF.
   *(Ya tenemos `imageUrl`/`gifUrl` en Product; solo agregar `images: string[]`)*
2. **Producto destacado ("Spotlight")** — 1-3 productos fijados arriba del catálogo con badge "⭐ Destacado".
   Genera FOMO: "destaca tu producto estrella para que lo vean primero".
3. **Quitar la marca de agua/badge "Creado con [TuApp]"** — FREE lo muestra abajo del catálogo, PREMIUM no.
   Clásico driver de conversión en herramientas freemium (Canva, Linktree, etc.)
4. **Temas de color / personalización visual** — FREE: 1 tema fijo. PREMIUM: paleta de colores,
   fuente, y portada personalizada. Encaja directo con lo que ya pediste de "logo y nombre".
5. **Cupones de descuento** — código que el vendedor comparte ("PREMIUM10"), aplica % en el carrito
   antes de enviar a WhatsApp.

## Nivel 2 — Requieren algo más de desarrollo pero altísimo valor percibido
6. **Analíticas de catálogo** — visitas al link, producto más visto, producto más agregado al carrito
   (aunque no se compre). Los vendedores FREE ven un blur con "🔒 Disponible en Premium".
7. **Botón "Compartir en Instagram/Estados de WhatsApp"** con imagen pre-generada del producto.
8. **Notificación de bajo stock / "últimas unidades"** — badge automático si el vendedor marca
   cantidad limitada.
9. **Catálogo sin límite de categorías** — FREE: 3 categorías. PREMIUM: ilimitadas.
10. **Múltiples métodos de pago/contacto** — FREE: solo WhatsApp. PREMIUM: + Instagram, + link de pago
    (Mercado Pago / Zelle / etc.) mostrado en el checkout.

## Nivel 3 — Diferenciadores fuertes a mediano plazo
11. **Dominio personalizado** — en vez de `tuapp.com/catalogo/gaby-encantos`, permitir
    `catalogogaby.com` (requiere DNS, es más trabajo pero es un gran gancho B2B).
12. **Historial y export de pedidos en PDF/Excel** — FREE ve los últimos 10 pedidos, PREMIUM ve todo
    + exporta.
13. **Recordatorio automático al comprador** ("tu pedido sigue disponible") vía WhatsApp Business API
    (esto ya es una integración más compleja, dejar para v2).

## Regla de UX importante
En cada punto donde el vendedor FREE topa el límite (agregar 2da foto, agregar 4ta categoría,
crear cupón, etc.), la app **no debe simplemente bloquear el botón**: debe mostrar un modal breve
tipo "Esto es Premium 🌟" con 1 línea de beneficio y un botón "Actualizar plan" — igual que hicimos
con `ProductLimitExceededError` y `ForbiddenError` en el backend, que ya devuelven mensajes
listos para mostrar tal cual en ese modal.
