import { Store } from "../../domain/entities/Store";
import { Product } from "../../domain/entities/Product";
import {
  IProductRepository,
  IStoreRepository,
} from "../../domain/repositories/ICatalogRepositories";
import { StoreNotFoundError } from "../../domain/errors/AppError";

export interface MyStoreOutput {
  store: ReturnType<Store["toOwnerJSON"]>;
  products: ReturnType<Product["toJSON"]>[];
}

/**
 * Resuelve GET /stores/me: dado el JWT del vendedor logueado, devuelve
 * su tienda (con datos de plan/límite, no solo lo público) y sus productos.
 * Esto es lo que alimenta la pantalla de Dashboard.
 */
export class GetMyStoreUseCase {
  constructor(
    private readonly storeRepository: IStoreRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(ownerId: string): Promise<MyStoreOutput> {
    const store = await this.storeRepository.findByOwnerId(ownerId);
    if (!store) {
      throw new StoreNotFoundError();
    }

    const products = await this.productRepository.findByStoreId(store.id);

    return {
      store: store.toOwnerJSON(),
      products: products.map((p) => p.toJSON()),
    };
  }
}
