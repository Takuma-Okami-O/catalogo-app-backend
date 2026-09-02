/** Máximo de fotos de galería (sin contar la portada imageUrl). */
export const MAX_PRODUCT_IMAGES = 5;

export interface ProductProps {
  id: string;
  storeId: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  gifUrl: string | null;
  images: string[]; // Galería: fotos adicionales, además de imageUrl (portada)
  videoUrl: string | null; // Video corto del producto (opcional)
  available: boolean;
  isFeatured: boolean; // Premium: se muestra primero en el catálogo público con insignia ⭐
  stockCount: number | null; // null = no se rastrea (comportamiento clásico con "available")
  saleDiscountPercent: number | null; // Premium: oferta relámpago, 1-90
  saleEndsAt: Date | null; // Premium: hora en que termina la oferta relámpago
  createdAt: Date;
  updatedAt: Date;
}

export class Product {
  private constructor(private props: ProductProps) {}

  /**
   * Normaliza el nombre de categoría: recorta espacios, colapsa espacios
   * múltiples y capitaliza cada palabra. Así "ropa", "ROPA ", "ropa  " y
   * "Ropa" siempre terminan guardados como la MISMA categoría ("Ropa"),
   * evitando que el catálogo público muestre secciones/chips duplicados.
   */
  static normalizeCategory(raw: string): string {
    const cleaned = raw.trim().replace(/\s+/g, " ");
    if (!cleaned) return "General";
    return cleaned
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  static create(props: ProductProps): Product {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error("Product: el nombre es obligatorio.");
    }
    if (props.price < 0) {
      throw new Error("Product: el precio no puede ser negativo.");
    }
    if (props.stockCount !== null && props.stockCount !== undefined && props.stockCount < 0) {
      throw new Error("Product: el stock no puede ser negativo.");
    }
    if (
      props.saleDiscountPercent !== null &&
      props.saleDiscountPercent !== undefined &&
      (props.saleDiscountPercent <= 0 || props.saleDiscountPercent >= 100)
    ) {
      throw new Error("Product: el descuento de la oferta debe estar entre 1 y 99.");
    }
    if (!props.imageUrl) {
      throw new Error("Product: la imagen es obligatoria.");
    }
    if (props.images && props.images.length > MAX_PRODUCT_IMAGES) {
      throw new Error(`Product: máximo ${MAX_PRODUCT_IMAGES} fotos de galería.`);
    }
    return new Product({
      ...props,
      images: props.images ?? [],
      category: Product.normalizeCategory(props.category),
    });
  }

  get id() { return this.props.id; }
  get storeId() { return this.props.storeId; }
  get name() { return this.props.name; }
  get category() { return this.props.category; }
  get price() { return this.props.price; }
  get imageUrl() { return this.props.imageUrl; }
  get gifUrl() { return this.props.gifUrl; }
  get images() { return this.props.images; }
  get videoUrl() { return this.props.videoUrl; }
  get available() { return this.props.available; }
  get isFeatured() { return this.props.isFeatured; }
  get stockCount() { return this.props.stockCount; }
  get saleDiscountPercent() { return this.props.saleDiscountPercent; }
  get saleEndsAt() { return this.props.saleEndsAt; }
  get createdAt() { return this.props.createdAt; }

  /** Disponibilidad real: si se rastrea stock, manda el número; si no, manda el switch manual. */
  get isEffectivelyAvailable(): boolean {
    if (this.props.stockCount !== null) return this.props.stockCount > 0;
    return this.props.available;
  }

  /** true si la oferta relámpago sigue vigente en este momento. */
  get hasActiveSale(): boolean {
    return (
      this.props.saleDiscountPercent !== null &&
      this.props.saleEndsAt !== null &&
      this.props.saleEndsAt.getTime() > Date.now()
    );
  }

  /** Solo Premium. El caso de uso valida el plan y el límite de destacados antes de llamar esto. */
  setFeatured(isFeatured: boolean): void {
    this.props.isFeatured = isFeatured;
    this.props.updatedAt = new Date();
  }

  updatePrice(newPrice: number): void {
    if (newPrice < 0) throw new Error("Product: el precio no puede ser negativo.");
    this.props.price = newPrice;
    this.props.updatedAt = new Date();
  }

  updateDetails(input: {
    name?: string;
    category?: string;
    imageUrl?: string;
    gifUrl?: string | null;
    images?: string[];
    videoUrl?: string | null;
    available?: boolean;
    stockCount?: number | null;
  }): void {
    if (input.name !== undefined) this.props.name = input.name.trim();
    if (input.category !== undefined) this.props.category = Product.normalizeCategory(input.category);
    if (input.imageUrl !== undefined) this.props.imageUrl = input.imageUrl;
    if (input.gifUrl !== undefined) this.props.gifUrl = input.gifUrl;
    if (input.images !== undefined) {
      if (input.images.length > MAX_PRODUCT_IMAGES) {
        throw new Error(`Product: máximo ${MAX_PRODUCT_IMAGES} fotos de galería.`);
      }
      this.props.images = input.images;
    }
    if (input.videoUrl !== undefined) this.props.videoUrl = input.videoUrl;
    if (input.available !== undefined) this.props.available = input.available;
    if (input.stockCount !== undefined) {
      if (input.stockCount !== null && input.stockCount < 0) {
        throw new Error("Product: el stock no puede ser negativo.");
      }
      this.props.stockCount = input.stockCount;
    }
    this.props.updatedAt = new Date();
  }

  /** Solo Premium. El caso de uso valida el plan antes de llamar esto. */
  setFlashSale(input: { discountPercent: number | null; endsAt: Date | null }): void {
    if (input.discountPercent !== null && (input.discountPercent <= 0 || input.discountPercent >= 100)) {
      throw new Error("Product: el descuento de la oferta debe estar entre 1 y 99.");
    }
    this.props.saleDiscountPercent = input.discountPercent;
    this.props.saleEndsAt = input.endsAt;
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.props.id,
      storeId: this.props.storeId,
      name: this.props.name,
      category: this.props.category,
      price: this.props.price,
      imageUrl: this.props.imageUrl,
      gifUrl: this.props.gifUrl,
      images: this.props.images,
      videoUrl: this.props.videoUrl,
      available: this.props.available,
      isFeatured: this.props.isFeatured,
      stockCount: this.props.stockCount,
      isEffectivelyAvailable: this.isEffectivelyAvailable,
      saleDiscountPercent: this.hasActiveSale ? this.props.saleDiscountPercent : null,
      saleEndsAt: this.hasActiveSale ? this.props.saleEndsAt : null,
      createdAt: this.props.createdAt,
    };
  }
}
