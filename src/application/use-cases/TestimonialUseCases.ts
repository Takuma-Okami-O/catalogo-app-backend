import { Store } from "../../domain/entities/Store";
import { IStoreRepository } from "../../domain/repositories/ICatalogRepositories";
import { StoreNotFoundError, ValidationError } from "../../domain/errors/AppError";

export class AddTestimonialUseCase {
  constructor(private readonly storeRepository: IStoreRepository) {}

  async execute(ownerId: string, imageUrl: string): Promise<Store> {
    const store = await this.storeRepository.findByOwnerId(ownerId);
    if (!store) throw new StoreNotFoundError();
    if (!imageUrl) throw new ValidationError("Falta la imagen de la captura.");

    store.addTestimonial(imageUrl);
    await this.storeRepository.save(store);
    return store;
  }
}

export class RemoveTestimonialUseCase {
  constructor(private readonly storeRepository: IStoreRepository) {}

  async execute(ownerId: string, imageUrl: string): Promise<Store> {
    const store = await this.storeRepository.findByOwnerId(ownerId);
    if (!store) throw new StoreNotFoundError();

    store.removeTestimonial(imageUrl);
    await this.storeRepository.save(store);
    return store;
  }
}
