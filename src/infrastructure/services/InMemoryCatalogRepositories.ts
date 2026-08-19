import { Store } from "../../domain/entities/Store";
import { Product } from "../../domain/entities/Product";
import { Order } from "../../domain/entities/Order";
import {
  IOrderRepository,
  IProductRepository,
  IStoreRepository,
  IStoreVisitRepository,
  IPremiumCodeRepository,
  PremiumCodeRecord,
} from "../../domain/repositories/ICatalogRepositories";

export class InMemoryStoreRepository implements IStoreRepository {
  private stores = new Map<string, Store>();

  async findById(id: string): Promise<Store | null> {
    return this.stores.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<Store | null> {
    for (const store of this.stores.values()) {
      if (store.slug === slug) return store;
    }
    return null;
  }

  async findByOwnerId(ownerId: string): Promise<Store | null> {
    for (const store of this.stores.values()) {
      if (store.ownerId === ownerId) return store;
    }
    return null;
  }

  async existsSlug(slug: string): Promise<boolean> {
    return (await this.findBySlug(slug)) !== null;
  }

  async save(store: Store): Promise<void> {
    this.stores.set(store.id, store);
  }

  async listAll(): Promise<Store[]> {
    return Array.from(this.stores.values());
  }

  async delete(id: string): Promise<void> {
    this.stores.delete(id);
  }
}

export class InMemoryProductRepository implements IProductRepository {
  private products = new Map<string, Product>();

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) ?? null;
  }

  async findByStoreId(storeId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter((p) => p.storeId === storeId);
  }

  async countByStoreId(storeId: string): Promise<number> {
    return (await this.findByStoreId(storeId)).length;
  }

  async save(product: Product): Promise<void> {
    this.products.set(product.id, product);
  }

  async delete(id: string): Promise<void> {
    this.products.delete(id);
  }
}

export class InMemoryOrderRepository implements IOrderRepository {
  private orders = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    this.orders.set(order.id, order);
  }

  async findByStoreId(storeId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter((o) => o.storeId === storeId);
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }
}

export class InMemoryStoreVisitRepository implements IStoreVisitRepository {
  private visits: Array<{ storeId: string; visitedAt: Date }> = [];

  async record(storeId: string): Promise<void> {
    this.visits.push({ storeId, visitedAt: new Date() });
  }

  async countByStoreId(storeId: string): Promise<number> {
    return this.visits.filter((v) => v.storeId === storeId).length;
  }

  async countLastNDaysByStoreId(storeId: string, days: number): Promise<Array<{ date: string; count: number }>> {
    const result: Array<{ date: string; count: number }> = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dateKey = day.toISOString().slice(0, 10);
      const count = this.visits.filter(
        (v) => v.storeId === storeId && v.visitedAt.toISOString().slice(0, 10) === dateKey
      ).length;
      result.push({ date: dateKey, count });
    }
    return result;
  }
}

export class InMemoryPremiumCodeRepository implements IPremiumCodeRepository {
  private codes = new Map<string, { durationDays: number; used: boolean }>();

  async create(code: string, durationDays: number): Promise<void> {
    this.codes.set(code, { durationDays, used: false });
  }

  async findByCode(code: string): Promise<PremiumCodeRecord | null> {
    const record = this.codes.get(code);
    return record ? { code, durationDays: record.durationDays, used: record.used } : null;
  }

  async markUsed(code: string): Promise<void> {
    const record = this.codes.get(code);
    if (record) record.used = true;
  }
}
