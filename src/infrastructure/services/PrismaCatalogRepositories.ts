import { PrismaClient } from "@prisma/client";
import { Store } from "../../domain/entities/Store";
import { Product } from "../../domain/entities/Product";
import { Order } from "../../domain/entities/Order";
import {
  IStoreRepository,
  IProductRepository,
  IOrderRepository,
  IStoreVisitRepository,
  IPremiumCodeRepository,
  PremiumCodeRecord,
} from "../../domain/repositories/ICatalogRepositories";

export class PrismaStoreRepository implements IStoreRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Store | null> {
    const row = await this.prisma.store.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Store | null> {
    const row = await this.prisma.store.findUnique({ where: { slug } });
    return row ? this.toDomain(row) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Store | null> {
    const row = await this.prisma.store.findUnique({ where: { ownerId } });
    return row ? this.toDomain(row) : null;
  }

  async existsSlug(slug: string): Promise<boolean> {
    const count = await this.prisma.store.count({ where: { slug } });
    return count > 0;
  }

  async save(store: Store): Promise<void> {
    const data = {
      ownerId: store.ownerId,
      name: store.name,
      slug: store.slug,
      logoUrl: store.logoUrl,
      whatsappPhone: store.whatsappPhone,
      whatsappMessageTemplate: store.whatsappMessageTemplate,
      instagramUrl: store.instagramUrl,
      tiktokUrl: store.tiktokUrl,
      testimonialUrls: store.testimonialUrls,
      templateId: store.templateId,
      rif: store.rif,
      isVerified: store.isVerified,
      currency: store.currency,
      plan: store.plan,
      planExpiresAt: store.planExpiresAt,
      productLimit: store.productLimit,
      hasUsedTrial: store.hasUsedTrial,
    };
    await this.prisma.store.upsert({
      where: { id: store.id },
      create: { id: store.id, ...data },
      update: data,
    });
  }

  async listAll(): Promise<Store[]> {
    const rows = await this.prisma.store.findMany();
    return rows.map((r: any) => this.toDomain(r));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.store.delete({ where: { id } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(row: any): Store {
    return Store.create({
      id: row.id,
      ownerId: row.ownerId,
      name: row.name,
      slug: row.slug,
      logoUrl: row.logoUrl,
      whatsappPhone: row.whatsappPhone,
      whatsappMessageTemplate: row.whatsappMessageTemplate,
      instagramUrl: row.instagramUrl,
      tiktokUrl: row.tiktokUrl,
      testimonialUrls: row.testimonialUrls ?? [],
      currency: row.currency,
      plan: row.plan,
      planExpiresAt: row.planExpiresAt,
      productLimit: row.productLimit,
      hasUsedTrial: row.hasUsedTrial,
      templateId: row.templateId,
      rif: row.rif ?? null,
      isVerified: row.isVerified ?? false,
      createdAt: row.createdAt,
    });
  }
}

export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByStoreId(storeId: string): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({ where: { storeId } });
    return rows.map((r: any) => this.toDomain(r));
  }

  async countByStoreId(storeId: string): Promise<number> {
    return this.prisma.product.count({ where: { storeId } });
  }

  async save(product: Product): Promise<void> {
    const data = {
      storeId: product.storeId,
      name: product.name,
      category: product.category,
      price: product.price,
      imageUrl: product.imageUrl,
      gifUrl: product.gifUrl,
      images: product.images,
      videoUrl: product.videoUrl,
      available: product.available,
      isFeatured: product.isFeatured,
      stockCount: product.stockCount,
      saleDiscountPercent: product.saleDiscountPercent,
      saleEndsAt: product.saleEndsAt,
    };
    await this.prisma.product.upsert({
      where: { id: product.id },
      create: { id: product.id, ...data },
      update: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(row: any): Product {
    return Product.create({
      id: row.id,
      storeId: row.storeId,
      name: row.name,
      category: row.category,
      price: Number(row.price),
      imageUrl: row.imageUrl,
      gifUrl: row.gifUrl,
      images: row.images ?? [],
      videoUrl: row.videoUrl ?? null,
      available: row.available,
      isFeatured: row.isFeatured ?? false,
      stockCount: row.stockCount ?? null,
      saleDiscountPercent: row.saleDiscountPercent ?? null,
      saleEndsAt: row.saleEndsAt ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(order: Order): Promise<void> {
    await this.prisma.order.upsert({
      where: { id: order.id },
      create: {
        id: order.id,
        storeId: order.storeId,
        items: order.items as unknown as object,
        total: order.total,
        status: order.status,
      },
      update: { status: order.status },
    });
  }

  async findByStoreId(storeId: string): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r: any) => this.toDomain(r));
  }

  async findById(id: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(row: any): Order {
    return Order.create({
      id: row.id,
      storeId: row.storeId,
      items: row.items,
      status: row.status,
      buyerContact: row.buyerContact,
      createdAt: row.createdAt,
    });
  }
}

export class PrismaStoreVisitRepository implements IStoreVisitRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async record(storeId: string): Promise<void> {
    await this.prisma.storeVisit.create({ data: { storeId } });
  }

  async countByStoreId(storeId: string): Promise<number> {
    return this.prisma.storeVisit.count({ where: { storeId } });
  }

  async countLastNDaysByStoreId(storeId: string, days: number): Promise<Array<{ date: string; count: number }>> {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const visits = await this.prisma.storeVisit.findMany({
      where: { storeId, visitedAt: { gte: since } },
      select: { visitedAt: true },
    });

    const counts = new Map<string, number>();
    for (const v of visits) {
      const key = v.visitedAt.toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const result: Array<{ date: string; count: number }> = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dateKey = day.toISOString().slice(0, 10);
      result.push({ date: dateKey, count: counts.get(dateKey) ?? 0 });
    }
    return result;
  }
}

export class PrismaPremiumCodeRepository implements IPremiumCodeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(code: string, durationDays: number): Promise<void> {
    await this.prisma.premiumCode.create({ data: { code, durationDays } });
  }

  async findByCode(code: string): Promise<PremiumCodeRecord | null> {
    const row = await this.prisma.premiumCode.findUnique({ where: { code } });
    return row ? { code: row.code, durationDays: row.durationDays, used: row.used } : null;
  }

  async markUsed(code: string, storeId: string): Promise<void> {
    await this.prisma.premiumCode.update({
      where: { code },
      data: { used: true, usedByStoreId: storeId, usedAt: new Date() },
    });
  }
}
