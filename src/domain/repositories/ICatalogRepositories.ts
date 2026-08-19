import { Store } from "../entities/Store";
import { Product } from "../entities/Product";
import { Order } from "../entities/Order";

export interface IStoreRepository {
  findById(id: string): Promise<Store | null>;
  findBySlug(slug: string): Promise<Store | null>;
  findByOwnerId(ownerId: string): Promise<Store | null>;
  existsSlug(slug: string): Promise<boolean>;
  save(store: Store): Promise<void>;
  listAll(): Promise<Store[]>;
  delete(id: string): Promise<void>;
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findByStoreId(storeId: string): Promise<Product[]>;
  countByStoreId(storeId: string): Promise<number>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IOrderRepository {
  save(order: Order): Promise<void>;
  findByStoreId(storeId: string): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
}

export interface IStoreVisitRepository {
  record(storeId: string): Promise<void>;
  countByStoreId(storeId: string): Promise<number>;
  /** Cuenta de visitas agrupadas por día, de los últimos N días (más reciente primero). */
  countLastNDaysByStoreId(storeId: string, days: number): Promise<Array<{ date: string; count: number }>>;
}

export interface PremiumCodeRecord {
  code: string;
  durationDays: number;
  used: boolean;
}

export interface IPremiumCodeRepository {
  create(code: string, durationDays: number): Promise<void>;
  findByCode(code: string): Promise<PremiumCodeRecord | null>;
  markUsed(code: string, storeId: string): Promise<void>;
}
