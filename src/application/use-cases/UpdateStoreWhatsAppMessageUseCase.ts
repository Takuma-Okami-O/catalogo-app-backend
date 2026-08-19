import { Store } from "../../domain/entities/Store";
import { IStoreRepository } from "../../domain/repositories/ICatalogRepositories";
import { StoreNotFoundError, ValidationError } from "../../domain/errors/AppError";

export interface UpdateStoreWhatsAppMessageInput {
  storeId: string;
  whatsappMessageTemplate: string;
}

/**
 * Exclusivo del super admin: el vendedor ya NO puede editar el mensaje de
 * WhatsApp del pedido desde su app (para evitar que borre por accidente las
 * variables {storeName}/{items}/{total} y rompa el flujo de pedidos). Ahora
 * el super admin lo personaliza manualmente por tienda desde aquí.
 */
export class UpdateStoreWhatsAppMessageUseCase {
  constructor(private readonly storeRepository: IStoreRepository) {}

  async execute(input: UpdateStoreWhatsAppMessageInput): Promise<Store> {
    const store = await this.storeRepository.findById(input.storeId);
    if (!store) {
      throw new StoreNotFoundError();
    }

    const template = input.whatsappMessageTemplate.trim();
    if (template.length === 0) {
      throw new ValidationError("El mensaje de WhatsApp no puede quedar vacío.");
    }
    if (!template.includes("{items}")) {
      throw new ValidationError("El mensaje debe incluir la variable {items} para listar los productos del pedido.");
    }

    store.updateSettings({ whatsappMessageTemplate: template });
    await this.storeRepository.save(store);

    return store;
  }
}
