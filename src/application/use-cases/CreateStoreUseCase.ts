import { randomUUID } from "node:crypto";
import { Store, DEFAULT_PLAN_LIMITS } from "../../domain/entities/Store";
import { IStoreRepository } from "../../domain/repositories/ICatalogRepositories";
import { SlugAlreadyExistsError, ValidationError } from "../../domain/errors/AppError";

export interface CreateStoreInput {
  ownerId: string;
  name: string;
  whatsappPhone: string;
}

const DEFAULT_WHATSAPP_TEMPLATE =
  "¡Hola! {storeName}, quiero realizar el siguiente pedido:\n\n{items}\n\n*Total: ${total}*\n\nQuedo atento/a para coordinar pago y envío. ¡Gracias!";

export class CreateStoreUseCase {
  constructor(private readonly storeRepository: IStoreRepository) {}

  async execute(input: CreateStoreInput): Promise<Store> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError("El nombre del emprendimiento es obligatorio.");
    }
    if (!input.whatsappPhone || input.whatsappPhone.trim().length < 8) {
      throw new ValidationError("Debes indicar un número de WhatsApp válido.");
    }

    const slug = await this.generateUniqueSlug(input.name);

    const store = Store.create({
      id: randomUUID(),
      ownerId: input.ownerId,
      name: input.name.trim(),
      slug,
      logoUrl: null,
      whatsappPhone: input.whatsappPhone.trim(),
      whatsappMessageTemplate: DEFAULT_WHATSAPP_TEMPLATE,
      instagramUrl: null,
      tiktokUrl: null,
      testimonialUrls: [],
      currency: "USD",
      plan: "FREE",
      planExpiresAt: null,
      productLimit: DEFAULT_PLAN_LIMITS.FREE,
      hasUsedTrial: false,
      templateId: "clasica",
      rif: null,
      isVerified: false,
      createdAt: new Date(),
    });

    await this.storeRepository.save(store);
    return store;
  }

  /**
   * Genera el slug base a partir del nombre y le agrega un sufijo numérico
   * si ya existe, garantizando que el link público sea siempre único.
   * Ej: "Gaby Encantos" -> "gaby-encantos" -> "gaby-encantos-2" si colisiona.
   */
  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita acentos
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    if (!base) {
      throw new ValidationError("No se pudo generar un link a partir del nombre indicado.");
    }

    let candidate = base;
    let attempt = 1;
    const MAX_ATTEMPTS = 50;

    while (await this.storeRepository.existsSlug(candidate)) {
      attempt += 1;
      candidate = `${base}-${attempt}`;
      if (attempt > MAX_ATTEMPTS) {
        throw new SlugAlreadyExistsError(base);
      }
    }

    return candidate;
  }
}
