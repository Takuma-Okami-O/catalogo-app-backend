import { Store } from "../../domain/entities/Store";
import { Product } from "../../domain/entities/Product";
import {
  IProductRepository,
  IStoreRepository,
} from "../../domain/repositories/ICatalogRepositories";
import { StoreNotFoundError } from "../../domain/errors/AppError";

export interface PublicCatalogOutput {
  store: ReturnType<Store["toPublicJSON"]>;
  products: ReturnType<Product["toJSON"]>[];
}

/**
 * Este es el caso de uso que resuelve la URL pública:
 * GET /catalogo/:slug -> catálogo en tiempo real de esa tienda.
 * No requiere autenticación: es lo que ve cualquier comprador con el link.
 */
export class GetPublicCatalogUseCase {
  constructor(
    private readonly storeRepository: IStoreRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(slug: string): Promise<PublicCatalogOutput> {
    const store = await this.storeRepository.findBySlug(slug);
    if (!store) {
      throw new StoreNotFoundError();
    }

    const products = await this.productRepository.findByStoreId(store.id);

    // Los productos destacados (Premium) siempre van primero en el catálogo
    // público, conservando el orden relativo dentro de cada grupo.
    const sorted = [...products].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));

    return {
      store: store.toPublicJSON(),
      products: sorted.map((p) => p.toJSON()),
    };
  }
}
