import { Store } from "../../domain/entities/Store";
import { IStoreRepository } from "../../domain/repositories/ICatalogRepositories";
import { StoreNotFoundError, ValidationError } from "../../domain/errors/AppError";
import { CATALOG_THEMES } from "../../infrastructure/http/routes/templates/catalogThemes";

export class ChangeStoreTemplateUseCase {
  constructor(private readonly storeRepository: IStoreRepository) {}

  async execute(ownerId: string, templateId: string): Promise<Store> {
    const store = await this.storeRepository.findByOwnerId(ownerId);
    if (!store) {
      throw new StoreNotFoundError();
    }
    if (!CATALOG_THEMES[templateId]) {
      throw new ValidationError(`La plantilla "${templateId}" no existe.`);
    }

    store.changeTemplate(templateId);
    await this.storeRepository.save(store);
    return store;
  }
}
