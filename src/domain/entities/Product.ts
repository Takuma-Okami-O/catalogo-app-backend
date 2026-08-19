export interface ProductProps {
  id: string;
  storeId: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  gifUrl: string | null;
  available: boolean;
  isFeatured: boolean; // Premium: se muestra primero en el catálogo público con insignia ⭐
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
    if (!props.imageUrl) {
      throw new Error("Product: la imagen es obligatoria.");
    }
    return new Product({ ...props, category: Product.normalizeCategory(props.category) });
  }

  get id() { return this.props.id; }
  get storeId() { return this.props.storeId; }
  get name() { return this.props.name; }
  get category() { return this.props.category; }
  get price() { return this.props.price; }
  get imageUrl() { return this.props.imageUrl; }
  get gifUrl() { return this.props.gifUrl; }
  get available() { return this.props.available; }
  get isFeatured() { return this.props.isFeatured; }

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
    available?: boolean;
  }): void {
    if (input.name !== undefined) this.props.name = input.name.trim();
    if (input.category !== undefined) this.props.category = Product.normalizeCategory(input.category);
    if (input.imageUrl !== undefined) this.props.imageUrl = input.imageUrl;
    if (input.gifUrl !== undefined) this.props.gifUrl = input.gifUrl;
    if (input.available !== undefined) this.props.available = input.available;
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
      available: this.props.available,
      isFeatured: this.props.isFeatured,
    };
  }
}
