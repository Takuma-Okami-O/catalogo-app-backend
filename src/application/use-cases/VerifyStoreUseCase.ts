import { Store } from "../../domain/entities/Store";
import { IStoreRepository } from "../../domain/repositories/ICatalogRepositories";
import { StoreNotFoundError } from "../../domain/errors/AppError";

export interface VerifyStoreInput {
  storeId: string;
  rif: string | null;
  isVerified: boolean;
}

/**
 * Permite al super admin marcar una tienda como verificada (check verde) y
 * asignarle su RIF/cédula, luego de que el negocio lo contacte y pague
 * manualmente. No hay UI de super-admin en la app todavía: se llama por
 * backend directamente.
 */
export class VerifyStoreUseCase {
  constructor(private readonly storeRepository: IStoreRepository) {}

  async execute(input: VerifyStoreInput): Promise<Store> {
    const store = await this.storeRepository.findById(input.storeId);
    if (!store) {
      throw new StoreNotFoundError();
    }

    store.setVerification({ rif: input.rif, isVerified: input.isVerified });
    await this.storeRepository.save(store);

    return store;
  }
}
