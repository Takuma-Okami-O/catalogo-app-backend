import { Store } from "../../domain/entities/Store";
import { IStoreRepository } from "../../domain/repositories/ICatalogRepositories";
import { StoreNotFoundError, ValidationError } from "../../domain/errors/AppError";

export interface UpdateStoreSettingsInput {
  ownerId: string;
  name?: string;
  logoUrl?: string | null;
  whatsappPhone?: string;
  whatsappMessageTemplate?: string;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
}

/** Único punto de entrada para todo lo que el vendedor configura de su tienda
 *  (fuera de los productos): nombre, logo, WhatsApp, redes sociales. */
export class UpdateStoreSettingsUseCase {
  constructor(private readonly storeRepository: IStoreRepository) {}

  async execute(input: UpdateStoreSettingsInput): Promise<Store> {
    const store = await this.storeRepository.findByOwnerId(input.ownerId);
    if (!store) {
      throw new StoreNotFoundError();
    }

    if (input.whatsappPhone !== undefined && input.whatsappPhone.trim().length < 8) {
      throw new ValidationError("Debes indicar un número de WhatsApp válido.");
    }

    store.updateBranding({ name: input.name, logoUrl: input.logoUrl });
    store.updateSettings({
      whatsappPhone: input.whatsappPhone,
      whatsappMessageTemplate: input.whatsappMessageTemplate,
      instagramUrl: input.instagramUrl,
      tiktokUrl: input.tiktokUrl,
    });

    await this.storeRepository.save(store);
    return store;
  }
}
