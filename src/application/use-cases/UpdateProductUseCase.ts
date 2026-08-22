import {
  IProductRepository,
  IStoreRepository,
} from "../../domain/repositories/ICatalogRepositories";
import {
  ForbiddenError,
  ProductNotFoundError,
  StoreNotFoundError,
  ValidationError,
} from "../../domain/errors/AppError";
import { Product } from "../../domain/entities/Product";

export const MAX_FEATURED_PRODUCTS = 3;

export interface UpdateProductInput {
  productId: string;
  requesterId: string;
  name?: string;
  category?: string;
  price?: number;
  imageUrl?: string;
  gifUrl?: string | null;
  available?: boolean;
  isFeatured?: boolean;
  stockCount?: number | null;
  /** Oferta relámpago (Premium). Envía ambos juntos; null en los dos = desactivar la oferta. */
  saleDiscountPercent?: number | null;
  saleEndsAt?: string | null;
}

export class UpdateProductUseCase {
  constructor(
    private readonly storeRepository: IStoreRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(input: UpdateProductInput): Promise<Product> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new ProductNotFoundError();
    }

    const store = await this.storeRepository.findById(product.storeId);
    if (!store) {
      throw new StoreNotFoundError();
    }
    if (store.ownerId !== input.requesterId) {
      throw new ValidationError("No puedes modificar productos de una tienda que no es tuya.");
    }

    if (input.price !== undefined) {
      if (typeof input.price !== "number" || Number.isNaN(input.price) || input.price < 0) {
        throw new ValidationError("El precio debe ser un número mayor o igual a 0.");
      }
      product.updatePrice(input.price);
    }

    if (input.gifUrl !== undefined && input.gifUrl !== null && store.plan !== "PREMIUM") {
      throw new ForbiddenError(
        "Los GIFs animados son una función exclusiva del plan Premium."
      );
    }

    if (input.isFeatured !== undefined) {
      if (input.isFeatured && store.plan !== "PREMIUM") {
        throw new ForbiddenError(
          "Marcar productos como destacados es una función exclusiva del plan Premium."
        );
      }
      if (input.isFeatured && !product.isFeatured) {
        const storeProducts = await this.productRepository.findByStoreId(product.storeId);
        const currentlyFeatured = storeProducts.filter((p) => p.isFeatured).length;
        if (currentlyFeatured >= MAX_FEATURED_PRODUCTS) {
          throw new ValidationError(
            `Solo puedes tener hasta ${MAX_FEATURED_PRODUCTS} productos destacados a la vez. Quita uno antes de marcar otro.`
          );
        }
      }
      product.setFeatured(input.isFeatured);
    }

    if (input.stockCount !== undefined) {
      if (
        input.stockCount !== null &&
        (typeof input.stockCount !== "number" || Number.isNaN(input.stockCount) || input.stockCount < 0)
      ) {
        throw new ValidationError("El stock debe ser un número mayor o igual a 0, o vacío para no rastrearlo.");
      }
    }

    if (input.saleDiscountPercent !== undefined || input.saleEndsAt !== undefined) {
      if (store.plan !== "PREMIUM") {
        throw new ForbiddenError(
          "Las ofertas relámpago son una función exclusiva del plan Premium."
        );
      }
      const discountPercent = input.saleDiscountPercent ?? null;
      const endsAt = input.saleEndsAt ? new Date(input.saleEndsAt) : null;
      if (discountPercent !== null && endsAt === null) {
        throw new ValidationError("Debes indicar cuándo termina la oferta relámpago.");
      }
      if (discountPercent === null) {
        product.setFlashSale({ discountPercent: null, endsAt: null });
      } else {
        product.setFlashSale({ discountPercent, endsAt });
      }
    }

    product.updateDetails({
      name: input.name,
      category: input.category,
      imageUrl: input.imageUrl,
      gifUrl: input.gifUrl,
      available: input.available,
      stockCount: input.stockCount,
    });

    await this.productRepository.save(product);
    return product;
  }
}
