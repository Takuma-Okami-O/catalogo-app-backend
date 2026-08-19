import { Store } from "../../domain/entities/Store";
import { IStoreRepository } from "../../domain/repositories/ICatalogRepositories";
import { StoreNotFoundError, ValidationError } from "../../domain/errors/AppError";

export class StartFreeTrialUseCase {
  constructor(private readonly storeRepository: IStoreRepository) {}

  async execute(ownerId: string): Promise<Store> {
    const store = await this.storeRepository.findByOwnerId(ownerId);
    if (!store) {
      throw new StoreNotFoundError();
    }
    if (store.hasUsedTrial) {
      throw new ValidationError("Ya usaste tu prueba gratis de Premium en esta tienda.");
    }

    store.startFreeTrial();
    await this.storeRepository.save(store);
    return store;
  }
}
