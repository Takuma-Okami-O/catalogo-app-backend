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

    product.updateDetails({
      name: input.name,
      category: input.category,
      imageUrl: input.imageUrl,
      gifUrl: input.gifUrl,
      available: input.available,
    });

    await this.productRepository.save(product);
    return product;
  }
}
