import {
  IOrderRepository,
  IStoreRepository,
  IStoreVisitRepository,
} from "../../domain/repositories/ICatalogRepositories";
import { ForbiddenError, StoreNotFoundError } from "../../domain/errors/AppError";
import { getProductRef } from "../../domain/utils/productRef";

export interface TopProduct {
  productId: string;
  productName: string;
  ref: string;
  totalQuantity: number;
  timesOrdered: number;
}

export interface StoreStatsOutput {
  totalVisits: number;
  visitsLast7Days: Array<{ date: string; count: number }>;
  totalOrders: number;
  topProducts: TopProduct[];
}

export class GetStoreStatsUseCase {
  constructor(
    private readonly storeRepository: IStoreRepository,
    private readonly visitRepository: IStoreVisitRepository,
    private readonly orderRepository: IOrderRepository
  ) {}

  async execute(ownerId: string): Promise<StoreStatsOutput> {
    const store = await this.storeRepository.findByOwnerId(ownerId);
    if (!store) {
      throw new StoreNotFoundError();
    }
    if (store.plan !== "PREMIUM") {
      throw new ForbiddenError(
        "Las estadísticas de tu catálogo son una función exclusiva del plan Premium. Actualiza tu plan para ver visitas y productos más pedidos."
      );
    }

    const [totalVisits, visitsLast7Days, orders] = await Promise.all([
      this.visitRepository.countByStoreId(store.id),
      this.visitRepository.countLastNDaysByStoreId(store.id, 7),
      this.orderRepository.findByStoreId(store.id),
    ]);

    // Suma cuántas veces se pidió cada producto, a través de TODOS los pedidos.
    const tally = new Map<string, { productName: string; totalQuantity: number; timesOrdered: number }>();
    for (const order of orders) {
      for (const item of order.items) {
        const existing = tally.get(item.productId);
        if (existing) {
          existing.totalQuantity += item.quantity;
          existing.timesOrdered += 1;
        } else {
          tally.set(item.productId, {
            productName: item.productName,
            totalQuantity: item.quantity,
            timesOrdered: 1,
          });
        }
      }
    }

    const topProducts: TopProduct[] = Array.from(tally.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.productName,
        ref: getProductRef(productId),
        totalQuantity: data.totalQuantity,
        timesOrdered: data.timesOrdered,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    return { totalVisits, visitsLast7Days, totalOrders: orders.length, topProducts };
  }
}
