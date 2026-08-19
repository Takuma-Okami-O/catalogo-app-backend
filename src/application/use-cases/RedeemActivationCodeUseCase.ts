import { Store, DEFAULT_PLAN_LIMITS } from "../../domain/entities/Store";
import { IPremiumCodeRepository, IStoreRepository } from "../../domain/repositories/ICatalogRepositories";
import { StoreNotFoundError, ValidationError } from "../../domain/errors/AppError";

export class RedeemActivationCodeUseCase {
  constructor(
    private readonly storeRepository: IStoreRepository,
    private readonly codeRepository: IPremiumCodeRepository
  ) {}

  async execute(ownerId: string, rawCode: string): Promise<Store> {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      throw new ValidationError("Ingresa el código que te enviamos.");
    }

    const store = await this.storeRepository.findByOwnerId(ownerId);
    if (!store) {
      throw new StoreNotFoundError();
    }

    const record = await this.codeRepository.findByCode(code);
    if (!record) {
      throw new ValidationError("Ese código no existe. Verifica que lo escribiste bien.");
    }
    if (record.used) {
      throw new ValidationError("Ese código ya fue utilizado.");
    }

    const expiresAt = new Date(Date.now() + record.durationDays * 24 * 60 * 60 * 1000);
    store.changePlan("PREMIUM", DEFAULT_PLAN_LIMITS.PREMIUM, expiresAt);

    await this.storeRepository.save(store);
    await this.codeRepository.markUsed(code, store.id);

    return store;
  }
}
