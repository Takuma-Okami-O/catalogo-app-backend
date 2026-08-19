import { Store, DEFAULT_PLAN_LIMITS, PlanType } from "../../domain/entities/Store";
import {
  IProductRepository,
  IStoreRepository,
} from "../../domain/repositories/ICatalogRepositories";
import { StoreNotFoundError } from "../../domain/errors/AppError";

export interface StoreSummary {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: PlanType;
  productCount: number;
  createdAt: Date;
}

/** Vista general para el panel de super admin: lista todas las tiendas con su conteo de productos */
export class ListStoresUseCase {
  constructor(
    private readonly storeRepository: IStoreRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(): Promise<StoreSummary[]> {
    const stores = await this.storeRepository.listAll();

    return Promise.all(
      stores.map(async (store) => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        ownerId: store.ownerId,
        plan: store.plan,
        productCount: await this.productRepository.countByStoreId(store.id),
        createdAt: store.createdAt,
      }))
    );
  }
}

export interface ChangeStorePlanInput {
  storeId: string;
  newPlan: PlanType;
  /** Permite al super admin sobrescribir el límite por defecto del plan si lo desea */
  customLimit?: number;
  planDurationDays?: number; // solo aplica si newPlan === "PREMIUM"
}

export class ChangeStorePlanUseCase {
  constructor(private readonly storeRepository: IStoreRepository) {}

  async execute(input: ChangeStorePlanInput): Promise<Store> {
    const store = await this.storeRepository.findById(input.storeId);
    if (!store) {
      throw new StoreNotFoundError();
    }

    const limit = input.customLimit ?? DEFAULT_PLAN_LIMITS[input.newPlan];

    const expiresAt =
      input.newPlan === "PREMIUM"
        ? new Date(Date.now() + (input.planDurationDays ?? 30) * 24 * 60 * 60 * 1000)
        : null;

    store.changePlan(input.newPlan, limit, expiresAt);
    await this.storeRepository.save(store);

    return store;
  }
}
