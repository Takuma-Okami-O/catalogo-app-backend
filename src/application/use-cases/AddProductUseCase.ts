import { randomUUID } from "node:crypto";
import { Product } from "../../domain/entities/Product";
import {
  IProductRepository,
  IStoreRepository,
} from "../../domain/repositories/ICatalogRepositories";
import {
  ForbiddenError,
  ProductLimitExceededError,
  StoreNotFoundError,
  ValidationError,
} from "../../domain/errors/AppError";
import { MAX_FEATURED_PRODUCTS } from "./UpdateProductUseCase";

export interface AddProductInput {
  storeId: string;
  requesterId: string; // userId del vendedor autenticado, para validar propiedad
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  gifUrl?: string | null;
  isFeatured?: boolean;
}

export class AddProductUseCase {
  constructor(
    private readonly storeRepository: IStoreRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(input: AddProductInput): Promise<Product> {
    const store = await this.storeRepository.findById(input.storeId);
    if (!store) {
      throw new StoreNotFoundError();
    }

    if (store.ownerId !== input.requesterId) {
      throw new ValidationError("No puedes agregar productos a una tienda que no es tuya.");
    }

    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError("El nombre del producto es obligatorio.");
    }
    if (typeof input.price !== "number" || Number.isNaN(input.price) || input.price < 0) {
      throw new ValidationError("El precio debe ser un número mayor o igual a 0.");
    }
    if (!input.imageUrl) {
      throw new ValidationError("Debes agregar al menos una imagen del producto.");
    }

    // Regla de negocio premium: el GIF animado del producto es un beneficio
    // exclusivo del plan PREMIUM. Un vendedor FREE puede subir imagen, pero
    // no GIF — esto empuja la conversión al plan pago (ver ideas de premium
    // en PREMIUM_FEATURES.md).
    if (input.gifUrl && store.plan !== "PREMIUM") {
      throw new ForbiddenError(
        "Los GIFs animados son una función exclusiva del plan Premium. Actualiza tu plan para destacar este producto con animación."
      );
    }

    // Regla de negocio central del modelo de planes: Free = 20, Premium = 500
    // (ver DEFAULT_PLAN_LIMITS en Store.ts, ajustable por el super admin).
    const currentCount = await this.productRepository.countByStoreId(store.id);
    if (!store.canAddProduct(currentCount)) {
      throw new ProductLimitExceededError(store.productLimit, store.plan);
    }

    let isFeatured = false;
    if (input.isFeatured) {
      if (store.plan !== "PREMIUM") {
        throw new ForbiddenError(
          "Marcar productos como destacados es una función exclusiva del plan Premium."
        );
      }
      const storeProducts = await this.productRepository.findByStoreId(store.id);
      const currentlyFeatured = storeProducts.filter((p) => p.isFeatured).length;
      if (currentlyFeatured >= MAX_FEATURED_PRODUCTS) {
        throw new ValidationError(
          `Solo puedes tener hasta ${MAX_FEATURED_PRODUCTS} productos destacados a la vez. Quita uno antes de marcar otro.`
        );
      }
      isFeatured = true;
    }

    const product = Product.create({
      id: randomUUID(),
      storeId: store.id,
      name: input.name.trim(),
      category: input.category || "General",
      price: input.price,
      imageUrl: input.imageUrl,
      gifUrl: input.gifUrl ?? null,
      available: true,
      isFeatured,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.productRepository.save(product);
    return product;
  }
}
