/**
 * Genera una referencia corta y legible ("REF-A3F9") a partir del ID
 * (UUID) del producto. Es determinística: el mismo producto SIEMPRE
 * genera la misma referencia, sin necesitar guardar ningún campo nuevo
 * en la base de datos.
 *
 * Uso: el vendedor la ve en su panel (para identificar rápido cuál
 * variante exacta le están pidiendo) y también se incluye en el mensaje
 * de WhatsApp de cada pedido — el comprador la ve de pasada en su propio
 * mensaje, pero nunca aparece impresa en la vitrina pública del catálogo.
 */
export function getProductRef(productId: string): string {
  return "REF-" + productId.replace(/-/g, "").slice(0, 4).toUpperCase();
}
