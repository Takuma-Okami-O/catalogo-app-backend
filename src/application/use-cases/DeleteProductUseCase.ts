import {
  IProductRepository,
  IStoreRepository,
} from "../../domain/repositories/ICatalogRepositories";
import {
  ProductNotFoundError,
  StoreNotFoundError,
  ValidationError,
} from "../../domain/errors/AppError";

export interface DeleteProductInput {
  productId: string;
  requesterId: string;
}

export class DeleteProductUseCase {
  constructor(
    private readonly storeRepository: IStoreRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(input: DeleteProductInput): Promise<void> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new ProductNotFoundError();
    }

    const store = await this.storeRepository.findById(product.storeId);
    if (!store) {
      throw new StoreNotFoundError();
    }
    if (store.ownerId !== input.requesterId) {
      throw new ValidationError("No puedes eliminar productos de una tienda que no es tuya.");
    }

    await this.productRepository.delete(input.productId);
  }
}
